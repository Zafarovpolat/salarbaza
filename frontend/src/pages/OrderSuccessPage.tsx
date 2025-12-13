import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Home, FileText } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { useTelegram } from '@/hooks/useTelegram'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'

export function OrderSuccessPage() {
    const { orderId } = useParams<{ orderId: string }>()
    const navigate = useNavigate()
    const { language } = useLanguageStore()
    const { haptic } = useTelegram()

    useEffect(() => {
        haptic.notification('success')
    }, [haptic])

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Container>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    {/* Success Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                        <CheckCircle className="w-12 h-12 text-green-500" />
                    </motion.div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {language === 'uz'
                            ? 'Buyurtma qabul qilindi!'
                            : 'Заказ принят!'}
                    </h1>

                    {/* Order Number */}
                    <p className="text-gray-500 mb-8">
                        {language === 'uz' ? 'Buyurtma raqami' : 'Номер заказа'}:{' '}
                        <span className="font-medium text-gray-900">#{orderId?.slice(-8).toUpperCase()}</span>
                    </p>

                    {/* Info */}
                    <div className="bg-gray-50 rounded-2xl p-4 mb-8 text-left">
                        <p className="text-gray-600 text-sm">
                            {language === 'uz'
                                ? "Tez orada operatorimiz siz bilan bog'lanadi va buyurtmani tasdiqlaydi."
                                : 'В ближайшее время наш оператор свяжется с вами для подтверждения заказа.'}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Button
                            onClick={() => navigate('/orders')}
                            variant="outline"
                            fullWidth
                            leftIcon={<FileText className="w-5 h-5" />}
                        >
                            {language === 'uz' ? 'Buyurtmalarim' : 'Мои заказы'}
                        </Button>

                        <Button
                            onClick={() => navigate('/')}
                            fullWidth
                            leftIcon={<Home className="w-5 h-5" />}
                        >
                            {language === 'uz' ? 'Bosh sahifaga' : 'На главную'}
                        </Button>
                    </div>
                </motion.div>
            </Container>
        </div>
    )
}