import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Share2, ChevronLeft, ChevronRight, Tag } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { useProduct } from '@/hooks/useProducts'
import { useTelegram } from '@/hooks/useTelegram'
import { useCartStore } from '@/store/cartStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { ProductColor, ProductVariant, WholesalePriceTier } from '@/types'
import { getProductName, getProductDescription, cn, decodeSlug } from '@/utils/helpers'
import { formatPrice } from '@/utils/formatPrice'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ColorSelector } from '@/components/product/ColorSelector'
import { SizeSelector } from '@/components/product/SizeSelector'
import { PriceDisplay } from '@/components/product/PriceDisplay'
import { QuantitySelector } from '@/components/ui/QuantitySelector'
import { ProductRecommendations } from '@/components/product/ProductRecommendations'
import toast from 'react-hot-toast'

export function ProductPage() {
  const { slug: rawSlug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { language, t } = useLanguageStore()
  const { haptic } = useTelegram()
  const { addItem, isInCart } = useCartStore()
  const { toggleFavorite, isFavorite } = useFavoritesStore()

  // ✅ Декодируем slug из URL
  const slug = rawSlug ? decodeSlug(rawSlug) : ''

  const { product, isLoading, error } = useProduct(slug)

  const [selectedColor, setSelectedColor] = useState<ProductColor | undefined>()
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>()
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const hasVariants = product?.variants && product.variants.length > 0

  useEffect(() => { window.scrollTo(0, 0) }, [slug])

  useEffect(() => {
    setSelectedColor(undefined)
    setSelectedVariant(undefined)
    setQuantity(1)
    setCurrentImageIndex(0)
  }, [slug])

  useEffect(() => {
    if (product?.colors?.length) setSelectedColor(product.colors[0])
  }, [product])

  useEffect(() => {
    if (product?.variants?.length) {
      setSelectedVariant(product.variants.find(v => v.inStock) || product.variants[0])
    } else {
      setSelectedVariant(undefined)
    }
  }, [product])

  const currentPrice = useMemo(() => {
    return (selectedVariant?.price || product?.price || 0) + (selectedColor?.priceModifier || 0)
  }, [selectedVariant, selectedColor, product])

  const currentOldPrice = useMemo(() => {
    const old = selectedVariant?.oldPrice || product?.oldPrice
    return old ? old + (selectedColor?.priceModifier || 0) : undefined
  }, [selectedVariant, selectedColor, product])

  const wholesaleTiers: WholesalePriceTier[] = useMemo(() => {
    return (product as any)?.category?.wholesaleTemplate?.tiers || []
  }, [product])

  const currentWholesaleDiscount = useMemo(() => {
    if (!wholesaleTiers.length) return 0
    const sorted = [...wholesaleTiers].sort((a, b) => b.minQuantity - a.minQuantity)
    for (const tier of sorted) {
      if (quantity >= tier.minQuantity) return tier.discountPercent
    }
    return 0
  }, [wholesaleTiers, quantity])

  const wholesalePrice = useMemo(() => {
    return currentWholesaleDiscount > 0
      ? Math.round(currentPrice * (1 - currentWholesaleDiscount / 100))
      : currentPrice
  }, [currentPrice, currentWholesaleDiscount])

  const finalUnitPrice = currentWholesaleDiscount > 0 ? wholesalePrice : currentPrice
  const finalTotalPrice = finalUnitPrice * quantity

  if (isLoading) return <ProductPageSkeleton />

  if (error || !product) {
    return (
      <Container className="py-12 text-center">
        <p className="text-medium-gray">{t('common.error')}</p>
        <Button variant="green" onClick={() => navigate(-1)} className="mt-4">{t('common.back')}</Button>
      </Container>
    )
  }

  const name = getProductName(product, language)
  const description = getProductDescription(product, language)
  const images = product.images || []
  const currentImage = images[currentImageIndex]?.url
  const isProductFavorite = isFavorite(product.id)
  const currency = language === 'uz' ? "so'm" : 'сум'
  const productInCart = isInCart(product.id, selectedColor?.id, selectedVariant?.id)
  const canAddToCart = product.inStock && (!hasVariants || (selectedVariant && selectedVariant.inStock))
  const discountPercent = currentOldPrice ? Math.round((1 - currentPrice / currentOldPrice) * 100) : 0

  const handleFavorite = () => {
    haptic.impact('light')
    toggleFavorite(product)
    toast.success(!isProductFavorite
      ? (language === 'uz' ? "Sevimlilarga qo'shildi" : 'Добавлено в избранное')
      : (language === 'uz' ? "Sevimlilardan o'chirildi" : 'Удалено из избранного'),
      { duration: 1500 }
    )
  }

  const handleShare = async () => {
    haptic.impact('light')
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success(language === 'uz' ? 'Havola nusxalandi' : 'Ссылка скопирована', { duration: 1500 })
      }
    } catch { /* cancelled */ }
  }

  const handleAddToCart = () => {
    if (productInCart) { navigate('/cart'); return }
    if (hasVariants && !selectedVariant) {
      toast.error(language === 'uz' ? "Iltimos, o'lchamni tanlang" : 'Пожалуйста, выберите размер', { duration: 2000 })
      return
    }
    if (!canAddToCart) return
    haptic.impact('light')
    addItem(product, quantity, selectedColor, selectedVariant)
    toast.success(language === 'uz' ? "Savatga qo'shildi" : 'Добавлено в корзину', { duration: 1500 })
  }

  return (
    <div className="pb-36">
      {/* ===== Gallery ===== */}
      <section className="relative bg-sand">
        <div
  className="aspect-square relative overflow-hidden"
  onTouchStart={(e) => {
    const touch = e.touches[0]
    ;(e.currentTarget as any)._touchStartX = touch.clientX
    ;(e.currentTarget as any)._touchStartY = touch.clientY
  }}
  onTouchEnd={(e) => {
    const startX = (e.currentTarget as any)._touchStartX
    const startY = (e.currentTarget as any)._touchStartY
    if (startX === undefined) return
    const touch = e.changedTouches[0]
    const diffX = touch.clientX - startX
    const diffY = touch.clientY - startY
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX < 0 && currentImageIndex < images.length - 1) {
        setCurrentImageIndex(i => i + 1)
      } else if (diffX > 0 && currentImageIndex > 0) {
        setCurrentImageIndex(i => i - 1)
      }
    }
  }}
