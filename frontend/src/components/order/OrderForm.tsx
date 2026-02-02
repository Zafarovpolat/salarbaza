import { useState } from 'react'
import { MapPin, Phone, User, MessageSquare, Navigation, Loader2, CheckCircle } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { Input } from '../ui/Input'
import toast from 'react-hot-toast'

interface OrderFormData {
    firstName: string
    lastName: string
    phone: string
    address: string
    latitude?: number
    longitude?: number
    comment: string
}

interface OrderFormProps {
    initialData?: Partial<OrderFormData>
    onSubmit: (data: OrderFormData) => void
    isLoading?: boolean
}

export function OrderForm({ initialData, onSubmit, isLoading }: OrderFormProps) {
    const { t, language } = useLanguageStore()

    const [formData, setFormData] = useState<OrderFormData>({
        firstName: initialData?.firstName || '',
        lastName: initialData?.lastName || '',
        phone: initialData?.phone || '',
        address: initialData?.address || '',
        latitude: undefined,
        longitude: undefined,
        comment: initialData?.comment || '',
    })

    const [errors, setErrors] = useState<Partial<Record<keyof OrderFormData, string>>>({})
    const [isGettingLocation, setIsGettingLocation] = useState(false)
    const [locationReceived, setLocationReceived] = useState(false)

    const validate = (): boolean => {
        const newErrors: typeof errors = {}

        if (!formData.firstName.trim()) {
            newErrors.firstName = language === 'uz' ? 'Ism kiritilishi shart' : 'Введите имя'
        }

        if (!formData.phone.trim()) {
            newErrors.phone = language === 'uz' ? 'Telefon raqam kiritilishi shart' : 'Введите номер телефона'
        } else if (!/^\+?[0-9]{9,12}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = language === 'uz' ? "Noto'g'ri telefon raqam" : 'Неверный номер телефона'
        }

        if (!formData.address.trim()) {
            newErrors.address = language === 'uz' ? 'Manzil kiritilishi shart' : 'Введите адрес'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validate()) {
            onSubmit(formData)
        }
    }

    const updateField = <K extends keyof OrderFormData>(
        field: K,
        value: OrderFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    // Получение геолокации через браузер
    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error(
                language === 'uz'
                    ? 'Geolokatsiya qo\'llab-quvvatlanmaydi'
                    : 'Геолокация не поддерживается'
            )
            return
        }

        setIsGettingLocation(true)

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                }))
                setLocationReceived(true)
                setIsGettingLocation(false)
                toast.success(
                    language === 'uz' ? 'Joylashuv aniqlandi' : 'Местоположение определено',
                    { icon: '📍' }
                )
            },
            (error) => {
                console.error('Geolocation error:', error)
                setIsGettingLocation(false)

                let message = language === 'uz'
                    ? 'Joylashuvni aniqlab bo\'lmadi'
                    : 'Не удалось определить местоположение'

                if (error.code === 1) {
                    message = language === 'uz'
                        ? 'Joylashuvga ruxsat berilmadi'
                        : 'Доступ к геолокации запрещён'
                }

                toast.error(message)
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    return (
        <form id="order-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-3">
                {/* First Name */}
                <Input
                    label={language === 'uz' ? 'Ism' : 'Имя'}
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    error={errors.firstName}
                    leftIcon={<User className="w-5 h-5" />}
                    placeholder={language === 'uz' ? 'Ism' : 'Имя'}
                    disabled={isLoading}
                />

                {/* Last Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {language === 'uz' ? 'Familiya' : 'Фамилия'}
                    </label>
                    <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                        placeholder={language === 'uz' ? 'Familiya' : 'Фамилия'}
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-gray-100 border border-transparent rounded-xl
                            text-gray-900 placeholder-gray-400
                            focus:outline-none focus:border-primary-500 focus:bg-white
                            disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all duration-200"
                    />
                </div>
            </div>

            {/* Phone */}
            <Input
                label={t('checkout.phone')}
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                error={errors.phone}
                leftIcon={<Phone className="w-5 h-5" />}
                placeholder="+998 90 123 45 67"
                disabled={isLoading}
            />

            {/* Address */}
            <Input
                label={t('checkout.address')}
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                error={errors.address}
                leftIcon={<MapPin className="w-5 h-5" />}
                placeholder={language === 'uz' ? 'Manzilingizni kiriting' : 'Введите адрес доставки'}
                disabled={isLoading}
            />

            {/* Geolocation Button */}
            <div>
                <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLoading || isGettingLocation}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${locationReceived
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-[0.99]'
                        } disabled:opacity-50`}
                >
                    {isGettingLocation ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {language === 'uz' ? 'Aniqlanmoqda...' : 'Определяем...'}
                        </>
                    ) : locationReceived ? (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            {language === 'uz' ? 'Joylashuv aniqlandi' : 'Местоположение определено'}
                        </>
                    ) : (
                        <>
                            <Navigation className="w-5 h-5" />
                            {language === 'uz' ? 'Joylashuvni yuborish' : 'Отправить местоположение'}
                        </>
                    )}
                </button>
                <p className="text-xs text-gray-500 mt-1.5 text-center">
                    {language === 'uz'
                        ? 'Tezroq yetkazib berish uchun joylashuvingizni yuboring'
                        : 'Отправьте геолокацию для быстрой доставки'}
                </p>
            </div>

            {/* Comment */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('checkout.comment')}
                    <span className="text-gray-400 font-normal ml-1">
                        ({language === 'uz' ? 'ixtiyoriy' : 'необязательно'})
                    </span>
                </label>
                <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                        value={formData.comment}
                        onChange={(e) => updateField('comment', e.target.value)}
                        rows={3}
                        disabled={isLoading}
                        className="w-full pl-11 pr-4 py-3 bg-gray-100 border border-transparent rounded-xl
                            text-gray-900 placeholder-gray-400 resize-none
                            focus:outline-none focus:border-primary-500 focus:bg-white
                            disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all duration-200"
                        placeholder={language === 'uz'
                            ? "Qo'shimcha izoh (eshik kodi, mo'ljal va h.k.)"
                            : 'Дополнительный комментарий (код двери, ориентир и т.д.)'}
                    />
                </div>
            </div>
        </form>
    )
}