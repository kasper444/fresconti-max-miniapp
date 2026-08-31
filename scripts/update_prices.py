#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Парсер цен FRESCONTI с Wildberries.

Один запрос к поисковому API WB (по бренду) возвращает все SKU с ценами
в поле sizes[].price: `product` (текущая цена) и `basic` (цена без скидки),
в копейках. Парсер маппит их на id товаров из data.js и пишет prices.json.

Запуск:  python scripts/update_prices.py
"""
import json
import os
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_JS = os.path.join(REPO, 'data.js')
OUT = os.path.join(REPO, 'prices.json')

UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0 Safari/537.36')
DEST = '-1257786'  # регион доставки (Москва) — цены могут отличаться по региону


def search_url(page=1, spp=100):
    return ('https://search.wb.ru/exactmatch/ru/common/v7/search'
            '?ab_testing=false&appType=1&curr=rub&dest=' + DEST +
            '&query=fresconti&resultset=catalog&sort=popular'
            '&spp=' + str(spp) + '&page=' + str(page) +
            '&suppressSpellcheck=false')


def fetch_json(url, attempts=6):
    last = None
    for i in range(attempts):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
            with urllib.request.urlopen(req, timeout=30) as r:
                raw = r.read()
            return json.loads(raw.decode('utf-8'))
        except urllib.error.HTTPError as e:
            last = e
            # уважаем Retry-After (WB шлёт при 429), иначе экспоненциальный бэкофф
            retry_after = e.headers.get('Retry-After') if e.headers else None
            wait = float(retry_after) if retry_after else min(60, 4 * (2 ** i))
            time.sleep(wait)
        except Exception as e:  # таймаут / сеть
            last = e
            time.sleep(4 * (i + 1))
    raise last


def extract_wb_ids(data_js_path):
    """Из data.js: { productId -> wbId } для товаров с прямой ссылкой WB."""
    text = open(data_js_path, encoding='utf-8').read()
    ids = {}
    for block in re.split(r"\n\s*\{\s*id:\s*'", text)[1:]:
        m_id = re.match(r"([\w-]+)'", block)
        m_wb = re.search(r"wb:\s*'https://www\.wildberries\.ru/catalog/(\d+)/detail\.aspx'", block)
        if m_id and m_wb:
            ids[m_id.group(1)] = int(m_wb.group(1))
    return ids


def main():
    ids = extract_wb_ids(DATA_JS)
    if not ids:
        print('ERROR: не найдены WB-ссылки в data.js')
        sys.exit(1)

    # собрать цены по всем SKU (несколько страниц, чтобы накрыть все id)
    price_map = {}
    for page in (1, 2, 3):
        try:
            data = fetch_json(search_url(page=page))
        except Exception as e:
            print('WARN: страница %d не получена: %s' % (page, e))
            break
        products = data.get('products') or []
        if not products:
            break
        for p in products:
            pid = p.get('id')
            sizes = p.get('sizes') or []
            if not sizes:
                continue
            pr = sizes[0].get('price') or {}
            product_k = pr.get('product')
            if not product_k:
                continue
            basic_k = pr.get('basic')
            price_map[pid] = {
                'price': round(product_k / 100),
                'oldPrice': round(basic_k / 100) if (basic_k and basic_k > product_k) else None,
            }
        time.sleep(1)
        # если все нужные id найдены — дальше не ходим
        if all(wb in price_map for wb in ids.values()):
            break

    out = {
        '_updatedAt': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        '_dest': DEST,
    }
    found = 0
    for pid, wb in sorted(ids.items()):
        if wb in price_map:
            out[pid] = price_map[wb]
            found += 1

    # Защита от затирания: если не удалось получить ни одной цены
    # (лимит WB / сеть) — НЕ трогаем существующий prices.json.
    if found == 0:
        print('WARN: не получено ни одной цены (429/сеть) — prices.json не тронут.')
        sys.exit(1)  # ненулевой код — чтобы cron-задача увидела сбой

    # Сравниваем ТОЛЬКО цены (без _updatedAt/_dest), чтобы не коммитить
    # файл при каждом запуске из-за смены таймстампа.
    def price_part(d):
        return {k: v for k, v in d.items() if not k.startswith('_')}

    old = {}
    if os.path.exists(OUT):
        try:
            old = json.load(open(OUT, encoding='utf-8'))
        except Exception:
            old = {}

    if price_part(old) == price_part(out):
        print('Цены не изменились: %d/%d товаров (файл не тронут).' % (found, len(ids)))
        return

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print('Цены обновлены: %d/%d товаров -> %s' % (found, len(ids), OUT))
    if found < len(ids):
        missing = [pid for pid, wb in ids.items() if wb not in price_map]
        print('НЕ НАЙДЕНЫ на WB:', ', '.join(missing))


if __name__ == '__main__':
    main()
