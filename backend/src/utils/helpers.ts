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