import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import WebApp from "@twa-dev/sdk";
import { useLanguageStore } from "@/store/languageStore";
import { useCategory } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Container } from "@/components/layout/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import { getCategoryName } from "@/utils/helpers";
import toast from "react-hot-toast";

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || "DecorMarketUz_Bot";

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguageStore();

  const { category, isLoading: categoryLoading } = useCategory(slug || "");
  const { products, isLoading, hasMore, loadMore, total } = useProducts({
    categorySlug: slug,
  });
  const { loadMoreRef } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading,
  });

  const categoryName = category ? getCategoryName(category, language) : "";

  // ✅ ИСПРАВЛЕНО: прямая ссылка на WebApp (не через бота)
  const handleShare = () => {
    if (!slug) return;

    // ✅ Формат: t.me/Bot/app?startapp=category_SLUG
    // Это откроет мини-приложение СРАЗУ, без захода в бота
    const directAppUrl = `https://t.me/${BOT_USERNAME}/app?startapp=category_${slug}`;
    const shareText =
      language === "uz"
        ? `${categoryName} — Decor Market do'konida ko'ring!`
        : `${categoryName} — смотрите в Decor Market!`;

    try {
      // Вариант 1: Telegram Share через SDK
      const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(directAppUrl)}&text=${encodeURIComponent(shareText)}`;

      if (typeof WebApp.openTelegramLink === "function") {
        WebApp.openTelegramLink(tgShareUrl);
      } else {
        window.open(tgShareUrl, "_blank");
      }
    } catch {
      // Fallback: копируем ссылку
      navigator.clipboard
        .writeText(directAppUrl)
        .then(() =>
          toast.success(
            language === "uz" ? "Havola nusxalandi" : "Ссылка скопирована",
            { duration: 1500 },
          ),
        )
        .catch(() => {
          // Последний fallback
          window.open(
            `https://t.me/share/url?url=${encodeURIComponent(directAppUrl)}`,
            "_blank",
          );
        });
    }
  };

  return (
    <div className="pb-6">
      {/* Header */}
      <section className="py-8 bg-ivory border-b border-stone/30">
        <Container>
          {categoryLoading ? (
            <div className="space-y-2">
              <Skeleton height={32} className="w-48" />
              <Skeleton height={16} className="w-32" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="font-display text-3xl font-medium text-charcoal mb-1">
                    {categoryName}
                  </h1>
                  <p className="text-medium-gray text-sm">
                    {total} {language === "uz" ? "ta mahsulot" : "товаров"}
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="w-10 h-10 bg-sand rounded-full flex items-center justify-center hover:bg-stone transition-colors flex-shrink-0 mt-1"
                >
                  <Share2
                    className="w-5 h-5 text-dark-gray"
                    strokeWidth={1.5}
                  />
                </motion.button>
              </div>
            </motion.div>
          )}
        </Container>
      </section>

      {/* Grid */}
      <section className="py-6">
        <Container>
          <ProductGrid
            products={products}
            isLoading={isLoading && products.length === 0}
          />
          <div
            ref={loadMoreRef}
            className="h-20 flex items-center justify-center"
          >
            {isLoading && products.length > 0 && (
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                    className="w-2 h-2 bg-forest rounded-full"
                  />
                ))}
              </div>
            )}
          </div>
        </Container>
      </section>
    </div>
  );
}