>
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={currentImage || '/placeholder.png'}
              alt={name}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.isNew && <Badge variant="new">NEW</Badge>}
            {discountPercent > 0 && <Badge variant="sale">-{discountPercent}%</Badge>}
            {hasVariants && (
              <Badge variant="forest">
                {product.variants.length} {language === 'uz' ? "o'lcham" : 'размер.'}
              </Badge>
            )}
          </div>

          {/* Heart & Share */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleFavorite}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                'bg-white/90 backdrop-blur-sm shadow-soft',
                'transition-all duration-300',
                isProductFavorite ? 'text-terracotta' : 'text-medium-gray'
              )}
            >
              <Heart className="w-5 h-5" strokeWidth={2} fill={isProductFavorite ? 'currentColor' : 'none'} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-sm shadow-soft text-medium-gray"
            >
              <Share2 className="w-5 h-5" strokeWidth={2} />
            </motion.button>
          </div>

          {/* Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex(i => (i > 0 ? i - 1 : images.length - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-soft"
              >
                <ChevronLeft className="w-5 h-5 text-dark-gray" />
              </button>
              <button
                onClick={() => setCurrentImageIndex(i => (i < images.length - 1 ? i + 1 : 0))}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-soft"
              >
                <ChevronRight className="w-5 h-5 text-dark-gray" />
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(i)}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  i === currentImageIndex ? 'bg-forest w-6' : 'bg-white/60 w-2'
                )}
              />
            ))}
          </div>
        )}
      </section>

      {/* ===== Info ===== */}
      <section className="py-6">
        <Container className="space-y-6">
          {/* Name & Code */}
          <div>
            <p className="text-sm text-taupe mb-1">
              {language === 'uz' ? 'Kod' : 'Код'}: {product.code}
              {selectedVariant?.sku && ` / ${selectedVariant.sku}`}
            </p>
            <h1 className="font-display text-2xl font-medium text-charcoal">{name}</h1>
          </div>

          {/* Price */}
          <div>
            <PriceDisplay price={currentPrice} oldPrice={currentOldPrice} size="lg" />

            {hasVariants && product.variants.length > 1 && (() => {
              const min = Math.min(...product.variants.map(v => v.price))
              const max = Math.max(...product.variants.map(v => v.price))
              if (min === max) return null
              return (
                <p className="text-sm text-medium-gray mt-1">
                  {language === 'uz' ? 'Narxlar' : 'Цены'}: {formatPrice(min)} — {formatPrice(max)} {currency}
                </p>
              )
            })()}

            {currentWholesaleDiscount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-center gap-2 bg-sage/10 text-forest rounded-xl px-4 py-2.5 border border-sage/20"
              >
                <Tag className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {language === 'uz'
                    ? `Ulgurji: -${currentWholesaleDiscount}% = ${formatPrice(wholesalePrice)} ${currency}`
                    : `Опт: -${currentWholesaleDiscount}% = ${formatPrice(wholesalePrice)} ${currency}`
                  }
                </span>
              </motion.div>
            )}
          </div>

          {/* Size */}
          {hasVariants && (
            <SizeSelector
              variants={product.variants}
              selectedId={selectedVariant?.id}
              onChange={setSelectedVariant}
            />
          )}

          {/* Wholesale */}
          {wholesaleTiers.length > 0 && (
            <WholesaleTable tiers={wholesaleTiers} basePrice={currentPrice} currentQuantity={quantity} />
          )}

          {/* Colors */}
          {product.colors?.length > 0 && (
            <div>
              <h3 className="font-semibold text-charcoal mb-3">{t('product.colors')}</h3>
              <ColorSelector colors={product.colors} selectedId={selectedColor?.id} onChange={setSelectedColor} />
            </div>
          )}

          {/* Dimensions */}
          {!hasVariants && product.dimensions && (
            <div>
              <h3 className="font-semibold text-charcoal mb-2">{t('product.dimensions')}</h3>
              <div className="bg-ivory rounded-2xl p-4 space-y-1 border border-stone/30 text-dark-gray text-sm">
                {product.dimensions.size && <p>{product.dimensions.size}</p>}
                {product.dimensions.diameter_cm && <p>{language === 'uz' ? 'Diametri' : 'Диаметр'}: {product.dimensions.diameter_cm} sm</p>}
                {product.dimensions.height_cm && <p>{language === 'uz' ? 'Balandligi' : 'Высота'}: {product.dimensions.height_cm} sm</p>}
                {product.dimensions.volume_liters && <p>{language === 'uz' ? 'Hajmi' : 'Объём'}: {product.dimensions.volume_liters} L</p>}
              </div>
            </div>
          )}

          {/* Description */}
          {description && (
            <div>
              <h3 className="font-semibold text-charcoal mb-2">{t('product.description')}</h3>
              <p className="text-dark-gray leading-relaxed text-[15px]">{description}</p>
            </div>
          )}

          {/* Material */}
          {product.material && (
            <div>
              <h3 className="font-semibold text-charcoal mb-2">{t('product.material')}</h3>
              <Badge variant="default">
                {product.material === 'plastic' && (language === 'uz' ? 'Plastik' : 'Пластик')}
                {product.material === 'metal' && (language === 'uz' ? 'Metall' : 'Металл')}
                {product.material === 'woven' && (language === 'uz' ? "To'qilgan" : 'Плетёный')}
              </Badge>
            </div>
          )}

          <ProductRecommendations productId={product.id} className="pt-4" />
        </Container>
      </section>

      {/* ===== Bottom Bar ===== */}
      <div className="fixed bottom-[70px] left-0 right-0 bg-cream/95 backdrop-blur-[20px] border-t border-stone/50 shadow-soft z-40">
        <div className="p-4">
          <Container>
            <div className="flex items-center gap-3">
              <QuantitySelector
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={selectedVariant?.stockQuantity || product.stockQuantity || 99}
              />
              <div className="flex-1">
                <Button
                  onClick={handleAddToCart}
                  disabled={!canAddToCart && !productInCart}
                  fullWidth
                  size="lg"
                  variant={productInCart ? 'ghost' : 'green'}
                  className={cn(productInCart && 'bg-sage/15 text-forest hover:bg-sage/25')}
                >
                  {productInCart ? (
                    <span className="flex items-center gap-2">✓ {language === 'uz' ? 'Savatda' : 'В корзине'}</span>
                  ) : (
                    <span>
                      {formatPrice(finalTotalPrice)} {currency}
                      {currentWholesaleDiscount > 0 && <span className="text-xs opacity-75 ml-1">(-{currentWholesaleDiscount}%)</span>}
                      <span className="mx-1">·</span>
                      {language === 'uz' ? 'Savatga' : 'В корзину'}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </div>
  )
}

