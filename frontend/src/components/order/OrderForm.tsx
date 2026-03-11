import { useState } from "react";
import {
  MapPin,
  Phone,
  User,
  MessageSquare,
  Navigation,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useLanguageStore } from "@/store/languageStore";
import { Input } from "../ui/Input";
import toast from "react-hot-toast";

const STORAGE_KEY = "decormarket-last-order";

interface OrderFormData {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  comment: string;
}

interface OrderFormProps {
  initialData?: Partial<OrderFormData>;
  onSubmit: (data: OrderFormData) => void;
  isLoading?: boolean;
}

function getSavedFormData(): Partial<OrderFormData> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

export function OrderForm({
  initialData,
  onSubmit,
  isLoading,
}: OrderFormProps) {
  const { t, language } = useLanguageStore();

  const savedData = getSavedFormData();

  const [formData, setFormData] = useState<OrderFormData>({
    firstName: initialData?.firstName || savedData.firstName || "",
    lastName: initialData?.lastName || savedData.lastName || "",
    phone: initialData?.phone || savedData.phone || "",
    address: initialData?.address || savedData.address || "",
    latitude: undefined,
    longitude: undefined,
    comment: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof OrderFormData, string>>
  >({});
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationReceived, setLocationReceived] = useState(false);

  const [wasAutoFilled] = useState(() => {
    return !!(savedData.phone || savedData.address);
  });

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName =
        language === "uz" ? "Ism kiritilishi shart" : "Введите имя";
    }

    if (!formData.phone.trim()) {
      newErrors.phone =
        language === "uz"
          ? "Telefon raqam kiritilishi shart"
          : "Введите номер телефона";
    } else if (!/^\+?[0-9]{9,12}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone =
        language === "uz"
          ? "Noto'g'ri telefon raqam"
          : "Неверный номер телефона";
    }

    // ✅ FIX: адрес НЕ обязателен — убрана валидация
    // Геолокация тоже необязательна

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            address: formData.address,
          })
        );
      } catch {}

      onSubmit(formData);
    }
  };

  const updateField = <K extends keyof OrderFormData>(
    field: K,
    value: OrderFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error(
        language === "uz"
          ? "Geolokatsiya qo'llab-quvvatlanmaydi"
          : "Геолокация не поддерживается"
      );
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setLocationReceived(true);
        setIsGettingLocation(false);
        toast.success(
          language === "uz"
            ? "Joylashuv aniqlandi"
            : "Местоположение определено"
        );
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsGettingLocation(false);
        let message =
          language === "uz"
            ? "Joylashuvni aniqlab bo'lmadi"
            : "Не удалось определить местоположение";
        if (error.code === 1) {
          message =
            language === "uz"
              ? "Joylashuvga ruxsat berilmadi"
              : "Доступ к геолокации запрещён";
        }
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <form id="order-form" onSubmit={handleSubmit} className="space-y-5">
      {/* Подсказка автозаполнения */}
      {wasAutoFilled && (
        <div className="bg-sage/10 border border-sage/20 rounded-2xl px-4 py-3 text-sm text-forest flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {language === "uz"
            ? "Oldingi buyurtma ma'lumotlari avtomatik to'ldirildi"
            : "Данные заполнены из предыдущего заказа"}
        </div>
      )}

      {/* Name Row */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={language === "uz" ? "Ism" : "Имя"}
          value={formData.firstName}
          onChange={(e) => updateField("firstName", e.target.value)}
          error={errors.firstName}
          leftIcon={<User className="w-5 h-5" />}
          placeholder={language === "uz" ? "Ism" : "Имя"}
          disabled={isLoading}
        />
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1.5">
            {language === "uz" ? "Familiya" : "Фамилия"}
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            placeholder={language === "uz" ? "Familiya" : "Фамилия"}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-sand border-2 border-transparent rounded-xl font-sans text-[15px] text-charcoal placeholder:text-taupe outline-none transition-all duration-300 focus:bg-white focus:border-forest focus:shadow-focus disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Phone */}
      <Input
        label={t("checkout.phone")}
        type="tel"
        value={formData.phone}
        onChange={(e) => updateField("phone", e.target.value)}
        error={errors.phone}
        leftIcon={<Phone className="w-5 h-5" />}
        placeholder="+998 90 123 45 67"
        disabled={isLoading}
      />

      {/* Geolocation */}
      <div>
        <button
          type="button"
          onClick={handleGetLocation}
          disabled={isLoading || isGettingLocation}
          className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-sans font-semibold text-sm transition-all duration-300 disabled:opacity-50 ${
            locationReceived
              ? "bg-sage/15 text-forest border border-sage/30"
              : "bg-forest text-white hover:bg-emerald hover:shadow-button-green active:scale-[0.99]"
          }`}
        >
          {isGettingLocation ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {language === "uz" ? "Aniqlanmoqda..." : "Определяем..."}
            </>
          ) : locationReceived ? (
            <>
              <CheckCircle className="w-5 h-5" />
              {language === "uz"
                ? "Joylashuv aniqlandi ✓"
                : "Геолокация получена ✓"}
            </>
          ) : (
            <>
              <Navigation className="w-5 h-5" />
              {language === "uz"
                ? "📍 Joylashuvni yuborish"
                : "📍 Отправить геолокацию"}
            </>
          )}
        </button>
        {!locationReceived && (
          <p className="text-xs text-medium-gray mt-1.5 text-center">
            {language === "uz"
              ? "Yoki quyida manzilni kiriting"
              : "Или введите адрес ниже"}
          </p>
        )}
      </div>

      {/* ✅ FIX: Адрес — убраны тексты о доставке */}
      <div>
        <Input
          label={
            language === "uz"
              ? "Manzil (ixtiyoriy)"
              : "Адрес (необязательно)"
          }
          value={formData.address}
          onChange={(e) => updateField("address", e.target.value)}
          error={errors.address}
          leftIcon={<MapPin className="w-5 h-5" />}
          placeholder={
            language === "uz"
              ? "Manzilingizni kiriting"
              : "Введите ваш адрес"
          }
          disabled={isLoading}
        />
        {locationReceived && !formData.address && (
          <p className="text-xs text-sage mt-1 font-medium">
            {language === "uz"
              ? "✓ Joylashuv yuborildi, manzil kiritish shart emas"
              : "✓ Геолокация отправлена, адрес необязателен"}
          </p>
        )}
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-1.5">
          {t("checkout.comment")}
          <span className="text-taupe font-normal ml-1">
            ({language === "uz" ? "ixtiyoriy" : "необязательно"})
          </span>
        </label>
        <div className="relative">
          <MessageSquare className="absolute left-[18px] top-3.5 w-5 h-5 text-taupe" />
          <textarea
            value={formData.comment}
            onChange={(e) => updateField("comment", e.target.value)}
            rows={3}
            disabled={isLoading}
            className="w-full pl-12 pr-4 py-3 bg-sand border-2 border-transparent rounded-xl font-sans text-[15px] text-charcoal placeholder:text-taupe resize-none outline-none transition-all duration-300 focus:bg-white focus:border-forest focus:shadow-focus disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={
              language === "uz"
                ? "Qo'shimcha izoh (mo'ljal va h.k.)"
                : "Дополнительный комментарий (ориентир и т.д.)"
            }
          />
        </div>
      </div>
    </form>
  );
}