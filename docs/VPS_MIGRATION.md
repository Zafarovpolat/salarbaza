# VPS Migration — Dekor Market

**Дата:** 2026-07-16  
**Текущий production:** Render + Supabase  
**Цель:** снизить расходы, улучшить latency в UZ, получить контроль над Valkey/ cron/ backups, подготовиться к доменам `dekormarket.uz`

## 1. Текущие расходы (июль 2026) — актуально

- **Render (starter, не free):**
  - `dekorhouse-api` (Node, starter $7/мес) — 512 MB RAM → 1 GB, без сна, Frankfurt
  - `dekorhouse-web` (Static, starter $7/мес) — CDN Render, кэш headers настроен
  - `bito-sync-full` + `bito-sync-incremental` (cron, starter $7/мес каждый) = $14/мес
  - Итого Render: $7+7+14 = **$28/мес** (раньше было free, теперь starter)

- **Supabase Pro $25/мес:**
  - Project `yjfyvedavmrdifmepvkh`, pooler `aws-1-ap-south-1` (Mumbai) + `supabase.co`
  - Postgres 8 GB, 100k MAU, 250 GB bandwidth, 100 GB storage, daily backups 7 дней
  - Storage `products` bucket + `edited/` prefix, public read, anon INSERT удалён
  - Сейчас: ~935 users (2 ADMIN), ~618 products? (Bito total 1927, но filtered excluded categories), ~2k images ~2-3 GB
  - Pro даёт отсутствие пауз (нет `Tenant not found`), лучше pooler, но всё равно latency UZ->Mumbai 120-180ms

- **Итого сейчас:** Render $28 + Supabase Pro $25 = **$53/мес**, но если считать только api+web+Supabase без cron = **$39/мес (35-40$ как ты сказал)**. Плюс Sentry free tier.

- **Проблемы текущих starter:** всё равно Frankfurt, нет Valkey (приходится memory cache), нет persistent disk для PG backups, Render static CDN слабый для UZ, Supabase storage bandwidth платный после лимита

## 2. Целевая архитектура (VPS)

```
Cloudflare (DNS + CDN + WAF)
  ├─ dekormarket.uz          -> landing (static) + WebApp deep links
  ├─ app.dekormarket.uz      -> frontend (React Vite) via Caddy
  ├─ api.dekormarket.uz      -> backend (Node Express) via Caddy
  └─ cdn.dekormarket.uz      -> R2 or Caddy serving /storage (images)

VPS (4 vCPU / 8 GB RAM, 80-100 GB NVMe):
  Docker Compose:
    - caddy (reverse proxy, auto TLS via Let's Encrypt, handles dekormarket.uz)
    - app frontend (Node 20 serving static dist, or Caddy directly serving dist)
    - api backend (Node 20, Express, Prisma)
    - postgres:17 (volume pgdata, backup cron)
    - valkey:8 (Redis-compatible, in-memory cache, no extra subscription)
    - bito-sync worker (incremental cron 10 * * * *, full 0 4 * * *)
    - backup worker (pg_dump + R2 upload, encrypted)
```

### Почему 4 vCPU / 8 GB

- Node backend: 1-2 workers, 1 GB RAM
- Postgres 17: 2 GB shared_buffers + work_mem, need 2-3 GB for 1k products + analytics events (растёт)
- Valkey: 256-512 MB, но spikes при cache warm
- Frontend: статика, почти 0 CPU, но Caddy + TLS
- Bito sync: Python, 500 MB peak при batch UPDATE
- Sharp image batch: CPU heavy, 1-2 vCPU во время batch
- Запас под рост: 4 vCPU / 8 GB — комфортный минимум, 2 vCPU / 4 GB будет впритык при image batch

## 3. Провайдеры сравнение

### Timeweb KZ (Казахстан)
- Плюсы: близость к UZ (Алматы, ~20-30ms), оплата в KZT, поддержка KZ, хорошая сеть в ЦА
- Минусы: дороже Hetzner, NVMe дороже
- Цена: ~$24-35/мес за 4vCPU/8GB/80GB
- Рекомендация: **кандидат №1 для UZ аудитории**, если бюджет позволяет

