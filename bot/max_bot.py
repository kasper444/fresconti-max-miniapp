#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Чат-бот MAX «Tsar-sol» — консультант предприятия «Царицынские соленья» (FRESCONTI).

Работает по Long Polling (GET /updates) и отвечает через DeepSeek (LLM-консультант).
Секреты (токен MAX, ключ DeepSeek) берутся из DPAPI (secrets.py), либо из env:
  MAX_BOT_TOKEN, DEEPSEEK_API_KEY, MAX_BOT_LLM_MODEL.

Запуск:  python bot/max_bot.py
"""
import json
import os
import sys
import time
import urllib.request
import urllib.error
import re
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
try:
    from secrets import get_secret  # DPAPI (Windows)
except Exception:
    get_secret = lambda name: None

API = 'https://platform-api2.max.ru'
LLM_URL = 'https://api.deepseek.com/chat/completions'

MAX_TOKEN = get_secret('max_bot_token') or os.environ.get('MAX_BOT_TOKEN', '')
DEEPSEEK_KEY = get_secret('deepseek_api_key') or os.environ.get('DEEPSEEK_API_KEY', '')
LLM_MODEL = os.environ.get('MAX_BOT_LLM_MODEL', 'deepseek-chat')

HISTORY_LIMIT = 12  # сообщений на чат в контексте LLM
POLL_TIMEOUT = 2    # long polling, сек (короткий — сеть к API MAX нестабильна)


# ---------------- HTTP ----------------
def http(method, url, query=None, body=None, headers=None):
    if query:
        qs = '&'.join('%s=%s' % (k, urllib.request.quote(str(v))) for k, v in query.items() if v is not None)
        url = url + ('&' if '?' in url else '?') + qs
    data = json.dumps(body, ensure_ascii=False).encode('utf-8') if body is not None else None
    h = {'Content-Type': 'application/json'}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=POLL_TIMEOUT + 20) as r:
            raw = r.read()
        return json.loads(raw.decode('utf-8')) if raw else {}
    except urllib.error.HTTPError as e:
        try:
            detail = e.read().decode('utf-8')[:300]
        except Exception:
            detail = ''
        raise RuntimeError('HTTP %d %s %s' % (e.code, url, detail))


def max_headers():
    return {'Authorization': MAX_TOKEN}


def get_updates(marker=None):
    q = {'timeout': POLL_TIMEOUT, 'limit': 20, 'types': 'message_created,bot_started'}
    if marker:
        q['marker'] = marker
    return http('GET', API + '/updates', query=q, headers=max_headers())


def send_message(chat_id, text):
    return http('POST', API + '/messages', query={'chat_id': chat_id},
                body={'text': text}, headers=max_headers())


# ---------------- Каталог (контекст для LLM) ----------------
ROOT = Path(__file__).resolve().parent.parent


def load_catalog():
    """Читаем data.js + prices.json -> список товаров {name, vol, cat, price}."""
    text = (ROOT / 'data.js').read_text(encoding='utf-8')

    # категории: id -> название
    cats = {}
    cm = re.search(r"categories:\s*\[(.*?)\]\s*,", text, re.S)
    if cm:
        for c in re.finditer(r"id:\s*'([\w-]+)'\s*,\s*name:\s*'([^']+)'", cm.group(1)):
            cats[c.group(1)] = c.group(2)

    # товары: только секция products
    pm = re.search(r"products:\s*\[", text)
    prods_text = text[pm.end():] if pm else ''
    prods_text = prods_text.rsplit(']', 1)[0]

    prices = {}
    p = ROOT / 'prices.json'
    if p.exists():
        prices = json.loads(p.read_text(encoding='utf-8'))

    products = []
    for block in re.split(r"\n\s*\{\s*id:\s*'", prods_text)[1:]:
        def g(key):
            m = re.search(key + r":\s*'([^']*)'", block)
            return m.group(1) if m else ''
        pid = re.match(r"([\w-]+)'", block).group(1)
        pr = prices.get(pid) or {}
        products.append({
            'id': pid, 'name': g('name'), 'vol': g('vol'), 'cat': g('cat'),
            'price': pr.get('price'),
        })
    return products, cats


def catalog_context():
    products, cats = load_catalog()
    lines = []
    by_cat = {}
    for p in products:
        by_cat.setdefault(p['cat'], []).append(p)
    for cat, items in by_cat.items():
        lines.append('• ' + cats.get(cat, cat) + ':')
        for it in items:
            price = (' — ' + str(it['price']) + ' ₽') if it['price'] else ''
            lines.append('  - %s (%s)%s' % (it['name'], it['vol'], price))
    return '\n'.join(lines)


SYSTEM_PROMPT = """Ты — консультант предприятия «Царицынские соленья» (г. Волжский, бренд FRESCONTI).
Производитель премиальных солений, маринадов, соусов и консервов.

