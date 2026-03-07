import { useEffect, useRef } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import WebApp from "@twa-dev/sdk";

import { Layout } from "./components/layout/Layout";

import { HomePage } from "./pages/HomePage";
import { CatalogPage } from "./pages/CatalogPage";
import { CategoryPage } from "./pages/CategoryPage";
import { ProductPage } from "./pages/ProductPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderSuccessPage } from "./pages/OrderSuccessPage";
import { OrdersPage } from "./pages/OrdersPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SearchPage } from "./pages/SearchPage";
import { PromotionPage } from "./pages/PromotionPage";
import { SpecialOffersPage } from "./pages/SpecialOffersPage";
import { NewArrivalsPage } from "./pages/NewArrivalsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage";
import { AdminProductEditPage } from "./pages/admin/AdminProductEditPage";
import { AdminCategoriesPage } from "./pages/admin/AdminCategoriesPage";
import { AdminCategoryProductsPage } from "./pages/admin/AdminCategoryProductsPage";
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage";
import { AdminWholesalePage } from "./pages/admin/AdminWholesalePage";
import { AdminCustomersPage } from "./pages/admin/AdminCustomersPage";
import { AdminCustomerDetailPage } from "./pages/admin/AdminCustomerDetailPage";
import { AdminPromotionsPage } from "./pages/admin/AdminPromotionsPage";
import { AdminPromotionEditPage } from "./pages/admin/AdminPromotionEditPage";
import { AdminBulkTagsPage } from './pages/admin/AdminBulkTagsPage'

function MainRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const deepLinkDone = useRef(false);

  // ✅ Deep link — один раз, только на главной
  useEffect(() => {
    if (deepLinkDone.current) return;
    if (location.pathname !== "/") return;

    let param: string | null = null;

    try {
      param = WebApp.initDataUnsafe?.start_param || null;
    } catch {}

    if (!param) {
      try {
        param = new URLSearchParams(window.location.search).get(
          "tgWebAppStartParam",
        );
      } catch {}
    }

    if (!param) return;

    deepLinkDone.current = true;

    if (param.startsWith("category_")) {
      navigate(`/catalog/${param.replace("category_", "")}`);
    } else if (param.startsWith("product_")) {
      navigate(`/product/${encodeURIComponent(param.replace("product_", ""))}`);
    } else if (param.startsWith("promo_")) {
      navigate(`/promotion/${param.replace("promo_", "")}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/catalog/:slug" element={<CategoryPage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/promotion/:slug" element={<PromotionPage />} />
        <Route path="/special-offers" element={<SpecialOffersPage />} />
        <Route path="/new-arrivals" element={<NewArrivalsPage />} />
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
  );
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
      <Route
        path="/admin/categories/:categoryId/products"
        element={<AdminCategoryProductsPage />}
      />
      <Route path="/admin/wholesale" element={<AdminWholesalePage />} />
      <Route path="/admin/orders" element={<AdminOrdersPage />} />
      <Route path="/admin/customers" element={<AdminCustomersPage />} />
      <Route
        path="/admin/customers/:id"
        element={<AdminCustomerDetailPage />}
      />
      <Route path="/admin/promotions" element={<AdminPromotionsPage />} />
      <Route
        path="/admin/promotions/new"
        element={<AdminPromotionEditPage />}
      />
      <Route
        path="/admin/promotions/:id"
        element={<AdminPromotionEditPage />}
      />
      <Route path="/admin/bulk-tags" element={<AdminBulkTagsPage />} />
    </Routes>
  );
}

export function AppRouter() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  if (isAdminRoute) return <AdminRoutes />;
  return <MainRoutes />;
}
