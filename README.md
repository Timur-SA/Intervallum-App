# Intervallum App

Мобильное приложение для подготовки к ОГЭ и ЕГЭ по физике.

## Связка с Intervallum-Core

Приложение берёт задания и проверяет ответы через **Intervallum-Core**.

По умолчанию Core доступен по адресу:

```text
http://127.0.0.1:8000
```

Если Core запущен на другом адресе, создайте `.env`:

```bash
cp .env.example .env
```

и укажите:

```text
VITE_CORE_API_URL=https://ваш-адрес-core
```

## Локальный запуск

Сначала запустите Core:

```bash
cd ../Intervallum-Core
docker compose up --build
```

Потом приложение:

```bash
cd ../Intervallum-App
npm ci
npm run dev
```

Открыть:

```text
http://127.0.0.1:3000
```

## Docker

Продакшен-сборка:

```bash
docker compose up --build
```

Разработка с сохранением `node_modules` между перезапусками:

```bash
docker compose -f docker-compose.dev.yml up
```

Если Core находится на другом сервере:

```bash
VITE_CORE_API_URL=https://core.example.com docker compose up --build
```

## Что уже связано с Core

- `POST /v2/select/train` — выбор 7 заданий на уровень.
- `POST /v2/grade` — проверка ответов, опыт и статус боссов.
- При недоступности Core приложение продолжает работать на локальном банке.

## Проверка

```bash
npm test -- --run
npm run build
```
