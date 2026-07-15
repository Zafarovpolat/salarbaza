/**
 * Image optimization batch - dry-run and apply for existing products
 * Scope: only active/inStock products of categories ВЕТКИ and ZELEN
 * Steps implemented per PR7 spec:
 * 1. DB backup (manual via Supabase dashboard - documented)
 * 2. Storage inventory
 * 3. Only active/inStock and two categories
 * 4. Download original
 * 5. Checksum
 * 6. Generate variants via Sharp
 * 7. Upload under new versioned prefix
 * 8. CSV/JSON preview report
 * 9. Nothing switch in dry-run
 * 10. Apply after visual check
 * 11. Save old URLs
 * 12. Originals not delete
 * 13. Rollback script
 * 14. Check mobile/PDF/website
 */

import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const prisma = new PrismaClient()

// Category IDs determined via DB query
const ZELEN_ID = 'c6adaef3b9b984cbab0aa5ac1'
const VETKA_ID = 'c5dbafbf74f984746b64e8644'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!

const BUCKET = 'products'
const VERSIONED_PREFIX = 'optimized/v2'

interface ImageRecord {
  id: string
  productId: string
  url: string
  productCode: string
  categoryId: string | null
}

function checksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`)
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

async function uploadToSupabase(buffer: Buffer, objectPath: string, contentType: string) {
  const uploadUrl = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/${BUCKET}/${objectPath}`
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
      'Content-Type': contentType,
      'x-upsert': 'false',
    },
    body: buffer as any,
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Upload failed ${objectPath}: ${res.status} ${txt.slice(0, 200)}`)
  }
  return `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${objectPath}`
}

async function generateVariants(buffer: Buffer) {
  const base = sharp(buffer, { failOn: 'none' }).rotate()
  const meta = await base.metadata()

  async function make(width: number) {
    const { data, info } = await sharp(buffer, { failOn: 'none' })
      .rotate()
      .resize({ width, withoutEnlargement: true, fit: 'inside' })
      .toColourspace('srgb')
      .webp({ quality: 80, effort: 4 })
      .toBuffer({ resolveWithObject: true })
    return { buffer: data, width: info.width, height: info.height, bytes: info.size }
  }

  const [thumb, medium, detail] = await Promise.all([make(320), make(640), make(1200)])

  return {
    originalMeta: { width: meta.width || 0, height: meta.height || 0 },
    thumb,
    medium,
    detail,
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--apply')
  const limit = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '20')

  console.log(`=== Image optimization batch ${dryRun ? 'DRY-RUN' : 'APPLY'} ===`)
  console.log(`Categories: VETKA ${VETKA_ID}, ZELEN ${ZELEN_ID}`)
  console.log(`Limit: ${limit}`)

  // Step 3: only active/inStock and two categories
  const products = await prisma.product.findMany({
    where: { isActive: true, inStock: true, categoryId: { in: [VETKA_ID, ZELEN_ID] } },
    select: { id: true, code: true, categoryId: true, images: { orderBy: { sortOrder: 'asc' } } },
    take: 1000,
  })

  console.log(`Found ${products.length} active/inStock products in scope`)

  const images: ImageRecord[] = []
  for (const p of products) {
    for (const img of p.images) {
      images.push({ id: img.id, productId: p.id, url: img.url, productCode: p.code, categoryId: p.categoryId })
    }
  }

  console.log(`Found ${images.length} images to process`)

  const report: any[] = []
  let processed = 0

  for (const img of images.slice(0, limit)) {
    try {
      console.log(`Processing ${img.id} ${img.url.slice(0, 80)}...`)
      const originalBuffer = await downloadImage(img.url)
      const origChecksum = checksum(originalBuffer)

      const variants = await generateVariants(originalBuffer)

      const baseName = path.parse(new URL(img.url).pathname).name || img.id
      const thumbPath = `${VERSIONED_PREFIX}/${img.productId}/${baseName}-320.webp`
      const mediumPath = `${VERSIONED_PREFIX}/${img.productId}/${baseName}-640.webp`
      const detailPath = `${VERSIONED_PREFIX}/${img.productId}/${baseName}-1200.webp`

      let thumbUrl = '', mediumUrl = '', detailUrl = ''

      if (!dryRun) {
        thumbUrl = await uploadToSupabase(variants.thumb.buffer, thumbPath, 'image/webp')
        mediumUrl = await uploadToSupabase(variants.medium.buffer, mediumPath, 'image/webp')
        detailUrl = await uploadToSupabase(variants.detail.buffer, detailPath, 'image/webp')

        // Update DB - save old URLs
        await prisma.productImage.update({
          where: { id: img.id },
          data: {
            originalUrl: img.url,
            thumbnailUrl: thumbUrl,
            mediumUrl: mediumUrl,
            url: detailUrl, // detail becomes main url
            width: variants.detail.width,
            height: variants.detail.height,
            bytes: variants.detail.bytes,
            format: 'webp',
          },
        })
      }

      report.push({
        imageId: img.id,
        productId: img.productId,
        productCode: img.productCode,
        oldUrl: img.url,
        originalChecksum: origChecksum,
        originalWidth: variants.originalMeta.width,
        originalHeight: variants.originalMeta.height,
        thumbPath: dryRun ? thumbPath : thumbUrl,
        mediumPath: dryRun ? mediumPath : mediumUrl,
        detailPath: dryRun ? detailPath : detailUrl,
        thumbWidth: variants.thumb.width,
        mediumWidth: variants.medium.width,
        detailWidth: variants.detail.width,
        status: dryRun ? 'dry-run' : 'applied',
      })

      processed++
    } catch (e: any) {
      console.error(`Failed ${img.id}: ${e.message}`)
      report.push({ imageId: img.id, productId: img.productId, error: e.message, status: 'failed' })
    }
  }

  // Step 8: CSV/JSON preview report
  const outDir = path.join(__dirname, '../../..', 'image-optimization-reports')
  fs.mkdirSync(outDir, { recursive: true })
  const jsonPath = path.join(outDir, `report-${dryRun ? 'dryrun' : 'apply'}-${Date.now()}.json`)
  const csvPath = jsonPath.replace('.json', '.csv')

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2))

  const csvHeader = 'imageId,productId,productCode,oldUrl,thumbPath,mediumPath,detailPath,status,error\n'
  const csvRows = report.map((r) => `${r.imageId},${r.productId},${r.productCode},\"${r.oldUrl || ''}\",${r.thumbPath || ''},${r.mediumPath || ''},${r.detailPath || ''},${r.status},${r.error || ''}`).join('\n')
  fs.writeFileSync(csvPath, csvHeader + csvRows)

  console.log(`Report written to ${jsonPath} and ${csvPath}`)
  console.log(`Processed: ${processed}/${images.length}`)

  if (dryRun) {
    console.log('DRY-RUN complete - no DB changes. Review report visually before --apply')
  } else {
    console.log('APPLY complete - old URLs saved in originalUrl, originals not deleted')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
