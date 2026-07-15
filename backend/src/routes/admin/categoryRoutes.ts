import{Router}from'express';import{prisma}from'../../config/database';import{invalidateCache}from'../../utils/cache';const router=Router();
// ==================== CATEGORIES ====================
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true, children: true } },
        wholesaleTemplate: {
          select: { id: true, name: true },
        },
        parent: {
          select: { id: true, nameRu: true, nameUz: true, slug: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })
    res.json({ success: true, data: categories })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.post('/categories', async (req, res) => {
  try {
    const { slug, nameRu, nameUz, descriptionRu, descriptionUz, image, sortOrder, isActive, wholesaleTemplateId, parentId } = req.body

    const category = await prisma.category.create({
      data: {
        slug,
        nameRu,
        nameUz,
        descriptionRu,
        descriptionUz,
        image,
        sortOrder: sortOrder || 0,
        isActive: isActive ?? true,
        wholesaleTemplateId: wholesaleTemplateId || null,
        parentId: parentId || null,
      },
    })

    invalidateCache('categor')

    res.status(201).json({ success: true, data: category })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.put('/categories/:id', async (req, res) => {
  try {
    const { nameRu, nameUz, descriptionRu, descriptionUz, image, sortOrder, isActive, wholesaleTemplateId, parentId } = req.body

    // Prevent setting parentId to self
    if (parentId === req.params.id) {
      return res.status(400).json({ success: false, message: 'Категория не может быть подкатегорией самой себя' })
    }

    // Prevent circular reference: ensure parentId is not a child of this category
    if (parentId) {
      const children = await prisma.category.findMany({ where: { parentId: req.params.id } })
      if (children.some(c => c.id === parentId)) {
        return res.status(400).json({ success: false, message: 'Нельзя назначить дочернюю категорию как родительскую' })
      }
    }

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        nameRu,
        nameUz,
        descriptionRu,
        descriptionUz,
        image,
        sortOrder,
        isActive,
        wholesaleTemplateId: wholesaleTemplateId || null,
        parentId: parentId !== undefined ? (parentId || null) : undefined,
      },
    })

    invalidateCache('categor')

    res.json({ success: true, data: category })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ✅ Quick toggle isActive for a category
router.patch('/categories/:id/toggle-active', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({ where: { id: req.params.id } })
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' })
    }

    const updated = await prisma.category.update({
      where: { id: req.params.id },
      data: { isActive: !category.isActive },
    })

    invalidateCache('categor')

    res.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Toggle category active error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

router.delete('/categories/:id', async (req, res) => {
  try {
    // Move subcategories to root (parentId = null)
    await prisma.category.updateMany({
      where: { parentId: req.params.id },
      data: { parentId: null },
    })

    // Unlink products from this category
    await prisma.product.updateMany({
      where: { categoryId: req.params.id },
      data: { categoryId: null },
    })

    await prisma.category.delete({
      where: { id: req.params.id },
    })

    invalidateCache()

    res.json({ success: true, message: 'Category deleted' })
  } catch (error) {
    console.error('Delete category error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})


export default router
