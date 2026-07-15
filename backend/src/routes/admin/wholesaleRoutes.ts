import{Router}from'express';import{prisma}from'../../config/database';const router=Router();
// ==================== WHOLESALE TEMPLATES ====================

router.get('/wholesale-templates', async (req, res) => {
  try {
    const templates = await prisma.wholesalePriceTemplate.findMany({
      include: {
        tiers: {
          orderBy: { minQuantity: 'asc' },
        },
        _count: {
          select: { categories: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: templates })
  } catch (error) {
    console.error('Get templates error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.get('/wholesale-templates/:id', async (req, res) => {
  try {
    const template = await prisma.wholesalePriceTemplate.findUnique({
      where: { id: req.params.id },
      include: {
        tiers: {
          orderBy: { minQuantity: 'asc' },
        },
        categories: {
          select: { id: true, nameRu: true, nameUz: true, slug: true },
        },
      },
    })

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' })
    }

    res.json({ success: true, data: template })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.post('/wholesale-templates', async (req, res) => {
  try {
    const { name, description, isDefault, tiers } = req.body

    if (isDefault) {
      await prisma.wholesalePriceTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const template = await prisma.wholesalePriceTemplate.create({
      data: {
        name,
        description,
        isDefault: isDefault || false,
        tiers: {
          create:
            tiers?.map((tier: any) => ({
              minQuantity: parseInt(tier.minQuantity),
              discountPercent: parseInt(tier.discountPercent),
            })) || [],
        },
      },
      include: {
        tiers: {
          orderBy: { minQuantity: 'asc' },
        },
      },
    })

    res.status(201).json({ success: true, data: template })
  } catch (error: any) {
    console.error('Create template error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

router.put('/wholesale-templates/:id', async (req, res) => {
  try {
    const { name, description, isDefault, tiers } = req.body

    if (isDefault) {
      await prisma.wholesalePriceTemplate.updateMany({
        where: {
          isDefault: true,
          id: { not: req.params.id },
        },
        data: { isDefault: false },
      })
    }

    await prisma.wholesalePriceTier.deleteMany({
      where: { templateId: req.params.id },
    })

    const template = await prisma.wholesalePriceTemplate.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        isDefault: isDefault || false,
        tiers: {
          create:
            tiers?.map((tier: any) => ({
              minQuantity: parseInt(tier.minQuantity),
              discountPercent: parseInt(tier.discountPercent),
            })) || [],
        },
      },
      include: {
        tiers: {
          orderBy: { minQuantity: 'asc' },
        },
      },
    })

    res.json({ success: true, data: template })
  } catch (error: any) {
    console.error('Update template error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

router.delete('/wholesale-templates/:id', async (req, res) => {
  try {
    await prisma.category.updateMany({
      where: { wholesaleTemplateId: req.params.id },
      data: { wholesaleTemplateId: null },
    })

    await prisma.wholesalePriceTemplate.delete({
      where: { id: req.params.id },
    })

    res.json({ success: true, message: 'Template deleted' })
  } catch (error) {
    console.error('Delete template error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})


export default router
