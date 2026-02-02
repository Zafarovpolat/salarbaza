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

    // На production - без polling (только для отправки уведомлений)
    // На dev - с polling для команд
    const usePolling = config.nodeEnv === 'development'

    bot = new TelegramBot(config.botToken, {
        polling: usePolling ? {
            interval: 1000,
            autoStart: true,
            params: {
                timeout: 10
            }
        } : false
    })

    // Команды работают только в dev режиме (с polling)
    if (usePolling) {
        // Commands with error handling
        bot.onText(/\/start/, async (msg) => {
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

        // Callback queries with error handling
        bot.on('callback_query', async (query) => {
            try {
                await handleCallbackQuery(bot!, query)
            } catch (error: any) {
                logger.error('Error in callback query:', error?.message || 'Unknown error')
            }
        })

        // Error handling - only log essential info, not full objects
        bot.on('polling_error', (error: any) => {
            if (error.code === 'ETELEGRAM' && error.message?.includes('409')) {
                logger.warn('Bot polling conflict detected, will retry...')
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

        logger.info('🤖 Telegram bot started (polling mode for development)')
    } else {
        logger.info('🤖 Telegram bot started (send-only mode for production)')
    }

    return bot
}

export function stopBot() {
    if (bot \u0026\u0026 config.nodeEnv === 'development') {
        bot.stopPolling()
        logger.info('🤖 Telegram bot stopped')
        bot = null
    }
}

export function getBot() {
    return bot
}