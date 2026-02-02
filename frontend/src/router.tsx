// router.tsx - добавляем новый роут

import { Routes, Route, useLocation } from 'react-router-dom'

// Layout
import { Layout } from './components/layout/Layout'

// Main pages
import { HomePage } from './pages/HomePage'
import { CatalogPage } from './pages/CatalogPage'
import { CategoryPage } from './pages/CategoryPage'
import { ProductPage } from './pages/ProductPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrderSuccessPage } from './pages/OrderSuccessPage'
import { OrdersPage } from './pages/OrdersPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { ProfilePage } from './pages/ProfilePage'
import { SearchPage } from './pages/SearchPage'
import { NotFoundPage } from './pages/NotFoundPage'

// Admin pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminProductsPage } from './pages/admin/AdminProductsPage'
import { AdminProductEditPage } from './pages/admin/AdminProductEditPage'
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage'
import { AdminCategoryProductsPage } from './pages/admin/AdminCategoryProductsPage'
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage'

function MainRoutes() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/catalog/:slug" element={<CategoryPage />} />
                <Route path="/product/:slug" element={<ProductPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Layout>
    )
}

function AdminRoutes() {
    return (
        <Routes>
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/products/new" element={<AdminProductEditPage />} />
            <Route path="/admin/products/:id" element={<AdminProductEditPage />} />
            <Route path="/admin/categories" element={<AdminCategoriesPage />} />
            <Route path="/admin/categories/:categoryId/products" element={<AdminCategoryProductsPage />} /> {/* ✅ Новый роут */}
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
        </Routes>
    )
}

export function AppRouter() {
    const location = useLocation()
    const isAdminRoute = location.pathname.startsWith('/admin')

    if (isAdminRoute) {
        return <AdminRoutes />
    }

    return <MainRoutes />
}