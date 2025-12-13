import TelegramBot from 'node-telegram-bot-api'
import { config } from '../src/config'
import { logger } from '../src/utils/logger'
import { handleStart, handleHelp } from './commands'
import { handleCallbackQuery } from './handlers'

let bot: TelegramBot | null = null

export function initTelegramBot() {
    if (!config.botToken) {
        logger.warn('BOT_TOKEN not set, skipping bot initialization')
        return null
    }

    bot = new TelegramBot(config.botToken, { polling: true })

    // Commands
    bot.onText(/\/start/, (msg) => handleStart(bot!, msg))
    bot.onText(/\/help/, (msg) => handleHelp(bot!, msg))

    // Callback queries (button clicks)
    bot.on('callback_query', (query) => handleCallbackQuery(bot!, query))

    // Error handling
    bot.on('polling_error', (error) => {
        logger.error('Bot polling error:', error)
    })

    logger.info('🤖 Telegram bot started')

    return bot
}

export function getBot() {
    return bot
}