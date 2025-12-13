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
        <div className="min-h-screen flex items-center justify-center p-4">
            <Container>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    {/* 404 */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 15 }}
                        className="text-8xl font-bold text-gray-200 mb-4"
                    >
                        404
                    </motion.div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {language === 'uz' ? 'Sahifa topilmadi' : 'Страница не найдена'}
                    </h1>

                    {/* Description */}
                    <p className="text-gray-500 mb-8">
                        {language === 'uz'
                            ? 'Kechirasiz, siz qidirgan sahifa mavjud emas'
                            : 'Извините, запрашиваемая страница не существует'}
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
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