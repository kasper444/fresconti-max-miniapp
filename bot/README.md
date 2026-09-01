# Чат-бот MAX «Tsar-sol» — консультант предприятия

Отвечает в чате MAX как консультант предприятия «Царицынские соленья» (бренд FRESCONTI):
продукция, цены, где купить, опт и СТМ. Ответы генерирует DeepSeek (LLM) на основе
каталога `data.js` + актуальных цен `prices.json`.

## Запуск

```bash
python bot/max_bot.py
```

Секреты берутся из DPAPI (`max_bot_token`, `deepseek_api_key`) или из env-переменных:
`MAX_BOT_TOKEN`, `DEEPSEEK_API_KEY`, `MAX_BOT_LLM_MODEL` (по умолчанию `deepseek-chat`).

## Как это работает

- Long Polling: `GET https://platform-api2.max.ru/updates` (маркер для инкремента).
- Ответ: `POST /messages?chat_id=<id>` с телом `{"text": "..."}`, заголовок `Authorization: <token>`.
- Контекст LLM: системный промпт консультанта + живой каталог (категории, цены) + история чата.

## Круглосуточная работа (настроено)

Бот работает через keepalive-обёртку `bot/keepalive.py` (перезапуск при падении, лог `logs/bot.log`),
которую скрыто запускает `bot/run_bot_hidden.vbs` (pythonw, без окна).

- **Автозапуск при входе в Windows**: `run_bot_hidden.vbs` скопирован в папку автозагрузки
  (`Start Menu\Programs\Startup\FrescontiBot.vbs`) — стартует при входе в систему, независимо от Hermes.
- **Запуск вручную**: `python bot/keepalive.py` или `wscript bot/run_bot_hidden.vbs`.
- Используется независимый Python (uv, 3.11.15) — не привязан к Hermes.

Чтобы остановить: закрыть процессы `pythonw.exe`/`python.exe` с этим сценарием и удалить
`FrescontiBot.vbs` из автозагрузки.
