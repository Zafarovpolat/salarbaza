import TelegramBot from 'node-telegram-bot-api'
import { config } from '../src/config'
import { logger } from '../src/utils/logger'
import { handleStart, handleHelp } from './commands'
import { handleCallbackQuery } from './handlers'

let bot: TelegramBot | null = null
let last409Log = 0

export function initTelegramBot() {
  if (!config.botToken) {
    logger.warn('BOT_TOKEN not set, skipping bot initialization')
    return null
  }

  // ✅ FIX: простой polling без async проблем
  bot = new TelegramBot(config.botToken, {
    polling: {
      interval: 1500,
      autoStart: true,
      params: {
        timeout: 10,
      },
    },
  })

  // ✅ FIX: deleteWebhook без параметров (TS совместимо)
  try { (bot as any).deleteWebhook() } catch {}
 // Игнорируем если не было webhook

  // Команды
  bot.onText(/\/start(.*)/, async (msg) => {
    try {
      await handleStart(bot!, msg)
    } catch (error: any) {
      logger.error('Error in /start:', error?.message || 'Unknown')
    }
  })

  bot.onText(/\/help/, async (msg) => {
    try {
      await handleHelp(bot!, msg)
    } catch (error: any) {
      logger.error('Error in /help:', error?.message || 'Unknown')
    }
  })

  bot.on('callback_query', async (query) => {
    try {
      await handleCallbackQuery(bot!, query)
    } catch (error: any) {
      logger.error('Error in callback:', error?.message || 'Unknown')
    }
  })

  // Ошибки polling
  bot.on('polling_error', (error: any) => {
    if (error.code === 'ETELEGRAM' && error.message?.includes('409')) {
      // ✅ FIX: логируем только раз в 60 сек
      const now = Date.now()
      if (now - last409Log > 60000) {
        logger.warn('Bot polling conflict (409) — will resolve after old instance stops')
        last409Log = now
      }
      return
    }
    if (error.code === 'ETELEGRAM' && error.message?.includes('401')) {
      logger.error('❌ INVALID BOT TOKEN!')
      return
    }
    logger.error('Bot polling error:', {
      message: error?.message || 'Unknown',
      code: error?.code || 'N/A',
    })
  })

  bot.on('error', (error: any) => {
    logger.error('Bot error:', { message: error?.message || 'Unknown' })
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