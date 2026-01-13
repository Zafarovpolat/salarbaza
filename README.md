# 🏠 DekorHouse

> Telegram Mini App для продажи декоративных товаров для дома и сада

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-purple)](https://www.prisma.io/)

## 📖 О проекте

**DekorHouse** — это Telegram Mini App для продажи:
- 🪴 Горшков и кашпо
- 🌿 Искусственных растений
- 🏗️ Подставок для растений

Целевой рынок: **Узбекистан** 🇺🇿

## ✨ Возможности

- 📦 Каталог товаров с фильтрами и поиском
- 🛒 Корзина с сохранением в localStorage
- 📋 Оформление заказов с выбором доставки/самовывоза
- ❤️ Избранные товары
- 🌐 Мультиязычность (UZ/RU)
- 📱 Полная интеграция с Telegram WebApp SDK
- 🤖 Telegram Bot для управления заказами (admin)

## 🛠️ Технологии

### Frontend
- **React 18** + TypeScript + Vite
- **Tailwind CSS** для стилей
- **Framer Motion** для анимаций
- **Zustand** для state management
- **@twa-dev/sdk** для Telegram WebApp

### Backend
- **Node.js 20** + Express
- **Prisma** + PostgreSQL
- **node-telegram-bot-api** для бота
- **Zod** для валидации
- **Winston** для логирования

## 🚀 Быстрый старт

### Требования
- Node.js 20+
- PostgreSQL
- Telegram Bot Token (от @BotFather)

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/your-username/dekorhouse.git
cd dekorhouse

# Backend
cd backend
npm install
cp .env.example .env
# Настроить переменные в .env
npx prisma generate
npx prisma db push
npm run db:seed  # Загрузка товаров
npm run dev

# Frontend (новый терминал)
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dekorhouse
BOT_TOKEN=your_telegram_bot_token
ADMIN_CHAT_ID=your_telegram_id
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_BOT_USERNAME=YourBotUsername
```

## 📁 Структура проекта

```
salarbaza/
├── frontend/          # React SPA
│   ├── src/
│   │   ├── components/   # 28 компонентов
│   │   ├── pages/        # 12 страниц
│   │   ├── store/        # 4 Zustand stores
│   │   ├── services/     # API сервисы
│   │   └── ...
│   └── package.json
│
├── backend/           # Express API
│   ├── src/
│   │   ├── controllers/  # 5 контроллеров
│   │   ├── services/     # 6 сервисов
│   │   ├── routes/       # API routes
│   │   └── ...
│   ├── bot/           # Telegram Bot
│   ├── prisma/        # DB schema
│   ├── data/          # JSON данные товаров
│   └── package.json
│
├── render.yaml        # Render deploy config
└── project_review.md  # Детальный обзор проекта
```

## 🔌 API Endpoints

| Endpoint | Описание |
|----------|----------|
| `GET /api/categories` | Список категорий |
| `GET /api/products` | Список товаров (пагинация, фильтры) |
| `GET /api/products/search?q=` | Поиск товаров |
| `GET /api/cart` | Получить корзину |
| `POST /api/orders` | Создать заказ |
| `GET /api/user/profile` | Профиль пользователя |

Подробнее в [project_review.md](./project_review.md)

## 🤖 Telegram Bot

Административные команды:
- `/start` - Запуск бота
- `/catalog` - Открыть каталог
- `/cart` - Корзина
- `/orders` - Мои заказы

Администратор получает уведомления о новых заказах с inline-кнопками для подтверждения/отмены.

## 🚀 Деплой

Проект готов к деплою на **Render**:

```bash
# Деплой через render.yaml
render deploy
```

Или ручной деплой:
1. Создать PostgreSQL базу данных
2. Задеплоить backend как Web Service
3. Задеплоить frontend как Static Site
4. Настроить переменные окружения

## 📝 Лицензия

MIT

## 👥 Авторы

DekorHouse Team
