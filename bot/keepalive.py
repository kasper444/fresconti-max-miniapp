#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Keepalive-обёртка для бота FRESCONTI.

Перезапускает bot/max_bot.py при падении, пишет лог в logs/bot.log.
Запускается скрыто через bot/run_bot_hidden.vbs (pythonw, без консоли).
"""
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PY = r'C:\Users\1\AppData\Roaming\uv\python\cpython-3.11-windows-x86_64-none\python.exe'
LOG = ROOT / 'logs' / 'bot.log'
CREATE_NO_WINDOW = 0x08000000 if sys.platform == 'win32' else 0


def ts():
    return time.strftime('%Y-%m-%d %H:%M:%S')


def main():
    LOG.parent.mkdir(exist_ok=True)
    while True:
        with open(LOG, 'a', encoding='utf-8') as f:
            f.write('\n[keepalive] %s — запуск бота\n' % ts())
            f.flush()
            rc = subprocess.run(
                [PY, '-u', str(ROOT / 'bot' / 'max_bot.py')],
                cwd=str(ROOT), stdout=f, stderr=subprocess.STDOUT,
                creationflags=CREATE_NO_WINDOW,
            ).returncode
            f.write('[keepalive] %s — бот остановлен (код %d), перезапуск через 5 с\n'
                    % (ts(), rc))
            f.flush()
        time.sleep(5)


if __name__ == '__main__':
    main()