// ===== Wholesale Table =====
function WholesaleTable({ tiers, basePrice, currentQuantity }: {
  tiers: WholesalePriceTier[]; basePrice: number; currentQuantity: number
}) {
  const { language } = useLanguageStore()
  const currency = language === 'uz' ? "so'm" : 'сум'
  if (!tiers?.length) return null

  const sorted = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity)
  const activeTierId = (() => {
    const desc = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity)
    for (const t of desc) { if (currentQuantity >= t.minQuantity) return t.id }
    return null
  })()

  return (
    <div className="bg-gradient-to-br from-forest/5 to-sage/10 rounded-3xl p-5 border border-sage/20">
      <h3 className="font-display text-base font-medium text-charcoal mb-3 flex items-center gap-2">
        <Tag className="w-4 h-4 text-forest" />
        {language === 'uz' ? 'Ulgurji narxlar' : 'Оптовые цены'}
      </h3>
      <div className="space-y-2">
        {sorted.map((tier) => {
          const discounted = Math.round(basePrice * (1 - tier.discountPercent / 100))
          const isActive = activeTierId === tier.id
          return (
            <div
              key={tier.id}
              className={cn(
                'flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all duration-300',
                isActive ? 'bg-forest text-white shadow-button-green' : 'bg-ivory border border-stone/30'
              )}
            >
              <span className={cn('text-sm font-medium', isActive ? 'text-white' : 'text-charcoal')}>
                {language === 'uz' ? '' : 'от'} {tier.minQuantity} {language === 'uz' ? 'donadan' : 'шт'}
                {isActive && ' ✓'}
              </span>
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-bold', isActive ? 'text-white' : 'text-forest')}>
                  {formatPrice(discounted)} {currency}
                </span>
                <span className={cn(
                  'text-[11px] px-2 py-0.5 rounded-full font-bold',
                  isActive ? 'bg-white/20 text-white' : 'bg-terracotta/15 text-terracotta'
                )}>
                  -{tier.discountPercent}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
      {!activeTierId && sorted.length > 0 && (
        <p className="text-xs text-sage mt-3 text-center font-medium">
          {language === 'uz' ? `${sorted[0].minQuantity} donadan boshlab chegirma` : `Скидка от ${sorted[0].minQuantity} шт`}
        </p>
      )}
    </div>
  )
}

function ProductPageSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-square w-full" />
      <Container className="py-6 space-y-4">
        <Skeleton height={16} className="w-24" />
        <Skeleton height={32} className="w-3/4" />
        <Skeleton height={28} className="w-32" />
        <div className="flex gap-2">
          {[1, 2, 3].map(i => <Skeleton key={i} height={70} width={90} className="rounded-2xl" />)}
        </div>
        <Skeleton height={100} className="w-full rounded-2xl" />
      </Container>
    </div>
  )
}