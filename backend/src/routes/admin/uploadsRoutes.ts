import express,{Router}from'express';import crypto from'crypto';import{config}from'../../config';const router=Router();
// ==================== SECURE IMAGE UPLOAD ====================
const allowedImageTypes: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

router.post(
  '/uploads',
  express.raw({ type: Object.keys(allowedImageTypes), limit: '10mb' }),
  async (req, res) => {
    try {
      const mime = req.headers['content-type']?.split(';')[0].trim() || ''
      const extension = allowedImageTypes[mime]
      const folder = req.query.folder === 'categories' ? 'categories' : req.query.folder === 'products' ? 'products' : null
      if (!extension || !folder || !Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ success: false, message: 'PNG, JPEG or WebP file and valid folder are required' })
      }
      if (!config.supabaseUrl || !config.supabaseServiceRole) {
        return res.status(503).json({ success: false, message: 'Upload service is not configured' })
      }

      const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${extension}`
      const objectPath = `${folder}/${fileName}`
      const bucket = 'products'
      const uploadUrl = `${config.supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${bucket}/${objectPath}`
      const upload = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          apikey: config.supabaseServiceRole,
          Authorization: `Bearer ${config.supabaseServiceRole}`,
          'Content-Type': mime,
          'x-upsert': 'false',
        },
        body: req.body,
      })
      if (!upload.ok) {
        const detail = await upload.text()
        console.error('Supabase upload failed:', upload.status, detail.slice(0, 200))
        return res.status(502).json({ success: false, message: 'Image upload failed' })
      }

      const publicUrl = `${config.supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${objectPath}`
      res.status(201).json({ success: true, data: { url: publicUrl, path: objectPath } })
    } catch (error) {
      console.error('Secure image upload error:', error)
      res.status(500).json({ success: false, message: 'Image upload failed' })
    }
  }
)


export default router
