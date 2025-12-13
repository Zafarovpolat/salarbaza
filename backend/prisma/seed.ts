// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Маппинг цветов на HEX коды
const colorHexMap: Record<string, string> = {
    // Русские
    'Черный': '#000000',
    'Чёрный': '#000000',
    'Белый': '#FFFFFF',
    'Серый': '#6B7280',
    'Бежевый': '#D4A574',
    'Коричневый': '#8B4513',
    'Зелёный': '#22C55E',
    'Зеленый': '#22C55E',
    'Синий': '#3B82F6',
    'Красный': '#EF4444',
    'Розовый': '#EC4899',
    'Фиолетовый': '#8B5CF6',
    'Оранжевый': '#F97316',
    'Жёлтый': '#EAB308',
    'Желтый': '#EAB308',
    'Голубой': '#06B6D4',
    'Тёмно-серый': '#374151',
    'Светло-серый': '#D1D5DB',
    'Антрацит': '#293241',
    'Терракотовый': '#C84C32',
    'Мраморный': '#E8E8E8',
    'Графитовый': '#383838',

    // Узбекские
    'Qora': '#000000',
    'Oq': '#FFFFFF',
    'Kulrang': '#6B7280',
    'Bej': '#D4A574',
    'Jigarrang': '#8B4513',
    "Yashil": '#22C55E',
    "Ko'k": '#3B82F6',
    'Qizil': '#EF4444',
    'Pushti': '#EC4899',
    'Binafsha': '#8B5CF6',
    "To'q sariq": '#F97316',
    'Sariq': '#EAB308',
    "Och ko'k": '#06B6D4',
}

// Маппинг русских цветов на узбекские
const colorRuToUz: Record<string, string> = {
    'Черный': 'Qora',
    'Чёрный': 'Qora',
    'Белый': 'Oq',
    'Серый': 'Kulrang',
    'Бежевый': 'Bej',
    'Коричневый': 'Jigarrang',
    'Зелёный': 'Yashil',
    'Зеленый': 'Yashil',
    'Синий': "Ko'k",
    'Красный': 'Qizil',
    'Розовый': 'Pushti',
    'Фиолетовый': 'Binafsha',
    'Оранжевый': "To'q sariq",
    'Жёлтый': 'Sariq',
    'Желтый': 'Sariq',
    'Голубой': "Och ko'k",
    'Тёмно-серый': "To'q kulrang",
    'Светло-серый': 'Och kulrang',
    'Антрацит': 'Antratsit',
    'Терракотовый': 'Terrakot',
    'Мраморный': 'Marmar',
    'Графитовый': 'Grafit',
}

interface PotProduct {
    id: number
    code: string
    slug: string
    name_ru: string
    name_uz: string
    description_ru: string
    description_uz: string
    dimensions?: {
        diameter_cm?: number
        height_cm?: number
        volume_liters?: number
        width_cm?: number
        length_cm?: number
    }
    price: number
    old_price?: number
    colors?: string[]
    colors_uz?: string[]
    material?: string
    in_stock: boolean
    image?: string | null
    is_new?: boolean
    is_featured?: boolean
    set_quantity?: number
}

interface PlantProduct {
    id: number
    code: string
    slug: string
    name_ru: string
    name_uz: string
    description_ru: string
    description_uz: string
    packaging?: {
        bags_per_box?: number
        pcs_per_bag?: number
        total_pcs?: number
    }
    price: number
    price_per_piece?: number
    in_stock: boolean
    image?: string | null
    is_new?: boolean
    is_featured?: boolean
}

interface StandProduct {
    id: number
    code: string
    slug: string
    name_ru: string
    name_uz: string
    description_ru: string
    description_uz: string
    item_size?: {
        length_cm?: number
        width_cm?: number
        height_cm?: number
    }
    carton_size?: {
        length_cm?: number
        width_cm?: number
        height_cm?: number
    }
    quantity?: number
    price: number
    in_stock: boolean
    image?: string | null
    is_new?: boolean
    is_featured?: boolean
}

interface PotsData {
    category: string
    category_name_ru: string
    category_name_uz: string
    total_products: number
    products: PotProduct[]
}

interface PlantsData {
    category: string
    category_name_ru: string
    category_name_uz: string
    products: PlantProduct[]
}

interface StandsData {
    category: string
    category_name_ru: string
    category_name_uz: string
    products: StandProduct[]
}

function loadJsonFile<T>(filename: string): T {
    const filePath = path.join(__dirname, '..', 'data', filename)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(fileContent) as T
}

