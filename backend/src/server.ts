import app from './app'
import { config } from './config'
import { logger } from './utils/logger'
import { prisma } from './config/database'

const PORT = config.port || 3001

let stopBotFn: (() => void) | null = null

async function bootstrap() {
  try {
    // Инициализируем Telegram бота
    if (config.botToken) {
      const botModule = await import('../bot/index')
      botModule.initTelegramBot()
      stopBotFn = botModule.stopBot
      logger.info('🤖 Telegram bot initialized')
    } else {
      logger.warn('⚠️ BOT_TOKEN not set, bot disabled')
    }

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`)
      logger.info(`📝 Environment: ${config.nodeEnv}`)
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`)
    })

    // ✅ Прогрев БД — убирает cold start 1-2 сек
    prisma.category.count()
      .then(count => logger.info(`🔥 DB warmed up: ${count} categories`))
      .catch(err => logger.error('DB warmup failed:', err.message))

    // Graceful shutdown
    const shutdown = (signal: string) => {
      logger.info(`${signal} received, shutting down...`)
      if (stopBotFn) stopBotFn()
      server.close(() => {
        logger.info('Server closed')
        process.exit(0)
      })
      setTimeout(() => {
        logger.error('Forced shutdown')
        process.exit(1)
      }, 10000)
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      })
    })

    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Rejection:', {
        message: reason?.message || String(reason),
        code: reason?.code,
      })
    })
  } catch (error: any) {
    logger.error('Failed to start:', {
      message: error?.message || 'Unknown',
      stack: error?.stack?.split('\n').slice(0, 5).join('\n'),
    })
    process.exit(1)
  }
}

bootstrap()