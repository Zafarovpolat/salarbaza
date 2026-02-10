import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Search } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { language } = useLanguageStore()

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-cream">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="font-display text-[120px] font-semibold text-stone leading-none mb-4"
          >
            404
          </motion.div>

          <h1 className="font-display text-2xl font-medium text-charcoal mb-2">
            {language === 'uz' ? 'Sahifa topilmadi' : 'Страница не найдена'}
          </h1>

          <p className="text-medium-gray mb-8 max-w-xs mx-auto">
            {language === 'uz'
              ? 'Kechirasiz, siz qidirgan sahifa mavjud emas'
              : 'Извините, запрашиваемая страница не существует'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="green"
              onClick={() => navigate('/')}
              leftIcon={<Home className="w-5 h-5" />}
            >
              {language === 'uz' ? 'Bosh sahifa' : 'На главную'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/search')}
              leftIcon={<Search className="w-5 h-5" />}
            >
              {language === 'uz' ? 'Qidirish' : 'Поиск'}
            </Button>
          </div>
        </motion.div>
      </Container>
    </div>
  )
}