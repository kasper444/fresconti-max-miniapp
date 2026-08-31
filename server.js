/* Бэкенд мини-приложения «FRESCONTI» (MAX)
   - отдаёт статику мини-приложения (index.html, style.css, app.js, data.js, assets/)
   - принимает опт-заявки по POST /api/lead
   - валидирует initData (HMAC-SHA256) согласно документации MAX

   Запуск:  node server.js
   Переменные окружения:
     BOT_TOKEN  — токен бота MAX (для валидации initData; необязательно в демо)
     PORT       — порт (по умолчанию 3000)
*/
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const LEADS_FILE = path.join(__dirname, 'leads.json');

// ---------------- Валидация initData (по документации MAX) ----------------
function validateInitData(initData, botToken) {
  if (!initData || !botToken) return { ok: false, reason: 'no_data_or_token' };
  try {
    const params = initData.split('&').map((x) => x.split('='));
    if (params.filter((x) => x[0] === 'hash').length !== 1) return { ok: false, reason: 'bad_hash_count' };
    const originalHash = params.find((x) => x[0] === 'hash')[1];
    if (!originalHash) return { ok: false, reason: 'no_hash' };

    const decoded = params.map(([k, v]) => [k, decodeURIComponent(v)]);
    decoded.sort((a, b) => a[0].localeCompare(b[0]));
    const launchParams = decoded
      .filter((x) => x[0] !== 'hash')
      .map((x) => x[0] + '=' + x[1])
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const signature = crypto.createHmac('sha256', secretKey).update(launchParams).digest('hex');
    return { ok: signature === originalHash, reason: signature === originalHash ? null : 'bad_signature' };
  } catch (e) {
    return { ok: false, reason: 'exception: ' + e.message };
  }
}

// ---------------- Хранение заявок ----------------
function saveLead(lead) {
  let leads = [];
  try { leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8')); } catch (e) { leads = []; }
  lead.id = 'L' + Date.now().toString().slice(-6);
  lead.createdAt = new Date().toISOString();
  leads.push(lead);
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
  return lead.id;
}

// ---------------- Статика ----------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

function serveStatic(req, res) {
  let p = url.parse(req.url).pathname;
  if (p === '/') p = '/index.html';
  const file = path.join(__dirname, path.normalize(p));
  if (!file.startsWith(__dirname)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404 Not Found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

// ---------------- Сервер ----------------
const server = http.createServer((req, res) => {
  const method = req.method;
  const pathname = url.parse(req.url).pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  if (method === 'POST' && pathname === '/api/lead') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      let lead;
      try { lead = JSON.parse(body); } catch (e) { res.writeHead(400); return res.end('Bad JSON'); }

      if (BOT_TOKEN) {
        const v = validateInitData(lead.initData, BOT_TOKEN);
        if (!v.ok) {
          console.warn('⚠️  Отклонена заявка (невалидный initData):', v.reason);
          res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ error: 'invalid_init_data', reason: v.reason }));
        }
      } else {
        console.warn('⚠️  BOT_TOKEN не задан — initData не валидируется (демо-режим)');
      }

      const leadId = saveLead(lead);
      console.log('✅ Заявка ' + leadId + ': ' + lead.name + ' | ' + lead.contact + ' | ' + (lead.comment || '—'));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, leadId: leadId }));
    });
    return;
  }

  if (method === 'GET') return serveStatic(req, res);

  res.writeHead(405); res.end('Method Not Allowed');
});

server.listen(PORT, () => {
  console.log('🍅 Мини-приложение «FRESCONTI» запущено: http://localhost:' + PORT);
  console.log('   Приём опт-заявок: POST /api/lead');
  console.log(BOT_TOKEN ? '   Валидация initData: ВКЛЮЧЕНА' : '   Валидация initData: ВЫКЛЮЧЕНА (задайте BOT_TOKEN)');
});