### Hetzner (Германия/Финляндия)
- Плюсы: дёшево ($12-18 за CPX31 4vCPU/8GB), надёжно, хорошая сеть, много доков
- Минусы: latency до UZ 90-120ms, но через Cloudflare ок, оплата только EUR/USD
- Цена: CPX31 ~€13, CPX41 ~€26
- Рекомендация: **best price/performance**, если latency не критичен

### Contabo (Германия)
- Плюсы: очень дёшево (4vCPU/8GB ~$8-12), много диска
- Минусы: оверселл CPU, нестабильный IO, support медленный, часто blacklist IP
- Цена: ~$8.5/мес VPS L
- Рекомендация: только для dev/staging, не production

### Локальные UZ VPS (BCC, Sarkor, UZCloud)
- Плюсы: минимальный latency 5-15ms в TAS-IX, Uzcard Payme интеграция
- Минусы: дорогой трафик наружу, нестабильная сеть за пределы UZ, нет snapshot удобных, мало RAM за деньги
- Цена: 4vCPU/8GB ~$40-60/мес
- Рекомендация: рассмотреть как CDN edge для картинок, но основной VPS держать в KZ/DE

**Итоговая рекомендация:** **Hetzner CPX31 (Helsinki)** + **Cloudflare** для старта, затем добавить Timeweb KZ как второй регион или мигрировать туда, если latency критичен. Для картинок — Cloudflare R2 (S3 совместимый, без egress fee).

## 4. Cloudflare R2 vs Supabase Storage

- **Сейчас:** Supabase Storage `products` bucket, prefix `edited/`, public read, anon INSERT удалён, upload только через backend с service_role. Проблемы: bandwidth лимит, нет CDN в UZ, нет преобразования
- **Цель:** R2 bucket `dekormarket-images`, домен `cdn.dekormarket.uz` через Cloudflare
  - Преимущества: $0 egress, автоматический CDN, cheaper storage $0.015/GB, можно включить Polish + WebP auto
  - Миграция: dual-write 1-2 недели (R2 primary, Supabase fallback), затем move
  - Caddy может проксировать R2 с cache

## 5. Docker Compose (черновик)

```yaml
services:
  caddy:
    image: caddy:2-alpine
    ports: ["80:80", "443:443"]
    volumes: ["./Caddyfile:/etc/caddy/Caddyfile", "caddy_data:/data", "caddy_config:/config"]
    restart: unless-stopped

  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: dekor
      POSTGRES_DB: dekormarket
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes: ["pgdata:/var/lib/postgresql/data", "./backups:/backups"]
    healthcheck: { test: ["CMD-SHELL", "pg_isready -U dekor"], interval: 5s, retries: 5 }
    restart: unless-stopped

  valkey:
    image: valkey/valkey:8-alpine
    command: ["valkey-server", "--maxmemory", "512mb", "--maxmemory-policy", "allkeys-lru"]
    volumes: ["valkeydata:/data"]
    restart: unless-stopped

  api:
    build: { context: ./backend, dockerfile: Dockerfile }
    environment:
      DATABASE_URL: postgres://dekor:${POSTGRES_PASSWORD}@postgres:5432/dekormarket
      DIRECT_URL: postgres://dekor:${POSTGRES_PASSWORD}@postgres:5432/dekormarket
      REDIS_URL: redis://valkey:6379
      BOT_TOKEN: ${BOT_TOKEN}
      ADMIN_TELEGRAM_IDS: ${ADMIN_TELEGRAM_IDS}
      SUPABASE_URL: ${SUPABASE_URL} # пока keep, для dual read
      SUPABASE_SERVICE_ROLE: ${SUPABASE_SERVICE_ROLE}
      FRONTEND_URL: https://app.dekormarket.uz
      SENTRY_DSN: ${SENTRY_DSN}
      SENTRY_ORG: dekorhouse
    depends_on: [postgres, valkey]
    restart: unless-stopped

  web:
    build: { context: ./frontend, dockerfile: Dockerfile, args: { VITE_API_URL: https://api.dekormarket.uz/api, VITE_SENTRY_DSN: ${VITE_SENTRY_DSN} } }
    # или просто Caddy serving dist
```

Caddyfile:
```
dekormarket.uz, www.dekormarket.uz {
  root * /srv/landing
  file_server
}
app.dekormarket.uz {
  root * /srv/web/dist
  try_files {path} /index.html
  file_server
}
api.dekormarket.uz {
  reverse_proxy api:3001
}
cdn.dekormarket.uz {
  reverse_proxy https://<r2_account>.r2.cloudflarestorage.com {
    header_up Host <r2_account>.r2.cloudflarestorage.com
  }
}
```