Отвечай вежливо, по-русски, кратко и по делу. Помогай клиентам:
- рассказывай о продукции и ценах (каталог ниже);
- подсказывай, где купить;
- консультируй по оптовым закупкам и производству под СТМ (собственная торговая марка);
- при необходимости давай контакты менеджера.

Не выдумывай факты и цены, которых нет в каталоге. Если чего-то не знаешь —
честно скажи и предложи связаться с менеджером.

ГДЕ КУПИТЬ (розница): Wildberries, бренд FRESCONTI — https://www.wildberries.ru/brands/310930370-fresconti

ОПТ / СТМ: заявки принимаем на info@zar-sol.ru (тема «Опт/СТМ»). Производство под вашу торговую марку, собственное сырьё.

КОНТАКТЫ:
- ООО «Царицынские соленья»
- Адрес: 404130, Волгоградская обл., г. Волжский, 1-й Базовый проезд, 5
- Телефон: +7 (8442) 609-277
- Email: info@zar-sol.ru
- Сайт: https://zar-sol.ru

КАТАЛОГ ПРОДУКЦИИ:
"""

GREETING = ('Здравствуйте! Я консультант предприятия «Царицынские соленья» — '
            'бренд FRESCONTI. Подскажу по продукции, ценам, где купить и оптовым '
            'закупкам. Что вас интересует?')


def ask_llm(history, user_text):
    messages = [{'role': 'system', 'content': SYSTEM_PROMPT + catalog_context()}]
    messages += history[-HISTORY_LIMIT:]
    messages.append({'role': 'user', 'content': user_text})
    body = {'model': LLM_MODEL, 'messages': messages, 'temperature': 0.5, 'max_tokens': 700}
    req = urllib.request.Request(LLM_URL, data=json.dumps(body, ensure_ascii=False).encode('utf-8'),
                                 headers={'Authorization': 'Bearer ' + DEEPSEEK_KEY,
                                          'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.loads(r.read().decode('utf-8'))
    return (d['choices'][0]['message']['content'] or '').strip()


# ---------------- Основной цикл ----------------
history = {}  # chat_id -> [{role, content}]


def handle_update(upd):
    utype = upd.get('update_type')
    chat_id = upd.get('chat_id')
    if not chat_id:
        return
    if utype == 'bot_started':
        send_message(chat_id, GREETING)
        return
    if utype != 'message_created':
        return
    msg = upd.get('message') or {}
    sender = msg.get('sender') or {}
    if sender.get('is_bot'):
        return
    text = ((msg.get('body') or {}).get('text') or '').strip()
    if not text:
        return

    h = history.setdefault(chat_id, [])
    try:
        reply = ask_llm(h, text)
    except Exception as e:
        print('[LLM error]', e)
        reply = ('Извините, произошла техническая ошибка. Пожалуйста, напишите '
                 'нам на info@zar-sol.ru — менеджер ответит.')
    h.append({'role': 'user', 'content': text})
    h.append({'role': 'assistant', 'content': reply})
    if len(h) > HISTORY_LIMIT * 2:
        del h[:-HISTORY_LIMIT * 2]
    send_message(chat_id, reply)
    print('[reply] chat %s: %s' % (chat_id, reply[:60].replace('\n', ' ')))


def main():
    if not MAX_TOKEN:
        print('ОШИБКА: нет токена MAX (max_bot_token в DPAPI или MAX_BOT_TOKEN).')
        sys.exit(1)
    if not DEEPSEEK_KEY:
        print('ОШИБКА: нет ключа DeepSeek (deepseek_api_key в DPAPI или DEEPSEEK_API_KEY).')
        sys.exit(1)

    # печатаем имя бота для проверки
    try:
        me = http('GET', API + '/me', headers=max_headers())
        print('Бот: %s (@%s) — запускаюсь.' % (me.get('name'), me.get('username')))
    except Exception as e:
        print('WARN: не удалось получить /me:', e)

    marker = None
    print('Консультант работает (Ctrl+C для остановки).')
    while True:
        try:
            data = get_updates(marker)
        except Exception as e:
            print('[updates error]', e)
            time.sleep(1)
            continue
        for upd in data.get('updates') or []:
            try:
                handle_update(upd)
            except Exception as e:
                print('[handle error]', e)
        if data.get('marker') is not None:
            marker = data['marker']
        time.sleep(1)


if __name__ == '__main__':
    main()
