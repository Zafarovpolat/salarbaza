// frontend/src/components/order/OrderForm.tsx
import { useState } from 'react'
import { MapPin, Phone, User, MessageSquare } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { Input } from '../ui/Input'

interface OrderFormData {
    name: string
    phone: string
    address: string
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
        name: initialData?.name || '',
        phone: initialData?.phone || '',
        address: initialData?.address || '',
        comment: initialData?.comment || '',
    })

    const [errors, setErrors] = useState<Partial<Record<keyof OrderFormData, string>>>({})

    const validate = (): boolean => {
        const newErrors: typeof errors = {}

        if (!formData.name.trim()) {
            newErrors.name = language === 'uz' ? 'Ism kiritilishi shart' : 'Введите имя'
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

    return (
        <form id="order-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <Input
                label={t('checkout.name')}
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                error={errors.name}
                leftIcon={<User className="w-5 h-5" />}
                placeholder={language === 'uz' ? 'Ismingizni kiriting' : 'Введите ваше имя'}
                disabled={isLoading}
            />

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