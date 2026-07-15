/**
 * Rollback script for image optimization batch
 * Restores url from originalUrl if present
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--apply')
  const limit = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '100')

  console.log(`=== Rollback ${dryRun ? 'DRY-RUN' : 'APPLY'} ===`)

  const images = await prisma.productImage.findMany({
    where: { originalUrl: { not: null } },
    select: { id: true, url: true, originalUrl: true, thumbnailUrl: true, productId: true },
    take: limit,
  })

  console.log(`Found ${images.length} images with originalUrl to rollback`)

  let restored = 0
  for (const img of images) {
    if (!img.originalUrl) continue
    console.log(`Rollback ${img.id}: ${img.url.slice(0, 80)} -> ${img.originalUrl.slice(0, 80)}`)
    if (!dryRun) {
      await prisma.productImage.update({
        where: { id: img.id },
        data: {
          url: img.originalUrl,
          thumbnailUrl: null,
          mediumUrl: null,
          originalUrl: null,
          width: null,
          height: null,
          bytes: null,
          format: null,
        },
      })
      restored++
    }
  }

  console.log(`Rollback ${dryRun ? 'dry-run' : 'applied'}: ${restored} restored (out of ${images.length})`)
  if (dryRun) console.log('Use --apply to execute')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
