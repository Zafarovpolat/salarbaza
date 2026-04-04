import TelegramBot from 'node-telegram-bot-api'
import { config } from '../src/config'
import { getLanguageKeyboard, getOpenShopKeyboard } from './keyboards'
import { prisma } from '../src/config/database'

// Приветствие (шаг 1) — двуязычное, без выбора языка
const WELCOME_TEXT = `
🌿 Assalomu alaykum, Decor House botiga xush kelibsiz!
Здравствуйте, добро пожаловать в бот Decor House!

Bu yerda siz dekor mahsulotlarimizni ko'rib chiqishingiz va onlayn do'konimizga o'tishingiz mumkin.
Здесь вы можете посмотреть наши декоративные товары и перейти в интернет-магазин.
`.trim()

// Вопрос о языке (шаг 2)
const LANG_QUESTION = `🌐 Qaysi tilda davom ettirish sizga qulay?\nНа каком языке вам удобнее продолжить?`

export async function handleStart(
  bot: TelegramBot,
  msg: TelegramBot.Message
) {
  const chatId   = msg.chat.id
  const telegramId = msg.from?.id

  // Парсим deep link параметр (/start category_xxx и тд)
  const text      = msg.text || ''
  const match     = text.match(/\/start\s+(.+)/)
  const startParam = match ? match[1] : null

  // ── Если есть deep link — сразу открываем нужную страницу ──────────────
  if (startParam) {
    let webAppUrl = config.frontendUrl

    if (startParam.startsWith('category_')) {
      const slug = startParam.replace('category_', '')
      webAppUrl  = `${config.frontendUrl}/catalog/${slug}`
    } else if (startParam.startsWith('product_')) {
      const slug = startParam.replace('product_', '')
      webAppUrl  = `${config.frontendUrl}/product/${encodeURIComponent(slug)}`
    } else if (startParam.startsWith('promo_')) {
      const slug = startParam.replace('promo_', '')
      webAppUrl  = `${config.frontendUrl}/promotion/${slug}`
    }

    const isHttps = config.frontendUrl.startsWith('https://')
    if (isHttps) {
      await bot.sendMessage(chatId, WELCOME_TEXT, {
        reply_markup: {
          inline_keyboard: [[{ text: '🛒 Ochish', web_app: { url: webAppUrl } }]],
        },
      })
    } else {
      await bot.sendMessage(chatId, `${WELCOME_TEXT}\n\n🔗 ${webAppUrl}`)
    }
    return
  }

  // ── Проверяем, выбирал ли пользователь язык ранее ──────────────────────
  if (telegramId) {
    try {
      const user = await prisma.user.findUnique({
        where: { telegramId: BigInt(telegramId) },
        select: { language: true },
      })

      // Если пользователь уже выбирал язык — сразу показываем магазин
      if (user?.language) {
        const lang = user.language as 'uz' | 'ru'
        await bot.sendMessage(chatId, WELCOME_TEXT)
        await bot.sendMessage(
          chatId,
          lang === 'uz'
            ? `Til: O'zbekcha ✅\n\nDo'konni ochish uchun quyidagi tugmani bosing:`
            : `Язык: Русский ✅\n\nЧтобы открыть магазин, нажмите кнопку ниже:`,
          { reply_markup: getOpenShopKeyboard(lang) }
        )
        return
      }
    } catch {
      // Пользователь не найден — продолжаем стандартный flow
    }
  }

  // ── Стандартный flow: приветствие → выбор языка ────────────────────────
  await bot.sendMessage(chatId, WELCOME_TEXT)
  await bot.sendMessage(chatId, LANG_QUESTION, {
    reply_markup: getLanguageKeyboard(),
  })
}

export async function handleHelp(
  bot: TelegramBot,
  msg: TelegramBot.Message
) {
  const chatId = msg.chat.id

  const helpMessage = `
ℹ️ *Yordam / Помощь*

🛒 *Buyurtma berish / Оформление заказа:*
1. Do'konni oching / Откройте магазин
2. Mahsulotlarni tanlang / Выберите товары
3. Savatga qo'shing / Добавьте в корзину
4. Buyurtmani rasmiylang / Оформите заказ

📞 *Bog'lanish / Контакты:*
Telegram: @DekorHouseAdmin
Telefon: +998 (99) 368-11-00

🕐 *Ish vaqti / Режим работы:*
Dushanba - Shanba / Пн - Сб: 9:00 - 18:00
`.trim()

  const isHttps = config.frontendUrl.startsWith('https://')

  await bot.sendMessage(chatId, helpMessage, {
    parse_mode: 'Markdown',
    reply_markup: isHttps
      ? {
          inline_keyboard: [[
            { text: "🛍 Do'konni ochish / Открыть магазин", web_app: { url: config.frontendUrl } },
          ]],
        }
      : undefined,
  })
}