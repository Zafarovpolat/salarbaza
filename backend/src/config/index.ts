import dotenv from 'dotenv'

// Загружаем .env только если файл существует (не в production на Render)
if (process.env.NODE_ENV !== 'production') {
    dotenv.config()
}

export const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL || '',
    botToken: process.env.BOT_TOKEN || '',
    adminChatId: process.env.ADMIN_CHAT_ID || '',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    jwtSecret: process.env.JWT_SECRET || 'default-secret',
    deliveryFee: 25000,
    freeDeliveryThreshold: 500000,
}

// Проверка обязательных переменных в production
if (config.nodeEnv === 'production') {
    const required = ['DATABASE_URL']
    const missing = required.filter(key => !process.env[key])

    if (missing.length > 0) {
        console.error(`❌ Missing required env vars: ${missing.join(', ')}`)
        process.exit(1)
    }
}