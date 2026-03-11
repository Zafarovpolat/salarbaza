import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useLanguageStore } from "@/store/languageStore";
import { formatPrice } from "@/utils/formatPrice";
import { Button } from "../ui/Button";
import { Container } from "../layout/Container";

// ✅ FIX: Убран FREE_DELIVERY_THRESHOLD, прогресс-бар, всё про доставку

export function CartSummary() {
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const items = useCartStore((state) => state.items);

  const { subtotal, itemCount } = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const priceModifier = item.color?.priceModifier || 0;
      const basePrice = item.variant?.price || item.product.price;
      const price = basePrice + priceModifier;
      return sum + price * item.quantity;
    }, 0);

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return { subtotal, itemCount };
  }, [items]);

  const currency = language === "uz" ? "so'm" : "сум";

  if (items.length === 0) return null;

  return (
    <div
      className="
        fixed bottom-[70px] left-0 right-0 z-40
        bg-cream/95 backdrop-blur-[20px]
        border-t border-stone/50
        shadow-soft
      "
    >
      <Container>
        <div className="py-4">
          {/* ✅ FIX: Только итог — без прогресс-бара доставки */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-shrink-0">
              <div className="text-sm text-medium-gray">
                {itemCount} {language === "uz" ? "ta" : "шт"}
              </div>
              <div className="text-xl font-bold text-charcoal">
                {formatPrice(subtotal)}
                <span className="text-sm font-normal text-medium-gray ml-1">
                  {currency}
                </span>
              </div>
            </div>

            <Button
              onClick={() => navigate("/checkout")}
              variant="green"
              size="lg"
              className="flex-shrink-0"
              rightIcon={<ChevronRight className="w-5 h-5" />}
            >
              {language === "uz" ? "Buyurtma" : "Заказать"}
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}