## 6. Домены и DNS

- Купить `dekormarket.uz` через ITTI.uz / billur.com (UZ домен требует юрлица или local contact)
- Cloudflare: NS `anna.ns.cloudflare.com`, `bob.ns...`
- DNS: A `dekormarket.uz` → VPS IP, CNAME `app` → `dekormarket.uz`, `api` → same, `cdn` → R2 (maybe CNAME to R2 custom domain)
- BotFather: `/setdomain` → `https://app.dekormarket.uz`, `/setmenubutton` URL → same, проверить deep links `https://t.me/DecorMarketUz_Bot?startapp=`
- TLS: Caddy auto Let's Encrypt, или Cloudflare Origin cert

## 7. Backups

- **DB:** cron daily 04:30 UTC `pg_dump -Fc dekor | gpg --encrypt -r backup@... > /backups/dekor-$(date +%F).dump.gpg` + upload to R2 `s3://dekormarket-backups/db/`
- Retention: 7 daily, 4 weekly, encrypted, test restore monthly
- **Images:** R2 versioning + lifecycle, plus Supabase bucket keep 30 дней как fallback
- **Restore drill:** раз в квартал на staging

## 8. Security Hardening (VPS)

- UFW: 22 (limit), 80, 443 only
- SSH: key only, disable root password, fail2ban
- Caddy: Helmet headers already in backend, add `X-Frame-Options`, `CSP` for frontend
- Env: `.env` 600, not in git, using Docker secrets
- Prisma: `directUrl` + pgbouncer? На VPS можно убрать pgbouncer, прямой PG
- Valkey: bind 127.0.0.1, no public port, password via `requirepass`
- Sentry scrub уже реализован (cookies, auth, x-telegram, bot token, service role, DB URL, phones)
- Rate limit: nginx/Caddy + express-rate-limit already

## 9. Monitoring

- **Uptime:** Better Uptime / UptimeRobot для `api/health`, `app/`, `cdn/`, `dekormarket.uz`
- **Logs:** Loki + Promtail or just `docker logs` + Grafana? На старте достаточно Winston + Sentry + `journalctl`
- **Metrics:** `node_exporter` + Postgres exporter + Valkey, Grafana dashboard
- **Alerts:** Telegram alert via Bot for DB down, Bito sync failure (уже есть), Sentry alerts to Telegram via webhook
- **Sentry:** frontend+backend уже подключены, traceSample 0.07 prod

## 10. Phased Migration

### Phase 0 — подготовка (1 день)
- Купить домен `dekormarket.uz`, настроить Cloudflare
- Поднять Hetzner VPS, установить Docker, Caddy, проверить TLS
- Вынести `salarbaza-secrets.env` → vault

### Phase 1 — move app, keep Supabase (2-3 дня) — **рекомендуемый первый шаг**
- Deploy backend+frontend на VPS, но `DATABASE_URL` остаётся Supabase pooler (как сейчас), `Supabase Storage` остаётся
- Это убирает Render free tier cold start, але сохраняет данные
- Тест: `app.dekormarket.uz` работает, бот deep links, `/admin/developer` health OK
- Rollback: просто переключить DNS обратно на `dekorhouse-web.onrender.com`

### Phase 2 — R2 (3-5 дней)
- Создать R2 bucket, подключить `cdn.dekormarket.uz`
- Dual-write upload: backend льёт и в Supabase, и в R2 (fallback)
- Batch migration существующих картинок: скопировать из Supabase Storage в R2 (скрипт `r2-migrate.ts`)
- Switch frontend `picture` to use R2 URLs, keep fallback to Supabase URL
- Наблюдение 3 дня, затем отключить Supabase upload

### Phase 3 — PostgreSQL (2-4 дня, самый рискованный)
- `pg_dump --no-owner` из Supabase (direct URL port 5432) → restore на VPS PG17
- Проверить `prisma migrate status`, `prisma generate`
- Rehearsal: staging restore + smoke tests (каталог, корзина, заказ, админка, Bito sync dry-run)
- Production cutover: остановить Bito cron, остановить API, final dump, restore, запустить API на VPS, запустить Bito cron на VPS, переключить DNS `api.dekormarket.uz`
- Старый Supabase оставить read-only 7 дней

