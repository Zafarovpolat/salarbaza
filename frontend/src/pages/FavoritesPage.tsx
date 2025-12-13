// frontend/src/pages/FavoritesPage.tsx
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useLanguageStore } from '@/store/languageStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { Container } from '@/components/layout/Container'
import { ProductGrid } from '@/components/product/ProductGrid'
import { EmptyState } from '@/components/ui/EmptyState'

export function FavoritesPage() {
    const navigate = useNavigate()
    const { language } = useLanguageStore()
    const { favorites } = useFavoritesStore()

    if (favorites.length === 0) {
        return (
            <EmptyState
                icon={Heart}
                title={language === 'uz' ? 'Sevimlilar bo\'sh' : 'Избранное пусто'}
                description={language === 'uz'
                    ? 'Mahsulotlarni ❤️ bosib saqlang'
                    : 'Сохраняйте товары нажатием ❤️'}
                action={{
                    label: language === 'uz' ? 'Katalogga o\'tish' : 'Перейти в каталог',
                    onClick: () => navigate('/catalog'),
                }}
            />
        )
    }

    return (
        <div className="pb-20">
            <Container className="py-4">
                <h1 className="text-lg font-semibold text-gray-900 mb-4">
                    {language === 'uz' ? 'Sevimlilar' : 'Избранное'}
                    <span className="text-gray-400 font-normal ml-2">({favorites.length})</span>
                </h1>
                <ProductGrid products={favorites} />
            </Container>
        </div>
    )
}