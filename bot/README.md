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

## Круглосуточная работа

Бот — долгоживущий процесс, должен работать непрерывно. Варианты на Windows:

1. **NSSM (рекомендуется)** — служба Windows с автоперезапуском:
   `nssm install fresconti-bot "C:\...\python.exe" "C:\Users\1\fresconti-max-miniapp\bot\max_bot.py"`
2. **pm2**: `pm2 start bot/max_bot.py --interpreter python --name fresconti-bot`
3. **Планировщик задач** (запуск при входе).

Локально (в рамках сеанса Hermes) бот можно держать как фоновый процесс:
`python bot/max_bot.py &`.