### Phase 4 — Valkey + workers (1 день)
- Включить `REDIS_URL=redis://valkey:6379` в api, проверить `getCacheStats` показывает `redis`
- Перенести Bito cron с Render на VPS cron (systemd timer или Docker cron)
- Проверить Telegram notifications приходят

## 11. Rollback

- **Phase 1 rollback:** DNS `app.dekormarket.uz` CNAME → `dekorhouse-web.onrender.com`, `api.dekormarket.uz` → `dekorhouse-api.onrender.com`, 5 минут
- **Phase 2 rollback:** переключить env `STORAGE_PROVIDER=supabase`, Caddy `cdn` → Supabase URL, frontend уже имеет fallback old url
- **Phase 3 rollback:** `DATABASE_URL` → Supabase pooler (старый), restore не нужен, так как Supabase всё ещё имеет данные (если прошло <7 дней). Если прошло больше — restore из последнего R2 backup в Supabase (или локально)
- **Критерий отката:** health `/health` 5xx >3 мин, Bito sync errors 2 подряд, Sentry spike errors/min >100, order creation 5xx

## 12. 7-Day Observation (после каждой фазы)

- День 1-2: мониторинг Sentry issues, `/admin/developer` (DB, cache, Bito last sync), UptimeRobot, логи `docker logs api --tail=100`
- День 3: проверить conversion funnel в `/admin/analytics` — не упала ли конверсия
- День 7: сравнить расходы (Hetzner $ vs Render), latency (RUS, KZ, UZ), support tickets

## 13. Cost Estimate (месяц) — обновлено под starter + Pro

| Компонент | Render сейчас (starter+Pro) | VPS Hetzner + R2 | Timeweb KZ |
|---|---|---|---|
| API (Node) | $7 starter | $0 (в составе VPS) | $0 |
| Web (Static) | $7 starter | $0 (Caddy static) | $0 |
| Bito cron ×2 | $14 (2×$7 starter) | $0 (в том же VPS cron) | $0 |
| DB + Storage | Supabase Pro $25 (8 GB DB, 100 GB storage, backups) | PG self-hosted $0 + R2 storage $0.5-2 + egress $0 | same |
| Cache | memory only | Valkey self-hosted $0 | $0 |
| Domain + Cloudflare | $0 (onrender.com) + $12/год .uz | $12/год .uz + $0 Cloudflare free + $0 R2 egress | same |
| Sentry | free tier | free tier | free |
| **Итого без cron** | **$39 (7+7+25) = 35-40$ как сейчас** | ~$15-20 VPS | ~$26-40 VPS |
| **Итого с cron** | **$53 (7+7+14+25)** | ~$15-20 | ~$26-40 |

- **Сейчас платишь:** $39 без cron, $53 с cron, но без Valkey и с latency Frankfurt/Mumbai
- **На Hetzner CPX31 (4vCPU/8GB ~€13-15):** ~$15-18 + R2 $1-2 + домен $1 = **$17-20** против $39-53 = экономия **$20-35/мес**
- **На Timeweb KZ (4vCPU/8GB ~$24-35):** ~$27-37 vs $39-53, но latency в UZ 20-30ms vs 120ms, плюс оплата KZT
- **Вывод:** даже с Pro Supabase, VPS дешевле и даёт Valkey + backups + контроль

## 14. Definition of Done

- `https://dekormarket.uz` открывает landing, кнопка ведёт в `https://app.dekormarket.uz` и открывает Mini App в Telegram
- `https://app.dekormarket.uz` — React build, Sentry работает, `/admin/developer` зелёный, `api/health` ok
- `https://api.dekormarket.uz/api` — категории, продукты, корзина, заказ end-to-end, Telegram bot уведомления приходят, Bito sync cron шлёт Telegram summary
- `https://cdn.dekormarket.uz` — картинки 320/640/1200 WebP, `object-contain`, fallback old url
- `/admin/developer` показывает `provider: redis`, DB connected, migrations latest, Sentry configured, last Bito sync <2h
- Backups: `pg_dump.gpg` в R2 последние 7 дней, restore drill проведён на staging
- Monitoring: UptimeRobot + Sentry alerts + Telegram Bito alerts работают
- Rollback инструкция протестирована
- Старый Render + Supabase выключен после 7 дней наблюдения