function generatePlaceholderImage(code: string, category: string): string {
    const colors: Record<string, string> = {
        pots: '22c55e',      // Green
        plants: '4ade80',    // Light green
        stands: '374151',    // Gray
    }
    const color = colors[category] || '6b7280'
    return `https://placehold.co/400x400/${color}/white?text=${encodeURIComponent(code)}`
}

async function main() {
    console.log('🌱 Starting seed...\n')

    // Clear database in correct order (respecting foreign keys)
    console.log('🗑️  Clearing database...')
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.cartItem.deleteMany()
    await prisma.cart.deleteMany()
    await prisma.favorite.deleteMany()
    await prisma.productColor.deleteMany()
    await prisma.productImage.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    await prisma.address.deleteMany()
    await prisma.user.deleteMany()
    console.log('   ✓ Database cleared\n')

    // ==================== CATEGORIES ====================
    console.log('📁 Creating categories...')

    const potsCategory = await prisma.category.create({
        data: {
            slug: 'pots',
            nameRu: 'Горшки и кашпо',
            nameUz: 'Guldonlar va kashpolar',
            descriptionRu: 'Пластиковые, металлические и плетёные горшки для растений',
            descriptionUz: "Plastik, metall va to'qilgan guldonlar",
            icon: '🪴',
            sortOrder: 1,
            isActive: true,
        },
    })
    console.log('   ✓ Pots category created')

    const plantsCategory = await prisma.category.create({
        data: {
            slug: 'artificial-plants',
            nameRu: 'Искусственные растения',
            nameUz: "Sun'iy o'simliklar",
            descriptionRu: 'Высококачественные искусственные растения для декора',
            descriptionUz: "Dekor uchun yuqori sifatli sun'iy o'simliklar",
            icon: '🌿',
            sortOrder: 2,
            isActive: true,
        },
    })
    console.log('   ✓ Artificial plants category created')

    const standsCategory = await prisma.category.create({
        data: {
            slug: 'plant-stands',
            nameRu: 'Подставки для растений',
            nameUz: "O'simliklar uchun tagliklar",
            descriptionRu: 'Прочные металлические подставки для ваших растений',
            descriptionUz: "O'simliklaringiz uchun mustahkam metall tagliklar",
            icon: '🏗️',
            sortOrder: 3,
            isActive: true,
        },
    })
    console.log('   ✓ Plant stands category created\n')

    // ==================== LOAD JSON DATA ====================
    console.log('📂 Loading JSON data...')

    let potsData: PotsData
    let plantsData: PlantsData
    let standsData: StandsData

    try {
        potsData = loadJsonFile<PotsData>('pots.json')
        console.log(`   ✓ pots.json loaded (${potsData.products.length} products)`)
    } catch (error) {
        console.log('   ⚠ pots.json not found, using empty array')
        potsData = { category: 'pots', category_name_ru: '', category_name_uz: '', total_products: 0, products: [] }
    }

    try {
        plantsData = loadJsonFile<PlantsData>('artificial_plants.json')
        console.log(`   ✓ artificial_plants.json loaded (${plantsData.products.length} products)`)
    } catch (error) {
        console.log('   ⚠ artificial_plants.json not found, using empty array')
        plantsData = { category: 'plants', category_name_ru: '', category_name_uz: '', products: [] }
    }

    try {
        standsData = loadJsonFile<StandsData>('plant_stands.json')
        console.log(`   ✓ plant_stands.json loaded (${standsData.products.length} products)`)
    } catch (error) {
        console.log('   ⚠ plant_stands.json not found, using empty array')
        standsData = { category: 'stands', category_name_ru: '', category_name_uz: '', products: [] }
    }
    console.log('')

    // ==================== CREATE POTS ====================
    console.log('🪴 Creating pots products...')
    let potsCount = 0

    for (const pot of potsData.products) {
        try {
            // Определяем featured и new (каждый 5-й featured, каждый 7-й new)
            const isFeatured = pot.is_featured || pot.id % 5 === 0
            const isNew = pot.is_new || pot.id % 7 === 0

            const product = await prisma.product.create({
                data: {
                    code: pot.code,
                    slug: pot.slug || pot.code.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    nameRu: pot.name_ru,
                    nameUz: pot.name_uz,
                    descriptionRu: pot.description_ru,
                    descriptionUz: pot.description_uz,
                    categoryId: potsCategory.id,
                    price: pot.price,
                    oldPrice: pot.old_price || null,
                    material: pot.material || 'plastic',
                    dimensions: pot.dimensions ? JSON.parse(JSON.stringify(pot.dimensions)) : null,
                    inStock: pot.in_stock,
                    stockQuantity: pot.in_stock ? 100 : 0,
                    setQuantity: pot.set_quantity || 1,
                    isFeatured,
                    isNew,
                    isActive: true,
                },
            })

            // Create colors if available
            if (pot.colors && pot.colors.length > 0) {
                for (let i = 0; i < pot.colors.length; i++) {
                    const colorRu = pot.colors[i]
                    const colorUz = pot.colors_uz?.[i] || colorRuToUz[colorRu] || colorRu

                    await prisma.productColor.create({
                        data: {
                            productId: product.id,
                            nameRu: colorRu,
                            nameUz: colorUz,
                            hexCode: colorHexMap[colorRu] || colorHexMap[colorUz] || '#6B7280',
                            inStock: true,
                        },
                    })
                }
            }

            // Create placeholder image
            await prisma.productImage.create({
                data: {
                    productId: product.id,
                    url: pot.image || generatePlaceholderImage(pot.code, 'pots'),
                    isMain: true,
                    sortOrder: 0,
                },
            })

            potsCount++
        } catch (error) {
            console.error(`   ✗ Error creating pot ${pot.code}:`, error)
        }
    }
    console.log(`   ✓ Created ${potsCount} pots\n`)

    // ==================== CREATE ARTIFICIAL PLANTS ====================
    console.log('🌿 Creating artificial plants products...')
    let plantsCount = 0

    for (const plant of plantsData.products) {
        try {
            const isFeatured = plant.is_featured || plant.id % 4 === 0
            const isNew = plant.is_new || plant.id % 6 === 0

            const product = await prisma.product.create({
                data: {
                    code: plant.code,
                    slug: plant.slug || plant.code.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    nameRu: plant.name_ru,
                    nameUz: plant.name_uz,
                    descriptionRu: plant.description_ru,
                    descriptionUz: plant.description_uz,
                    categoryId: plantsCategory.id,
                    price: plant.price,
                    packaging: plant.packaging ? JSON.parse(JSON.stringify(plant.packaging)) : null,
                    inStock: plant.in_stock,
                    stockQuantity: plant.in_stock ? 50 : 0,
                    isFeatured,
                    isNew,
                    isActive: true,
                },
            })

            // Create placeholder image
            await prisma.productImage.create({
                data: {
                    productId: product.id,
                    url: plant.image || generatePlaceholderImage(plant.code, 'plants'),
                    isMain: true,
                    sortOrder: 0,
                },
            })

            plantsCount++
        } catch (error) {
            console.error(`   ✗ Error creating plant ${plant.code}:`, error)
        }
    }
    console.log(`   ✓ Created ${plantsCount} artificial plants\n`)

    // ==================== CREATE PLANT STANDS ====================
    console.log('🏗️  Creating plant stands products...')
    let standsCount = 0

    for (const stand of standsData.products) {
        try {
            const isFeatured = stand.is_featured || stand.id % 3 === 0
            const isNew = stand.is_new || stand.id % 5 === 0

            // Combine item_size and carton_size into dimensions
            const dimensions = {
                item: stand.item_size || null,
                carton: stand.carton_size || null,
            }

            const product = await prisma.product.create({
                data: {
                    code: stand.code,
                    slug: stand.slug || `stand-${stand.code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
                    nameRu: stand.name_ru,
                    nameUz: stand.name_uz,
                    descriptionRu: stand.description_ru,
                    descriptionUz: stand.description_uz,
                    categoryId: standsCategory.id,
                    price: stand.price,
                    material: 'metal',
                    dimensions: JSON.parse(JSON.stringify(dimensions)),
                    inStock: stand.in_stock,
                    stockQuantity: stand.in_stock ? 20 : 0,
                    setQuantity: stand.quantity || 1,
                    isFeatured,
                    isNew,
                    isActive: true,
                },
            })

            // Create placeholder image
            await prisma.productImage.create({
                data: {
                    productId: product.id,
                    url: stand.image || generatePlaceholderImage(stand.code, 'stands'),
                    isMain: true,
                    sortOrder: 0,
                },
            })

            standsCount++
        } catch (error) {
            console.error(`   ✗ Error creating stand ${stand.code}:`, error)
        }
    }
    console.log(`   ✓ Created ${standsCount} plant stands\n`)

    // ==================== SUMMARY ====================
    const totalProducts = await prisma.product.count()
    const totalCategories = await prisma.category.count()
    const totalColors = await prisma.productColor.count()
    const totalImages = await prisma.productImage.count()

    console.log('═'.repeat(50))
    console.log('📊 SEED SUMMARY')
    console.log('═'.repeat(50))
    console.log(`   Categories:  ${totalCategories}`)
    console.log(`   Products:    ${totalProducts}`)
    console.log(`   Colors:      ${totalColors}`)
    console.log(`   Images:      ${totalImages}`)
    console.log('═'.repeat(50))
    console.log('\n✅ Seed completed successfully!')
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })