import TelegramBot from 'node-telegram-bot-api'
import { config } from '../src/config'

export async function handleStart(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id
  const firstName = msg.from?.first_name || 'Foydalanuvchi'

  const text = msg.text || ''
  const match = text.match(/\/start\s+(.+)/)
  const startParam = match ? match[1] : null

  let webAppUrl = config.frontendUrl

  if (startParam) {
    if (startParam.startsWith('category_')) {
      const slug = startParam.replace('category_', '')
      webAppUrl = `${config.frontendUrl}/catalog/${slug}`
    } else if (startParam.startsWith('product_')) {
      const slug = startParam.replace('product_', '')
      webAppUrl = `${config.frontendUrl}/product/${encodeURIComponent(slug)}`
    } else if (startParam.startsWith('promo_')) {
      const slug = startParam.replace('promo_', '')
      webAppUrl = `${config.frontendUrl}/promotion/${slug}`
    }
  }

  // ✅ НОВЫЙ приветственный текст
  const welcomeMessage = `
👋 Salom, ${firstName}!

Decor Market — O'zbekistondagi birinchi sun'iy gullar va dekor internet-do'koni 🌸

Bizning katalogda sun'iy gullar, dekorativ daraxtlar va inter'yer bezaklari — uy, biznes va tadbirlar uchun. Hammasi bir joyda — qulay va tez 🛒

📍 Toshkent sh., Mirzo Ulug'bek tumani, 7-Sayram o'tish, 92A
📍 Toshkent sh., Yunusobod tumani, Kichik halqa yo'li, 106

📲 Administrator: @DekorHouseAdmin
📞 +998 (99) 368-11-00
`.trim()

  const isHttps = config.frontendUrl.startsWith('https://')

  if (isHttps) {
    const buttonText = startParam ? '🛒 Ochish' : "🛒 Do'konni ochish"
    await bot.sendMessage(chatId, welcomeMessage + '\n\n👇 Pastdagi tugmani bosing:', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: buttonText, web_app: { url: webAppUrl } }]],
      },
    })
  } else {
    await bot.sendMessage(chatId, welcomeMessage + `\n\n🔗 Do'kon: ${webAppUrl}`, {
      parse_mode: 'Markdown',
    })
  }
}

export async function handleHelp(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id

  const helpMessage = `
ℹ️ *Yordam*

🛒 *Buyurtma berish:*
1. Do'konni oching
2. Mahsulotlarni tanlang
3. Savatga qo'shing
4. Buyurtmani rasmiylang

📞 *Bog'lanish:*
Telegram: @DekorHouseAdmin
Telefon: +998 (99) 368-11-00

🕐 *Ish vaqti:*
Dushanba - Shanba: 9:00 - 18:00
Yakshanba: Dam olish
`.trim()

  const isHttps = config.frontendUrl.startsWith('https://')

  if (isHttps) {
    await bot.sendMessage(chatId, helpMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: "🛒 Do'konni ochish", web_app: { url: config.frontendUrl } }]],
      },
    })
  } else {
    await bot.sendMessage(chatId, helpMessage + `\n\n🔗 Do'kon: ${config.frontendUrl}`, {
      parse_mode: 'Markdown',
    })
  }
}