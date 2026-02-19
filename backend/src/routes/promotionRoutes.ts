// backend/src/routes/promotionRoutes.ts

import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'

const router = Router()

// ===== Получить активные акции (для главной страницы) =====
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date()

    // Автоматически деактивируем просроченные акции
    await prisma.promotion.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: now },
      },
      data: { status: 'INACTIVE' },
    })

    // Автоматически активируем запланированные акции
    await prisma.promotion.updateMany({
      where: {
        status: 'SCHEDULED',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      data: { status: 'ACTIVE' },
    })

    // Возвращаем только активные
    const promotions = await prisma.promotion.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    res.json({ success: true, data: promotions })
  } catch (error) {
    next(error)
  }
})

// ===== Получить акцию по slug (отдельная страница) =====
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params
    const now = new Date()

    // Автодеактивация
    await prisma.promotion.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: now },
      },
      data: { status: 'INACTIVE' },
    })

    const promotion = await prisma.promotion.findUnique({
      where: { slug },
      include: {
        products: {
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: 'asc' } },
                colors: true,
                variants: { orderBy: { sortOrder: 'asc' } },
                category: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!promotion) {
      throw new AppError('Promotion not found', 404)
    }

    // Проверяем что акция активна
    if (promotion.status !== 'ACTIVE' || promotion.startDate > now || promotion.endDate < now) {
      throw new AppError('Promotion is not active', 404)
    }

    // Форматируем ответ — достаём товары из связующей таблицы
    const formattedPromotion = {
      ...promotion,
      products: promotion.products
        .map(pp => pp.product)
        .filter(p => p.isActive),
    }

    res.json({ success: true, data: formattedPromotion })
  } catch (error) {
    next(error)
  }
})

export default router