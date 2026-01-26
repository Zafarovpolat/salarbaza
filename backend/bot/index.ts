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

    bot = new TelegramBot(config.botToken, {
        polling: {
            interval: 1000,
            autoStart: true,
            params: {
                timeout: 10
            }
        }
    })

    // Commands
    bot.onText(/\/start/, (msg) => handleStart(bot!, msg))
    bot.onText(/\/help/, (msg) => handleHelp(bot!, msg))

    // Callback queries
    bot.on('callback_query', (query) => handleCallbackQuery(bot!, query))

    // Error handling
    bot.on('polling_error', (error: any) => {
        if (error.code === 'ETELEGRAM' && error.message?.includes('409')) {
            logger.warn('Bot polling conflict, will retry...')
            return
        }
        logger.error('Bot polling error:', error.message)
    })

    bot.on('error', (error) => {
        logger.error('Bot error:', error.message)
    })

    logger.info('🤖 Telegram bot started')
    return bot
}

export function stopBot() {
    if (bot) {
        bot.stopPolling()
        logger.info('🤖 Telegram bot stopped')
        bot = null
    }
}

export function getBot() {
    return bot
}