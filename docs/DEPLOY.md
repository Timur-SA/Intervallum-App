# Запуск Intervallum-App с Intervallum-Core через Docker и Caddy

## Схема

```text
Браузер
  │  https://app.example.com
  ▼
Caddy :443
  ├── /v2/*  → 127.0.0.1:8000  (Intervallum-Core, FastAPI)
  └── /*     → 127.0.0.1:3000  (Intervallum-App, nginx)
```

Или через отдельный поддомен:

```text
app.example.com  → 127.0.0.1:3000
core.example.com → 127.0.0.1:8000
```

Важно: `127.0.0.1` в Caddyfile — это **localhost сервера**, а не компьютера
пользователя. Браузер обращается только к `https://app.example.com`, а уже
Caddy на сервере идёт в Core. Если Caddy запущен в Docker-сети, вместо
`127.0.0.1` используйте имя сервиса, например `core:8000`.

## 1. Запустить Core

```bash
cd Intervallum-Core
docker compose up -d --build
```

Проверить:

```bash
curl http://127.0.0.1:8000/v2/health
```

Ожидаемый ответ:

```json
{"status":"ok","track":"9","tasks":77,"topics":20,"sections":3,"content_ok":true}
```

Core должен слушать порт `8000`. Наружу его лучше не открывать — доступ
идёт через Caddy.

## 2. Собрать App с адресом Core

Адрес Core передаётся **на этапе сборки** Vite, а не в runtime.

### Вариант A — один домен, Core за `/v2`

```bash
cd Intervallum-App
docker compose up -d --build
```

`VITE_CORE_API_URL` можно не задавать: App обращается к `/v2` на своём же
домене, Caddy отправляет эти запросы в Core. Это лучший вариант — браузер
не ходит на `127.0.0.1` и не спрашивает доступ к локальной сети.

### Вариант B — отдельный поддомен для Core

```bash
cd Intervallum-App
VITE_CORE_API_URL=https://core.example.com \
  docker compose up -d --build
```

## 3. Caddyfile

### Вариант A — один домен

```caddyfile
app.example.com {
    encode zstd gzip

    handle /v2/* {
        reverse_proxy 127.0.0.1:8000
    }

    handle {
        reverse_proxy 127.0.0.1:3000
    }
}
```

### Вариант B — два поддомена

```caddyfile
app.example.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3000
}

core.example.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:8000
}
```

Применить:

```bash
sudo cp Caddyfile /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy сам выпустит HTTPS-сертификат, если DNS домена указывает на сервер,
а порты 80 и 443 открыты.

## 4. Проверка

```bash
curl -I https://app.example.com
curl https://app.example.com/v2/health
```

Для варианта B:

```bash
curl https://core.example.com/v2/health
```

Открыть приложение:

```text
https://app.example.com
```

Выбрать уровень. Если Core доступен, задания и проверка ответов идут через
`/v2/select/train` и `/v2/grade`. Если Core недоступен, приложение
переключается на локальный банк; запросы ограничены таймаутом 2.5 секунды.

## 5. Локальная разработка

Core:

```bash
cd Intervallum-Core
docker compose up --build
```

App с сохранением `node_modules`:

```bash
cd Intervallum-App
docker compose -f docker-compose.dev.yml up
```

Или без Docker:

```bash
npm ci
npm run dev
```

В dev-режиме Vite сам проксирует `/v2` на `http://127.0.0.1:8000`, поэтому
`VITE_CORE_API_URL` не нужен.

## 6. Типовые ошибки

### `Core` не отвечает

```bash
docker compose -f Intervallum-Core/docker-compose.yml ps
docker compose -f Intervallum-Core/docker-compose.yml logs -f api
```

### После изменения `VITE_CORE_API_URL` ничего не поменялось

Vite вшивает переменную в сборку. Нужно пересобрать App:

```bash
docker compose build --no-cache intervallum-app
docker compose up -d
```

### Caddy не выпускает сертификат

Проверить DNS:

```bash
dig +short app.example.com
```

Проверить порты 80/443 и логи Caddy:

```bash
sudo journalctl -u caddy -f
```

### Долгая проверка задания

Сейчас `fetch` имеет таймаут 2.5 секунды, после чего срабатывает локальный
fallback. Если задержка больше — проверьте, что Core реально доступен по
указанному `VITE_CORE_API_URL`.
