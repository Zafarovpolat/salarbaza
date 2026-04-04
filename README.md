# 🏠 DecorMarket - Telegram Mini App

> Современное Telegram Mini App для продажи декоративных товаров для дома и сада в Узбекистане 🇺🇿

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.2-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-purple?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-latest-blue?logo=postgresql)](https://www.postgresql.org/)
[![Telegram](https://img.shields.io/badge/Telegram-Bot%20API-blue?logo=telegram)](https://core.telegram.org/bots/api)

> 🎉 **TZ 3.0 ЗАВЕРШЕНО:** Все функции ТЗ 3.0 реализованы — вариации размеров, оптовые цены, акции/промо, улучшенная админка. Обновлено: 4 апреля 2026.


---

## 📖 О проекте

**DecorMarket** — полнофункциональное Telegram Mini App для продажи декоративных товаров:

### 🛍️ Ассортимент
- 🪴 **Горшки и кашпо** — более 100+ SKU (пластик, металл, плетёные)
- 🌿 **Искусственные растения** — 20+ SKU (суккуленты, цветы, композиции)
- 🏗️ **Подставки для растений** — 50+ SKU (дерево, металл, многоярусные)

**Всего:** 170+ товаров с детальным описанием и фотографиями

### 🌍 Локализация
- 🇺🇿 **O'zbekcha** (Узбекский) — основной язык
- 🇷🇺 **Русский** — дополнительный язык
- 💰 **UZS** (сўм) — валюта

---

## ✨ Основные возможности

### 👥 Для покупателей
- 📦 **Каталог товаров** с фильтрами по категориям и цене
- 🔍 **Умный поиск** по названию и артикулу
- 🛒 **Корзина** с сохранением в localStorage
- 📋 **Оформление заказов** с выбором доставки/самовывоза
- ❤️ **Избранные товары** (сохраняются локально)
- 🌐 **Переключение языка** UZ ⇄ RU
- 📱 **Полная интеграция** с Telegram WebApp SDK
- 👤 **Личный кабинет** с историей заказов
- 🎨 **Выбор цветов** для товаров с вариантами
- 📏 **Выбор размеров** (S/M/L) с разными ценами
- 💰 **Оптовые цены** — автоматические скидки при количестве
- 🎁 **Акции и промо** — специальные предложения с таймером
- 🆕 **Новинки** — отдельная страница новых товаров
- ⭐ **Спецпредложения** — отдельная страница акций

### 👨‍💼 Для администратора
- 🤖 **Telegram Bot** для управления заказами
- 📬 **Мгновенные уведомления** о новых заказах
- ✅ **Подтверждение/отмена** заказов через inline-кнопки
- 📊 **Admin Panel** для управления товарами и категориями
- 📈 **Статистика заказов** и продаж
- 👥 **CRM база клиентов** с экспортом в CSV
- 📏 **Управление вариантами** размеров товаров
- 💰 **Шаблоны оптовых цен** по категориям
- 🎁 **Управление акциями** — создание, редактирование, привязка товаров
- 🏷️ **Массовое обновление** тегов товаров (featured/new/sale)

---

## 🛠️ Технологии

### Frontend
| Технология | Версия | Назначение |
|------------|--------|------------|
| **React** | 18.3.1 | UI Framework |
| **TypeScript** | 5.4.2 | Type Safety |
| **Vite** | 5.4.21 | Build Tool |
| **Tailwind CSS** | 3.4.19 | Styling |
| **Framer Motion** | 11.18.2 | Animations |
| **Zustand** | 4.5.7 | State Management |
| **React Router** | 6.30.2 | Routing |
| **@twa-dev/sdk** | 7.10.1 | Telegram WebApp |
| **Axios** | 1.13.2 | HTTP Client |

### Backend
| Технология | Версия | Назначение |
|------------|--------|------------|
| **Node.js** | 20.x | Runtime |
| **Express** | 4.18.3 | Web Framework |
| **PostgreSQL** | latest | Database |
| **Prisma** | 5.22.0 | ORM |
| **node-telegram-bot-api** | 0.64.0 | Telegram Bot |
| **Zod** | 3.22.4 | Validation |
| **Winston** | 3.12.0 | Logging |
| **Helmet** | 7.1.0 | Security |

---

## 🚀 Быстрый старт

### Требования
- **Node.js** 20+
- **PostgreSQL** (или Supabase)
- **Telegram Bot Token** (от [@BotFather](https://t.me/BotFather))

### Установка

```bash
# 1. Клонировать репозиторий
git clone https://github.com/Zafarovpolat/salarbaza.git
cd dekorhouse
```

#### Backend Setup

```bash
cd backend

# 2. Установить зависимости
npm install

# 3. Настроить переменные окружения
cp .env.example .env
# Отредактировать .env (см. раздел Environment Variables)

# 4. Настроить базу данных
npx prisma generate
npx prisma db push

# 5. Загрузить товары из JSON
npm run db:seed

# 6. Запустить сервер
npm run dev
# Сервер запустится на http://localhost:3001
```

#### Frontend Setup

```bash
# В новом терминале
cd frontend

# 7. Установить зависимости
npm install

# 8. Настроить переменные окружения
cp .env.example .env
# Отредактировать .env

# 9. Запустить dev server
npm run dev
# Приложение откроется на http://localhost:5173
```

---

## 🔧 Environment Variables

### Backend (`.env`)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dekorhouse
# Или Supabase:
# DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Telegram Bot
BOT_TOKEN=123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
ADMIN_CHAT_ID=123456789

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3001/api
VITE_BOT_USERNAME=YourBotUsername
```

### Как получить переменные

#### 1. DATABASE_URL

**Option A: Локальная PostgreSQL**
```bash
# После установки PostgreSQL
createdb dekorhouse
# URL: postgresql://postgres:password@localhost:5432/dekorhouse
```

**Option B: Supabase (рекомендуется)**
```
1. Зайти на supabase.com
2. Создать новый проект
3. Settings → Database → Connection string
4. Скопировать URI
```

#### 2. BOT_TOKEN и ADMIN_CHAT_ID

```
1. Открыть Telegram → @BotFather
2. Отправить /newbot
3. Следовать инструкциям
4. Получить BOT_TOKEN

Для ADMIN_CHAT_ID:
1. Открыть @userinfobot
2. Отправить /start
3. Получить свой ID

Для группы (рекомендуется):
1. Создать группу в Telegram
2. Добавить бота в группу как администратора
3. Отправить любое сообщение в группу
4. Открыть: https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
5. Найти "chat":{"id":-123456789} - это Chat ID (с минусом!)
```

### 🔧 Недавние исправления

#### Исправление падения сервера (02.02.2026)
- ✅ Улучшено логирование ошибок в Telegram боте
- ✅ Добавлены глобальные обработчики uncaught exceptions
- ✅ Исправлено логирование больших объектов Node.js

#### Исправление создания заказов (02.02.2026)
- ✅ Исправлен доступ к экземпляру Telegram бота
- ✅ Уведомления теперь работают корректно
- ✅ Добавлена поддержка геолокации в заказах
- ✅ Адрес теперь опционален если есть координаты
```

---

## 📁 Структура проекта

```
DecorMarket/
├── 📁 frontend/          # React Telegram Mini App
│   ├── src/
│   │   ├── components/   # 33+ компонентов (UI, Product, Cart, Order, Admin)
│   │   ├── pages/        # 28 страниц (15 пользовательских + 13 админ)
│   │   ├── store/        # 4 Zustand stores (cart, favorites, language, user)
│   │   ├── services/     # 8 API сервисов
│   │   ├── hooks/        # 5 custom hooks
│   │   └── types/        # TypeScript definitions
│   └── package.json
│
├── 📁 backend/           # Express API Server
│   ├── src/
│   │   ├── controllers/  # 5 контроллеров
│   │   ├── services/     # 6 сервисов (business logic)
│   │   ├── routes/       # 10 роутов (API endpoints)
│   │   ├── middleware/   # Auth, Error handling, Rate limiting
│   │   └── config/       # Database, Telegram config
│   ├── bot/              # Telegram Bot (index, handlers, commands, keyboards)
│   ├── prisma/
│   │   ├── schema.prisma # 16 моделей + 6 enums
│   │   └── seed.ts       # Database seeding
│   └── package.json
│
├── 📁 landing/           # Статическая маркетинговая страница
│   ├── index.html        # Одностраничный лендинг
│   └── design.md         # Дизайн-система (цвета, типографика, компоненты)
│
├── render.yaml           # Render deployment config
├── .gitignore
└── README.md             # Эта документация
```

---

## 🔌 API Endpoints

### Base URL
- **Development:** `http://localhost:3001/api`
- **Production:** `https://dekorhouse-api.onrender.com/api`

### Основные endpoints

| Группа | Method | Endpoint | Описание |
|--------|--------|----------|----------|
| **Categories** | GET | `/categories` | Список категорий |
| | GET | `/categories/:slug` | Детали категории |
| **Products** | GET | `/products` | Список товаров (пагинация, фильтры) |
| | GET | `/products/featured` | Популярные товары |
| | GET | `/products/new` | Новинки |
| | GET | `/products/sale` | Товары со скидкой |
| | GET | `/products/search?q=` | Поиск товаров |
| | GET | `/products/:id` | Товар по ID |
| | GET | `/products/:slug` | Товар по slug |
| | GET | `/products/:id/recommendations` | Рекомендации |
| **Cart** | GET | `/cart` | Получить корзину |
| | POST | `/cart/items` | Добавить товар |
| | PATCH | `/cart/items/:id` | Изменить количество |
| | DELETE | `/cart/items/:id` | Удалить товар |
| **Orders** | GET | `/orders` | История заказов |
| | POST | `/orders` | Создать заказ |
| | PATCH | `/orders/:id/cancel` | Отменить заказ |
| **User** | GET | `/user/profile` | Профиль |
| | PATCH | `/user/profile` | Обновить профиль |
| | GET | `/user/addresses` | Адреса доставки |
| | GET | `/user/favorites` | Избранные товары |
| **Promotions** | GET | `/promotions` | Активные акции |
| | GET | `/promotions/:slug` | Детали акции |
| **Wholesale** | GET | `/wholesale/product/:id` | Оптовые цены товара |
| | GET | `/wholesale/calculate` | Расчёт цены по количеству |
| **System** | GET | `/health` | Health check |

Полная документация API в [`project_review.md`](./project_review.md)

---

## 🗄️ База данных

### Prisma Schema

**16 моделей:**
- `User` - Пользователи Telegram
- `Address` - Адреса доставки
- `Category` - Категории товаров
- `Product` - Товары
- `ProductVariant` - Варианты размеров (S/M/L)
- `ProductImage` - Изображения товаров
- `ProductColor` - Цветовые варианты
- `Cart` - Корзина
- `CartItem` - Товары в корзине
- `Order` - Заказы
- `OrderItem` - Товары в заказе
- `Favorite` - Избранное
- `WholesalePriceTemplate` - Шаблоны оптовых скидок
- `WholesalePriceTier` - Пороги скидок
- `Promotion` - Акции и промо
- `PromotionProduct` - Связь акций с товарами

**6 Enums:**
- `PromotionStatus` (DRAFT, SCHEDULED, ACTIVE, INACTIVE)
- `PromotionType` (SALE, COLLECTION, LIMITED, NEW_ARRIVALS)
- `OrderStatus` (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED)
- `DeliveryType` (PICKUP, DELIVERY)
- `PaymentMethod` (CASH, CARD, PAYME, CLICK, UZUM)
- `PaymentStatus` (PENDING, PAID, FAILED, REFUNDED)

### Миграции

```bash
# Создать миграцию
npx prisma migrate dev --name init

# Применить миграции
npx prisma migrate deploy

# Открыть Prisma Studio
npm run db:studio
```

---

## 🤖 Telegram Bot

### Flow взаимодействия

1. **Пользователь запускает бота** (`/start`) → видит двуязычное приветствие
2. **Выбор языка** → O'zbekcha / Русский (сохраняется в БД)
3. **Повторный запуск** → если язык уже выбран, сразу показывается кнопка «Открыть магазин»
4. **Deep Link** → `/start category_xxx`, `/start product_xxx`, `/start promo_xxx` — прямой переход на нужную страницу
5. **Смена языка** → кнопка «Сменить язык» под кнопкой магазина

### Настройка бота

```bash
# 1. Создать бота через @BotFather
/newbot
# Следовать инструкциям

# 2. Настроить Menu Button
/setmenubutton
# URL: https://your-app-url.onrender.com
```

### Команды

| Команда | Описание |
|---------|----------|
| `/start` | Запуск бота (приветствие + выбор языка + deep link) |
| `/help` | Справка с контактами и кнопкой магазина |

### Deep Link параметры

| Параметр | Переход на страницу |
|----------|---------------------|
| `/start category_<slug>` | `/catalog/<slug>` |
| `/start product_<slug>` | `/product/<slug>` |
| `/start promo_<slug>` | `/promotion/<slug>` |

### Управление заказами (Admin)

Бот автоматически отправляет уведомления администратору о новых заказах:

- ✅ **Подтвердить** — `confirm_<orderId>` → статус CONFIRMED
- ❌ **Отменить** — `cancel_<orderId>` → статус CANCELLED
- 📦 **Готов** — `ship_<orderId>` → статус SHIPPED
- 🏠 **Доставлен** — `deliver_<orderId>` → статус DELIVERED
- 📋 **Детали** — `details_<orderId>` — показать информацию о заказе

---

## 🚀 Деплой на Render

### Автоматический деплой

Проект готов к деплою через `render.yaml`:

```bash
# 1. Push код на GitHub
git push origin main

# 2. Подключить репозиторий на render.com
# 3. Render автоматически создаст:
#    - dekorhouse-api (Backend Web Service)
#    - dekorhouse-web (Frontend Static Site)
```

### Ручной деплой

#### 1. Backend (Web Service)

```
Framework: Node
Build Command: npm install && npx prisma generate && npm run build
Start Command: npm start
Root Directory: backend

Environment Variables:
- DATABASE_URL (от Supabase/Railway)
- BOT_TOKEN (от @BotFather)
- ADMIN_CHAT_ID (ваш Telegram ID)
- FRONTEND_URL (https://dekorhouse-web.onrender.com)
- NODE_ENV=production
```

#### 2. Frontend (Static Site)

```
Build Command: npm install && npm run build
Publish Directory: dist
Root Directory: frontend

Environment Variables:
- VITE_API_URL (https://dekorhouse-api.onrender.com/api)
- VITE_BOT_USERNAME (название вашего бота)
```

#### 3. Database

**Рекомендация: Supabase**
```
1. Создать проект на supabase.com
2. Settings → Database → Connection string
3. Скопировать и добавить в Render env vars
```

После деплоя:
```bash
# Применить миграции
npx prisma migrate deploy

# Загрузить товары
npm run db:seed
```

---

## 📊 Статус проекта

### ✅ Готово к production

| Компонент | Статус | Прогресс |
|-----------|--------|----------|
| Frontend (User) | ✅ Готово | 100% |
| Frontend (Admin) | ✅ Готово | 100% |
| Backend API | ✅ Готово | 100% |
| Telegram Bot | ✅ Готово | 100% |
| Database Schema | ✅ Готово | 100% |
| Product Data | ✅ Готово | 163KB (170+ товаров) |
| Documentation | ✅ Готово | 100% |
| TZ 2.0 Features | ✅ Готово | 100% |
| TZ 3.0 Features | ✅ Готово | 100% |
| Landing Page | ✅ Готово | 100% |

### 🎯 Статус запуска

- ✅ Получить Telegram Bot Token
- ✅ Настроить PostgreSQL (Supabase)
- ✅ Загрузить реальные изображения товаров на CDN
- ✅ Настроить environment variables на Render
- ✅ Протестировать заказы end-to-end

**Проект готов к production использованию! 🚀**

---

## 🔒 Безопасность

Проект использует best practices безопасности:

- ✅ **Telegram WebApp Auth** - Валидация initData
- ✅ **Helmet** - HTTP security headers
- ✅ **Rate Limiting** - Защита от DDoS
- ✅ **CORS** - Настройка cross-origin
- ✅ **Zod Validation** - Валидация входных данных
- ✅ **Prisma ORM** - Защита от SQL injection
- ✅ **Environment Variables** - Секреты в .env

---

## 📚 Дополнительная документация

- 📄 [`project_review.md`](./project_review.md) - Детальный обзор проекта (старая версия)
- 📄 **Project Overview** - Полная техническая документация (artifact)
- 🔗 [Telegram Bot API](https://core.telegram.org/bots/api)
- 🔗 [Telegram WebApp](https://core.telegram.org/bots/webapps)
- 🔗 [Prisma Docs](https://www.prisma.io/docs)
- 🔗 [React Docs](https://react.dev)

---

## 🐛 Статус и планы

### ✅ Production Ready (Завершено)
1. ✅ **База данных** - PostgreSQL на Supabase настроена
2. ✅ **Изображения товаров** - Загружены в Supabase Storage (170+ товаров)
3. ✅ **Bot Token** - Telegram бот настроен и работает
4. ✅ **Webhook** - Telegram webhook настроен
5. ✅ **Admin Panel** - Админ-панель полностью функциональна
6. ✅ **Seed данных** - Все товары загружены в БД

### ✅ Завершено (TZ 2.0)
1. ✅ **Оптовые цены** - Шаблоны скидок, автоматический расчет
2. ✅ **Рекомендации товаров** - Алгоритм похожих товаров
3. ✅ **Улучшенный заказ** - Геолокация и расширенная форма
4. ✅ **База клиентов** - CRM функционал в админке
5. ✅ **Шаблоны категорий** - Автозаполнение описаний товаров

### ✅ Завершено (TZ 3.0)
1. ✅ **Вариации размеров** - S/M/L с разными ценами для одного товара
2. ✅ **Оптовые цены по категориям** - Шаблоны привязаны к категориям
3. ✅ **Акции и промо** - CRUD акций, привязка товаров, автоактивация по датам
4. ✅ **Новые страницы** - Новинки, Спецпредложения, страница акции
5. ✅ **Массовое обновление тегов** - Bulk tags для featured/new/sale
6. ✅ **Сброс статусов** - Массовый сброс isFeatured/isNew/isSpecialOffer
7. ✅ **Landing page** - Маркетинговая страница с дизайн-системой

### 🔹 Низкий приоритет (Будущее)
1. 🔹 **Payment Integration** - Интеграция Payme/Click/Uzum
2. 🔹 **Favorites Sync** - Синхронизация избранного с сервером
3. 🔹 **Redis Cache** - Кэширование для производительности
4. 🔹 **Advanced Analytics** - Расширенная статистика
5. 🔹 **PWA Support** - Offline support

---

## 🤝 Разработка

### Запуск в dev режиме

```bash
# Terminal 1: Backend
cd backend
npm run dev
# API: http://localhost:3001

# Terminal 2: Frontend
cd frontend
npm run dev
# App: http://localhost:5173
```

### Build для production

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

### Правила кода

- ✅ TypeScript strict mode
- ✅ ESLint rules
- ✅ Prettier formatting
- ✅ Conventional commits

---

## 📈 Roadmap

### Phase 1: MVP ✅ (завершено)
- ✅ Базовый функционал каталога
- ✅ Корзина и оформление заказов
- ✅ Telegram Bot для администратора
- ✅ Admin Panel (MVP)

### Phase 2: TZ 2.0 Features ✅ (ЗАВЕРШЕНО)
- [x] **Оптовые цены** - автоматический расчет скидок при увеличении количества ✅
- [x] **Рекомендации товаров** - показ похожих товаров на странице продукта ✅
- [x] **Улучшенный заказ** - форма с именем, фамилией, телефоном, геолокацией ✅
- [x] **Уведомления в группу** - детальная информация о заказе с локацией клиента ✅
- [x] **Админ: оптовые шаблоны** - создание шаблонов скидок для товаров ✅
- [x] **Админ: база клиентов** - история заказов и статистика по клиентам ✅
- [x] **Админ: шаблоны категорий** - автозаполнение описаний при создании товаров ✅

### Phase 3: TZ 3.0 Features ✅ (ЗАВЕРШЕНО)
- [x] **Вариации размеров** - S/M/L с разными ценами ✅
- [x] **Оптовые цены по категориям** - шаблоны привязаны к категориям ✅
- [x] **Акции и промо** - CRUD, привязка товаров, автоактивация ✅
- [x] **Страница новинок** - /new-arrivals ✅
- [x] **Страница спецпредложений** - /special-offers ✅
- [x] **Страница акции** - /promotion/:slug ✅
- [x] **Массовое обновление тегов** - bulk tags ✅
- [x] **Landing page** - маркетинговая страница ✅

### Phase 4: Marketing (в планах)
- [ ] SEO оптимизация
- [ ] Telegram Analytics
- [ ] Реферальная программа
- [ ] Промокоды и скидки

### Phase 5: Scale (в планах)
- [ ] Redis caching
- [ ] CDN для изображений
- [ ] Микросервисная архитектура
- [ ] Advanced admin analytics

---

## 💡 Советы по разработке

### Полезные команды

```bash
# Очистить кэш
npm run clean

# Проверить типы
npm run type-check

# Запустить миграции
npx prisma migrate dev

# Сбросить БД
npx prisma migrate reset

# Генерация Prisma Client
npx prisma generate

# Открыть Prisma Studio
npm run db:studio
```

### Отладка

```bash
# Backend logs
tail -f backend/logs/error.log

# Check database connection
npx prisma db pull

# Test API endpoints
curl http://localhost:3001/api/health
```

---

## 📝 Лицензия

MIT License

Copyright (c) 2026 DecorMarket Team

Свободное использование для коммерческих и личных целей.

---

## 👥 Контакты

**Проект:** DecorMarket Telegram Mini App  
**Версия:** 3.0.0 (TZ 3.0 Complete)  
**Последнее обновление:** Апрель 4, 2026

**Stack:** React + TypeScript + Node.js + PostgreSQL + Telegram Bot API

---

## 🎉 Благодарности

- [React Team](https://react.dev) - За отличный UI фреймворк
- [Prisma](https://www.prisma.io) - За удобный ORM
- [Telegram](https://telegram.org) - За платформу Mini Apps
- [Render](https://render.com) - За бесплатный хостинг

---

<div align="center">

**🏠 DecorMarket** - Сделано с ❤️ для Узбекистана 🇺🇿

[Report Bug](https://github.com/Zafarovpolat/salarbaza/issues) · 
[Request Feature](https://github.com/Zafarovpolat/salarbaza/issues) · 
[Documentation](./project_review.md)

</div>
