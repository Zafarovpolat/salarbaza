import dotenv from 'dotenv'

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
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',
    adminSessionSecret: process.env.ADMIN_SESSION_SECRET || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceRole: process.env.SUPABASE_SERVICE_ROLE || '',
    deliveryFee: 25000,
    freeDeliveryThreshold: 500000,
}

if (config.nodeEnv === 'production') {
    const required = [
        'DATABASE_URL',
        'BOT_TOKEN',
        'FRONTEND_URL',
        'ADMIN_PASSWORD_HASH',
        'ADMIN_SESSION_SECRET',
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE',
    ]
    const missing = required.filter(key => !process.env[key])
    if (missing.length > 0) {
        console.error(`❌ Missing required env vars: ${missing.join(', ')}`)
        process.exit(1)
    }
}