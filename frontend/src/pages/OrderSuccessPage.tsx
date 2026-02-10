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
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-cream">
      <Container>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 0.1 }}
            className="
              w-24 h-24
              bg-gradient-to-br from-forest to-sage
              rounded-[28px]
              flex items-center justify-center
              mx-auto mb-6
            "
          >
            <CheckCircle className="w-12 h-12 text-white" strokeWidth={1.5} />
          </motion.div>

          <h1 className="font-display text-2xl font-medium text-charcoal mb-2">
            {language === 'uz' ? 'Buyurtma qabul qilindi!' : 'Заказ принят!'}
          </h1>

          <p className="text-medium-gray mb-8">
            {language === 'uz' ? 'Buyurtma raqami' : 'Номер заказа'}:{' '}
            <span className="font-semibold text-charcoal">#{orderId?.slice(-8).toUpperCase()}</span>
          </p>

          {/* Info box */}
          <div className="bg-ivory rounded-2xl p-5 mb-8 text-left border border-stone/30">
            <p className="text-dark-gray text-sm leading-relaxed">
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
              variant="green"
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