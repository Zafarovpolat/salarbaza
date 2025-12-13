import { InlineKeyboardMarkup } from 'node-telegram-bot-api'
import { config } from '../src/config'

export function getMainMenuKeyboard(): InlineKeyboardMarkup {
    return {
        inline_keyboard: [
            [
                {
                    text: '🛒 Do\'konni ochish',
                    web_app: { url: config.frontendUrl },
                },
            ],
            [
                { text: '📦 Buyurtmalarim', callback_data: 'my_orders' },
                { text: 'ℹ️ Yordam', callback_data: 'help' },
            ],
        ],
    }
}

export function getOrderActionsKeyboard(orderId: string): InlineKeyboardMarkup {
    return {
        inline_keyboard: [
            [
                { text: '✅ Tasdiqlash', callback_data: `confirm_${orderId}` },
                { text: '❌ Bekor qilish', callback_data: `cancel_${orderId}` },
            ],
            [
                { text: '📋 Batafsil', callback_data: `details_${orderId}` },
            ],
        ],
    }
}