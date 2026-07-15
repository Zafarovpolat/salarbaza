import{Router}from'express';import{prisma}from'../../config/database';const router=Router();
// ==================== ORDERS ====================
router.get('/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const serializedOrders = orders.map(order => ({
      ...order,
      user: order.user
        ? {
            ...order.user,
            telegramId: order.user.telegramId.toString(),
          }
        : null,
    }))

    res.json({ success: true, data: serializedOrders })
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ success: false, message: 'Server error', error: String(error) })
  }
})

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body

    const updateData: any = { status }

    if (status === 'CONFIRMED') updateData.confirmedAt = new Date()
    if (status === 'SHIPPED') updateData.shippedAt = new Date()
    if (status === 'DELIVERED') updateData.deliveredAt = new Date()
    if (status === 'CANCELLED') updateData.cancelledAt = new Date()

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: updateData,
      include: { items: true },
    })

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})


export default router
