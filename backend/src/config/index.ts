import dotenv from 'dotenv'
dotenv.config()

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