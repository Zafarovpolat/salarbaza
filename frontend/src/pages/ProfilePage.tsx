import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Package,
  Globe,
  HelpCircle,
  MessageCircle,
  ChevronRight,
  Check,
  MapPin,
  Phone,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useLanguageStore } from "@/store/languageStore";
import { useUserStore } from "@/store/userStore";
import { useTelegram } from "@/hooks/useTelegram";
import { Container } from "@/components/layout/Container";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/utils/helpers";

// ✅ Данные филиалов (легко обновить)
const BRANCHES = [
  {
    id: 1,
    nameRu: "Филиал Чиланзар",
    nameUz: "Chilonzor filiali",
    addressRu: "г. Ташкент, Чиланзарский район, ул. Бунёдкор, 42",
    addressUz: "Toshkent sh., Chilonzor tumani, Bunyodkor ko'chasi, 42",
    phone: "+998 (99) 368-11-00",
    hours: "09:00 – 18:00",
    daysRu: "Пн–Сб",
    daysUz: "Du–Sha",
    mapUrl: "https://yandex.uz/maps/-/CHfaBJ",
  },
  {
    id: 2,
    nameRu: "Филиал Сергели",
    nameUz: "Sergeli filiali",
    addressRu: "г. Ташкент, Сергелийский район, массив Янги Сергели",
    addressUz: "Toshkent sh., Sergeli tumani, Yangi Sergeli massivi",
    phone: "+998 (99) 368-11-00",
    hours: "09:00 – 18:00",
    daysRu: "Пн–Сб",
    daysUz: "Du–Sha",
    mapUrl: "https://yandex.uz/maps/-/CHfaBJ",
  },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguageStore();
  const { user } = useUserStore();
  const { user: tgUser } = useTelegram();

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isBranchesModalOpen, setIsBranchesModalOpen] = useState(false);

  const displayName =
    user?.firstName ||
    tgUser?.first_name ||
    (language === "uz" ? "Foydalanuvchi" : "Пользователь");

  const menuItems = [
    {
      icon: Package,
      label: language === "uz" ? "Buyurtmalarim" : "Мои заказы",
      onClick: () => navigate("/orders"),
    },
    // ✅ НОВОЕ: Филиалы
    {
      icon: MapPin,
      label: language === "uz" ? "Filiallar" : "Филиалы",
      onClick: () => setIsBranchesModalOpen(true),
    },
    {
      icon: Globe,
      label: language === "uz" ? "Til" : "Язык",
      value: language === "uz" ? "O'zbekcha" : "Русский",
      onClick: () => setIsLanguageModalOpen(true),
    },
    {
      icon: HelpCircle,
      label: language === "uz" ? "Yordam" : "Помощь",
      onClick: () => setIsHelpModalOpen(true),
    },
    // ✅ CHANGED: @DekorHouseAdmin
    {
      icon: MessageCircle,
      label: language === "uz" ? "Bog'lanish" : "Связаться",
      onClick: () => window.open("https://t.me/DekorHouseAdmin", "_blank"),
    },
  ];

  return (
    <div className="pb-20">
      {/* Header */}
      <section className="bg-gradient-to-br from-forest via-emerald to-sage text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-[200px] h-[200px] rounded-full bg-white/5" />
        <Container className="py-8 relative z-[2]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <User className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-display text-xl font-medium">
                {displayName}
              </h1>
              {tgUser?.username && (
                <p className="text-mint text-sm">@{tgUser.username}</p>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Menu */}
      <section className="py-4">
        <Container>
          <div className="bg-ivory rounded-3xl overflow-hidden border border-stone/30">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={index}
                  whileTap={{ scale: 0.99 }}
                  onClick={item.onClick}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 text-left transition-colors duration-300 hover:bg-sand/50",
                    index < menuItems.length - 1 && "border-b border-stone/20",
                  )}
                >
                  <div className="w-10 h-10 bg-sand rounded-2xl flex items-center justify-center">
                    <Icon
                      className="w-5 h-5 text-dark-gray"
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="flex-1 font-medium text-charcoal">
                    {item.label}
                  </span>
                  {item.value && (
                    <span className="text-taupe text-sm">{item.value}</span>
                  )}
                  <ChevronRight className="w-5 h-5 text-taupe" />
                </motion.button>
              );
            })}
          </div>
        </Container>
      </section>

      {/* App Info */}
      <section className="py-4">
        <Container>
          <div className="text-center">
            {/* ✅ CHANGED: Decor Market */}
            <span className="font-display text-lg text-forest font-semibold">
              Decor<span className="text-sage font-normal"> Market</span>
            </span>
            <p className="text-xs text-taupe mt-1">v1.0.0</p>
          </div>
        </Container>
      </section>

      {/* ========== Language Modal ========== */}
      <Modal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        title={language === "uz" ? "Tilni tanlang" : "Выберите язык"}
      >
        <div className="p-5 space-y-2">
          {[
            { code: "uz" as const, label: "O'zbekcha", flag: "🇺🇿" },
            { code: "ru" as const, label: "Русский", flag: "🇷🇺" },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsLanguageModalOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-300",
                language === lang.code
                  ? "bg-forest/5 border-2 border-forest"
                  : "bg-ivory border-2 border-transparent hover:bg-sand",
              )}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="flex-1 font-medium text-left text-charcoal">
                {lang.label}
              </span>
              {language === lang.code && (
                <Check className="w-5 h-5 text-forest" />
              )}
            </button>
          ))}
        </div>
      </Modal>

      {/* ========== Help Modal ========== */}
      <Modal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        title={language === "uz" ? "Yordam" : "Помощь"}
      >
        {/* ✅ FIX: добавлен max-height, overflow-y-auto и safe-area padding */}
        <div
          className="p-5 space-y-5 overflow-y-auto"
          style={{
            maxHeight: "calc(70vh - 60px)",
            paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))",
          }}
        >
          <div>
            <h3 className="font-display text-base font-medium text-charcoal mb-2">
              {language === "uz"
                ? "Qanday buyurtma berish mumkin?"
                : "Как сделать заказ?"}
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-dark-gray text-sm">
              <li>
                {language === "uz"
                  ? "Katalogdan mahsulot tanlang"
                  : "Выберите товар из каталога"}
              </li>
              <li>
                {language === "uz" ? "Savatga qo'shing" : "Добавьте в корзину"}
              </li>
              <li>
                {language === "uz" ? "Savatga o'ting" : "Перейдите в корзину"}
              </li>
              <li>
                {language === "uz"
                  ? "Ma'lumotlarni to'ldiring"
                  : "Заполните данные"}
              </li>
              <li>
                {language === "uz"
                  ? "Buyurtmani tasdiqlang"
                  : "Подтвердите заказ"}
              </li>
            </ol>
          </div>
          <div>
            <h3 className="font-display text-base font-medium text-charcoal mb-2">
              {language === "uz" ? "Yetkazib berish" : "Доставка"}
            </h3>
            <p className="text-dark-gray text-sm leading-relaxed">
              {language === "uz"
                ? "Toshkent shahriga Yandex yetkazib berish orqali, viloyatlarga tanish haydovchilar orqali yetkazamiz."
                : "В город Ташкент через Яндекс Доставку, а в регионы через знакомых водителей."}
            </p>
          </div>
          <div>
            <h3 className="font-display text-base font-medium text-charcoal mb-2">
              {language === "uz" ? "Bog'lanish" : "Контакты"}
            </h3>
            <p className="text-dark-gray text-sm">
              Telegram: @DekorHouseAdmin
              <br />
              {language === "uz" ? "Telefon" : "Телефон"}: +998 (99) 368-11-00
            </p>
          </div>
        </div>
      </Modal>

      {/* ========== 🆕 Branches Modal ========== */}
      <Modal
        isOpen={isBranchesModalOpen}
        onClose={() => setIsBranchesModalOpen(false)}
        title={language === "uz" ? "Filiallar" : "Филиалы"}
      >
        <div className="p-5 space-y-4">
          {BRANCHES.map((branch) => (
            <div
              key={branch.id}
              className="bg-ivory rounded-2xl p-4 border border-stone/30 space-y-3"
            >
              <h3 className="font-display text-base font-medium text-charcoal">
                {language === "uz" ? branch.nameUz : branch.nameRu}
              </h3>

              <div className="flex items-start gap-2.5 text-sm text-dark-gray">
                <MapPin className="w-4 h-4 text-forest mt-0.5 flex-shrink-0" />
                <span>
                  {language === "uz" ? branch.addressUz : branch.addressRu}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-sm text-dark-gray">
                <Phone className="w-4 h-4 text-forest flex-shrink-0" />
                <a
                  href={`tel:${branch.phone.replace(/[^+\d]/g, "")}`}
                  className="text-forest font-medium"
                >
                  {branch.phone}
                </a>
              </div>

              <div className="flex items-center gap-2.5 text-sm text-dark-gray">
                <Clock className="w-4 h-4 text-forest flex-shrink-0" />
                <span>
                  {language === "uz" ? branch.daysUz : branch.daysRu}:{" "}
                  {branch.hours}
                </span>
              </div>

              <button
                onClick={() => window.open(branch.mapUrl, "_blank")}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-forest/5 text-forest rounded-xl text-sm font-semibold hover:bg-forest/10 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {language === "uz" ? "Xaritada ochish" : "Открыть на карте"}
              </button>
            </div>
          ))}

          <p className="text-xs text-medium-gray text-center">
            {language === "uz"
              ? "Istalgan filialga tashrif buyuring!"
              : "Ждём вас в любом из филиалов!"}
          </p>
        </div>
      </Modal>
    </div>
  );
}
