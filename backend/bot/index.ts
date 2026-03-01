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

    // ✅ FIX: Polling включён ВСЕГДА (и в dev, и в production)
    bot = new TelegramBot(config.botToken, {
        polling: {
            interval: 1000,
            autoStart: true,
            params: {
                timeout: 10
            }
        }
    })

    // ✅ Команды работают везде
    bot.onText(/\/start(.*)/, async (msg) => {
        try {
            await handleStart(bot!, msg)
        } catch (error: any) {
            logger.error('Error in /start command:', error?.message || 'Unknown error')
        }
    })

    bot.onText(/\/help/, async (msg) => {
        try {
            await handleHelp(bot!, msg)
        } catch (error: any) {
            logger.error('Error in /help command:', error?.message || 'Unknown error')
        }
    })

    // Callback queries (подтверждение/отмена заказов)
    bot.on('callback_query', async (query) => {
        try {
            await handleCallbackQuery(bot!, query)
        } catch (error: any) {
            logger.error('Error in callback query:', error?.message || 'Unknown error')
        }
    })

    // ✅ Обработка ошибок polling
    bot.on('polling_error', (error: any) => {
        // 409 = другой инстанс бота (при редеплое)
        if (error.code === 'ETELEGRAM' && error.message?.includes('409')) {
            logger.warn('Bot polling conflict (409) — will retry automatically')
            return
        }
        // 401 = неверный токен
        if (error.code === 'ETELEGRAM' && error.message?.includes('401')) {
            logger.error('❌ BOT TOKEN IS INVALID! Check BOT_TOKEN in environment variables.')
            return
        }
        logger.error('Bot polling error:', {
            message: error?.message || 'Unknown error',
            code: error?.code || 'N/A',
            statusCode: error?.response?.statusCode
        })
    })

    bot.on('error', (error: any) => {
        logger.error('Bot error:', {
            message: error?.message || 'Unknown error',
            code: error?.code || 'N/A'
        })
    })

    logger.info('🤖 Telegram bot started (polling mode)')

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