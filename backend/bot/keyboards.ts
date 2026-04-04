import { InlineKeyboardMarkup } from 'node-telegram-bot-api'
import { config } from '../src/config'

// Клавиатура выбора языка
export function getLanguageKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '🇺🇿 O\'zbekcha', callback_data: 'lang_uz' },
        { text: '🇷🇺 Русский',   callback_data: 'lang_ru' },
      ],
    ],
  }
}

// Кнопка открытия магазина после выбора языка
export function getOpenShopKeyboard(lang: 'uz' | 'ru'): InlineKeyboardMarkup {
  const url = `${config.frontendUrl}?lang=${lang}`
  const isHttps = config.frontendUrl.startsWith('https://')

  const buttonText = lang === 'uz' ? "🛍 Do'konni ochish" : '🛍 Открыть магазин'

  if (isHttps) {
    return {
      inline_keyboard: [
        [{ text: buttonText, web_app: { url } }],
        [{ text: '🌐 Tilni o\'zgartirish / Сменить язык', callback_data: 'change_lang' }],
      ],
    }
  }

  return {
    inline_keyboard: [
      [{ text: buttonText, url }],
      [{ text: '🌐 Tilni o\'zgartirish / Сменить язык', callback_data: 'change_lang' }],
    ],
  }
}

// Старая клавиатура главного меню (оставляем для совместимости)
export function getMainMenuKeyboard(): InlineKeyboardMarkup {
  return getOpenShopKeyboard('uz')
}

// Клавиатура для admin заказов (без изменений)
export function getOrderActionsKeyboard(orderId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '✅ Tasdiqlash',   callback_data: `confirm_${orderId}` },
        { text: '❌ Bekor qilish', callback_data: `cancel_${orderId}` },
      ],
      [
        { text: '📋 Batafsil', callback_data: `details_${orderId}` },
      ],
    ],
  }
}