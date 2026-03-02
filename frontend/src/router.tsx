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

// ✅ Получаем startapp параметр из разных источников
function getStartParam(): string | null {
  try {
    // Способ 1: Telegram SDK
    const fromSdk = WebApp.initDataUnsafe?.start_param;
    if (fromSdk) return fromSdk;

    // Способ 2: URL параметр tgWebAppStartParam
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get("tgWebAppStartParam");
    if (fromUrl) return fromUrl;

    // Способ 3: hash параметр
    const hashParams = new URLSearchParams(
      window.location.hash.replace("#", "?"),
    );
    const fromHash = hashParams.get("tgWebAppStartParam");
    if (fromHash) return fromHash;
  } catch (e) {
    console.log("getStartParam error:", e);
  }
  return null;
}

function MainRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const deepLinkHandled = useRef(false);

  useEffect(() => {
    // Только один раз, только на главной
    if (deepLinkHandled.current) return;
    if (location.pathname !== "/") return;

    const startParam = getStartParam();
    if (!startParam) return;

    deepLinkHandled.current = true;
    console.log("📎 Deep link param:", startParam);

    let targetPath = "";

    if (startParam.startsWith("category_")) {
      const slug = startParam.replace("category_", "");
      targetPath = `/catalog/${slug}`;
    } else if (startParam.startsWith("product_")) {
      const slug = startParam.replace("product_", "");
      targetPath = `/product/${encodeURIComponent(slug)}`;
    } else if (startParam.startsWith("promo_")) {
      const slug = startParam.replace("promo_", "");
      targetPath = `/promotion/${slug}`;
    }

    if (targetPath) {
      // Задержка чтобы роутер полностью инициализировался
      requestAnimationFrame(() => {
        navigate(targetPath);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    </Routes>
  );
}

export function AppRouter() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  if (isAdminRoute) return <AdminRoutes />;
  return <MainRoutes />;
}
