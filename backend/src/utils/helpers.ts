export function generateOrderNumber(): string {
    const date = new Date()
    const year = date.getFullYear()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const timestamp = Date.now().toString().slice(-4)
    return `DH-${year}-${timestamp}${random}`
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat('uz-UZ').format(price)
}

// Helper function to convert BigInt to string for JSON serialization
export const serializeBigInt = (obj: any): any => {
    if (obj === null || obj === undefined) return obj
    if (typeof obj === 'bigint') return obj.toString()
    if (Array.isArray(obj)) return obj.map(serializeBigInt)
    if (obj instanceof Date) return obj.toISOString()
    if (typeof obj === 'object') {
        const result: any = {}
        for (const key in obj) {
            result[key] = serializeBigInt(obj[key])
        }
        return result
    }
    return obj
}
