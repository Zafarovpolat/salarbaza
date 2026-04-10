import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Sparkles,
  TrendingUp,
  Clock,
  Heart,
  ShoppingBag,
} from "lucide-react";
import { useLanguageStore } from "@/store/languageStore";
import { useCategories } from "@/hooks/useCategories";
import { productService } from "@/services/productService";
import { Product } from "@/types";
import { CategoryList } from "@/components/category/CategoryList";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PromotionWidget } from "@/components/home/PromotionWidget";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { getProductName, cn, safeProductUrl } from "@/utils/helpers";
import { formatPrice } from "@/utils/formatPrice";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";

// ✅ FIX: кэш продуктов — не грузим заново при каждом переходе на главную
let cachedFeatured: Product[] | null = null;
let cachedNew: Product[] | null = null;
let cachedSale: Product[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 минута

export function HomePage() {
  const navigate = useNavigate();
  const { t, language } = useLanguageStore();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { addItem } = useCartStore();

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(
    cachedFeatured || []
  );
  const [newProducts, setNewProducts] = useState<Product[]>(cachedNew || []);
  const [saleProducts, setSaleProducts] = useState<Product[]>(cachedSale || []);
  const [isLoading, setIsLoading] = useState(!cachedFeatured);

  useEffect(() => {
    // ✅ FIX: если кэш свежий — не грузим
    if (
      cachedFeatured &&
      cachedNew &&
      cachedSale &&
      Date.now() - cacheTime < CACHE_TTL
    ) {
      setFeaturedProducts(cachedFeatured);
      setNewProducts(cachedNew);
      setSaleProducts(cachedSale);
      setIsLoading(false);
      return;
    }

    async function fetchProducts() {
      try {
        setIsLoading(true);
        const [featured, newOnes, sale] = await Promise.all([
          productService.getFeaturedProducts(6),
          productService.getNewProducts(6),
          productService.getSaleProducts(8),
        ]);

        // Сохраняем в кэш
        cachedFeatured = featured;
        cachedNew = newOnes;
        cachedSale = sale;
        cacheTime = Date.now();

        setFeaturedProducts(featured);
        setNewProducts(newOnes);
        setSaleProducts(sale);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const currency = language === "uz" ? "so'm" : "сум";

  // ✅ FIX: мемоизация обработчиков
  const handleAddToCart = useCallback(
    (e: React.MouseEvent, product: Product) => {
      e.stopPropagation();
      addItem(product as any, 1);
      toast.success(
        language === "uz" ? "Savatga qo'shildi" : "Добавлено в корзину",
        { duration: 1500 }
      );
    },
    [addItem, language]
  );

  return (
    <div className="pb-4">
      {/* ===== HERO ===== */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="
          relative overflow-hidden
          mx-4 mt-3 rounded-3xl
          min-h-[420px] md:min-h-[520px]
          flex items-end
        "
      >
        <div className="absolute inset-0 bg-gradient-to-br from-forest via-emerald to-sage z-0" />
        <div
          className="absolute inset-0 opacity-[0.08] z-[1]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Декоративные органические элементы */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -right-[80px] -top-20 w-[400px] h-[400px] z-[1]"
          style={{
            background: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, transparent 70%)",
            borderRadius: "63% 37% 54% 46% / 55% 48% 52% 45%",
            filter: "blur(1px)",
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, -8, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute right-4 top-12 w-[220px] h-[220px] z-[1]"
          style={{
            background: "radial-gradient(circle at 60% 50%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 60%, transparent 80%)",
            borderRadius: "47% 53% 61% 39% / 43% 37% 63% 57%",
            filter: "blur(0.5px)",
          }}
        />
        {/* Маленькие акцентные точки */}
        <div className="absolute right-[180px] top-[140px] w-3 h-3 rounded-full bg-mint/30 z-[1]" />
        <div className="absolute right-[120px] top-[260px] w-2 h-2 rounded-full bg-white/20 z-[1]" />

        <div className="relative z-[2] p-7 md:p-10 text-white w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Badge variant="outline" className="mb-4">
              <span className="w-1.5 h-1.5 bg-mint rounded-full animate-pulse-dot" />
              {language === "uz" ? "O'zbekistonda №1" : "№1 в Узбекистане"}
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-3xl md:text-[44px] font-medium leading-[1.15] mb-3 tracking-[-0.02em]"
          >
            {language === "uz"
              ? "Bezak va ko'kalamzorlashtirish san'ati"
              : "Искусство декора и озеленения"}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[15px] leading-[1.7] opacity-85 mb-6 max-w-[420px]"
          >
            {language === "uz"
              ? "Premium sun'iy daraxtlar, o'simliklar va gullar. Restoranlar, mehmonxonalar va xususiy uylar uchun."
              : "Премиальные искусственные деревья, растения и цветы. Проекты под ключ для ресторанов и домов."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-3 flex-wrap"
          >
            <button
              onClick={() => navigate("/catalog")}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-forest rounded-full font-sans text-sm font-semibold uppercase tracking-[0.04em] transition-all duration-400 ease-smooth hover:-translate-y-0.5 hover:shadow-button active:translate-y-0"
            >
              {language === "uz" ? "Katalogni ko'rish" : "Смотреть каталог"}
            </button>
          </motion.div>
        </div>
      </motion.section>

      {/* ===== STATS ===== */}
      <div className="flex justify-center gap-2 py-6 px-4 flex-wrap">
        {[
          { number: "500+", labelRu: "Товаров", labelUz: "Mahsulotlar" },
          { number: "150+", labelRu: "Проектов", labelUz: "Loyihalar" },
          { number: "2", labelRu: "Филиала", labelUz: "Filial" },
        ].map((stat) => (
          <div
            key={stat.number}
            className="flex flex-col items-center py-3.5 px-5 bg-ivory rounded-2xl flex-1 min-w-[100px] max-w-[160px] border border-stone/20"
          >
            <div className="font-display text-2xl font-semibold text-forest leading-[1.2]">
              {stat.number}
            </div>
            <div className="text-[11px] text-medium-gray font-medium text-center mt-0.5">
              {language === "ru" ? stat.labelRu : stat.labelUz}
            </div>
          </div>
        ))}
      </div>

      {/* ===== CATEGORIES ===== */}
      <section className="py-6">
        <Container>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="font-display text-2xl font-medium text-charcoal">
                {t("home.categories")}
              </h2>
              <p className="text-sm text-medium-gray mt-1">
                {language === "uz"
                  ? "Kerakli bo'limni tanlang"
                  : "Выберите интересующий раздел"}
              </p>
            </div>
            <button
              onClick={() => navigate("/catalog")}
              className="text-sm font-semibold text-forest flex items-center gap-1 hover:gap-2 transition-all duration-300"
            >
              {t("home.viewAll")}
              <ChevronRight className="w-[18px] h-[18px]" strokeWidth={2} />
            </button>
          </div>
          <CategoryList
            categories={categories}
            isLoading={categoriesLoading}
            variant="scroll"
          />
        </Container>
      </section>

      {/* ===== PROMOTIONS WIDGET ===== */}
      <PromotionWidget />

      {/* ===== SALE PRODUCTS ===== */}
      {saleProducts.length > 0 && (
        <section className="bg-gradient-to-br from-forest to-emerald py-10 relative overflow-hidden">
          <div className="absolute -top-[100px] -right-[100px] w-[400px] h-[400px] rounded-full bg-white/[0.04]" />
          <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full bg-white/[0.03]" />

          <Container>
            <div className="flex items-end justify-between mb-5 relative z-[2]">
              <div>
                <h2 className="font-display text-2xl font-medium text-white">
                  {language === "uz"
                    ? "Maxsus takliflar"
                    : "Специальные предложения"}
                </h2>
                <p className="text-sm text-white/70 mt-1">
                  {language === "uz"
                    ? "Tanlangan mahsulotlarga chegirma"
                    : "Скидки на избранные товары"}
                </p>
                <div className="inline-flex items-center gap-2 bg-white/[0.12] rounded-full px-4 py-2 mt-2 text-[13px] text-white/90 font-medium">
                  <Clock className="w-4 h-4 text-warning" strokeWidth={2} />
                  {language === "uz" ? "3 kun qoldi" : "Осталось 3 дня"}
                </div>
              </div>
            </div>

            <div className="relative z-[2] flex gap-3.5 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
              {saleProducts.map((product, index) => {
                const name = getProductName(product, language);
                const image = product.images?.[0]?.url;
                const isLiked = isFavorite(product.id);
                const discount = product.oldPrice
                  ? Math.round((1 - product.price / product.oldPrice) * 100)
                  : 0;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex-none w-[260px] snap-start"
                  >
                    <div
                      onClick={() => navigate(safeProductUrl(product.slug))}
                      className="bg-white rounded-2xl overflow-hidden cursor-pointer group transition-all duration-400 hover:-translate-y-1 hover:shadow-card-strong"
                    >
                      <div className="relative aspect-square bg-ivory m-2.5 rounded-xl overflow-hidden">
                        {image ? (
                          <img
                            src={image}
                            alt={name}
                            className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            🪴
                          </div>
                        )}
                        {discount > 0 && (
                          <Badge
                            variant="sale"
                            className="absolute top-3 left-3"
                          >
                            -{discount}%
                          </Badge>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(product);
                          }}
                          className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                        >
                          <Heart
                            className={cn(
                              "w-[18px] h-[18px]",
                              isLiked
                                ? "fill-terracotta stroke-terracotta"
                                : "fill-none stroke-terracotta"
                            )}
                            strokeWidth={2}
                          />
                        </button>
                      </div>
                      <div className="px-4 pb-4 pt-1">
                        <div className="font-display text-base font-medium text-charcoal mb-2.5 leading-[1.3] line-clamp-2 min-h-[2.6em]">
                          {name}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-forest">
                            {formatPrice(product.price)} {currency}
                          </span>
                          {product.oldPrice && (
                            <span className="text-sm text-light-gray line-through">
                              {formatPrice(product.oldPrice)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          className="w-full mt-3 py-3 bg-forest text-white rounded-xl font-sans text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 hover:bg-emerald hover:-translate-y-[1px] active:translate-y-0"
                        >
                          <ShoppingBag className="w-4 h-4" strokeWidth={2} />
                          {language === "uz" ? "Savatga" : "В корзину"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="relative z-[2] text-center mt-6">
              <button
                onClick={() => navigate("/special-offers")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/15 hover:bg-white/25 text-white rounded-full text-sm font-semibold transition-all duration-300"
              >
                {language === "uz"
                  ? "Barcha takliflarni ko'rish"
                  : "Смотреть все предложения"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </Container>
        </section>
      )}

      {/* ===== FEATURED ===== */}
      {featuredProducts.length > 0 && (
        <section className="py-8">
          <Container>
            <div className="flex items-end justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-forest to-sage rounded-xl flex items-center justify-center">
                  <TrendingUp
                    className="w-4 h-4 text-white"
                    strokeWidth={1.5}
                  />
                </div>
                <h2 className="font-display text-2xl font-medium text-charcoal">
                  {t("home.featured")}
                </h2>
              </div>
              <button
                onClick={() => navigate("/catalog?featured=true")}
                className="text-sm font-semibold text-forest flex items-center gap-1 hover:gap-2 transition-all duration-300"
              >
                {t("home.viewAll")}
                <ChevronRight className="w-[18px] h-[18px]" strokeWidth={2} />
              </button>
            </div>
            <ProductGrid products={featuredProducts} isLoading={isLoading} />
          </Container>
        </section>
      )}

      {/* ===== NEW ===== */}
      {newProducts.length > 0 && (
        <section className="py-8 bg-ivory">
          <Container>
            <div className="flex items-end justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-warning to-terracotta rounded-xl flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" strokeWidth={1.5} />
                </div>
                <h2 className="font-display text-2xl font-medium text-charcoal">
                  {t("home.new")}
                </h2>
              </div>
              <button
                onClick={() => navigate("/catalog")}
                className="text-sm font-semibold text-forest flex items-center gap-1 hover:gap-2 transition-all duration-300"
              >
                {t("home.viewAll")}
                <ChevronRight className="w-[18px] h-[18px]" strokeWidth={2} />
              </button>
            </div>
            <ProductGrid products={newProducts} isLoading={isLoading} />
          </Container>
        </section>
      )}

      {/* ===== CTA BANNER ===== */}
      <section className="py-8 px-4">
        <div
          onClick={() => navigate("/catalog")}
          className="bg-gradient-to-br from-forest via-emerald to-sage rounded-3xl p-8 md:p-10 text-center text-white cursor-pointer relative overflow-hidden transition-all duration-400 hover:shadow-card-hover"
        >
          <div className="absolute -top-2.5 -right-2.5 text-[100px] opacity-[0.08] rotate-[15deg]">
            🌿
          </div>
          <div className="absolute -bottom-2.5 left-5 text-[60px] opacity-[0.08] -rotate-[20deg]">
            🪴
          </div>
          <h3 className="font-display text-2xl md:text-3xl font-medium mb-2 relative z-[2]">
            {language === "uz" ? "Barcha mahsulotlar" : "Все товары"}
          </h3>
          <p className="text-white/80 text-sm mb-5 relative z-[2]">
            {language === "uz"
              ? "500+ turdagi dekoratsiyalar"
              : "500+ видов декора"}
          </p>
          <div className="relative z-[2] inline-flex items-center gap-2 bg-white text-forest px-6 py-3 rounded-full font-semibold text-sm uppercase tracking-[0.04em]">
            {language === "uz" ? "Katalogni ko'rish" : "Смотреть каталог"}
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </section>
    </div>
  );
}