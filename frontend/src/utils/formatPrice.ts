export function formatPrice(price: number): string {
    return new Intl.NumberFormat('uz-UZ').format(price)
}

export function formatPriceWithCurrency(price: number, lang: 'uz' | 'ru' = 'uz'): string {
    const formatted = formatPrice(price)
    const currency = lang === 'uz' ? "so'm" : 'сум'
    return `${formatted} ${currency}`
}