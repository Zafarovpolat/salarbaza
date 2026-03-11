import { useEffect, useRef, lazy, Suspense } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import WebApp from "@twa-dev/sdk";

import { Layout } from "./components/layout/Layout";
import { LoadingScreen } from "./components/common/LoadingScreen";

// ✅ Главная грузится сразу (critical path)
import { HomePage } from "./pages/HomePage";

// ✅ Lazy — всё остальное грузится по требованию
const CatalogPage = lazy(() =>
  import("./pages/CatalogPage").then((m) => ({ default: m.CatalogPage }))
);
const CategoryPage = lazy(() =>
  import("./pages/CategoryPage").then((m) => ({ default: m.CategoryPage }))
);
const ProductPage = lazy(() =>
  import("./pages/ProductPage").then((m) => ({ default: m.ProductPage }))
);
const CartPage = lazy(() =>
  import("./pages/CartPage").then((m) => ({ default: m.CartPage }))
);
const CheckoutPage = lazy(() =>
  import("./pages/CheckoutPage").then((m) => ({ default: m.CheckoutPage }))
);
const OrderSuccessPage = lazy(() =>
  import("./pages/OrderSuccessPage").then((m) => ({
    default: m.OrderSuccessPage,
  }))
);
const OrdersPage = lazy(() =>
  import("./pages/OrdersPage").then((m) => ({ default: m.OrdersPage }))
);
const FavoritesPage = lazy(() =>
  import("./pages/FavoritesPage").then((m) => ({ default: m.FavoritesPage }))
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage }))
);
const SearchPage = lazy(() =>
  import("./pages/SearchPage").then((m) => ({ default: m.SearchPage }))
);
const PromotionPage = lazy(() =>
  import("./pages/PromotionPage").then((m) => ({ default: m.PromotionPage }))
);
const SpecialOffersPage = lazy(() =>
  import("./pages/SpecialOffersPage").then((m) => ({
    default: m.SpecialOffersPage,
  }))
);
const NewArrivalsPage = lazy(() =>
  import("./pages/NewArrivalsPage").then((m) => ({
    default: m.NewArrivalsPage,
  }))
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage }))
);

// Admin pages — все lazy
const AdminLoginPage = lazy(() =>
  import("./pages/admin/AdminLoginPage").then((m) => ({
    default: m.AdminLoginPage,
  }))
);
const AdminDashboardPage = lazy(() =>
  import("./pages/admin/AdminDashboardPage").then((m) => ({
    default: m.AdminDashboardPage,
  }))
);
const AdminProductsPage = lazy(() =>
  import("./pages/admin/AdminProductsPage").then((m) => ({
    default: m.AdminProductsPage,
  }))
);
const AdminProductEditPage = lazy(() =>
  import("./pages/admin/AdminProductEditPage").then((m) => ({
    default: m.AdminProductEditPage,
  }))
);
const AdminCategoriesPage = lazy(() =>
  import("./pages/admin/AdminCategoriesPage").then((m) => ({
    default: m.AdminCategoriesPage,
  }))
);
const AdminCategoryProductsPage = lazy(() =>
  import("./pages/admin/AdminCategoryProductsPage").then((m) => ({
    default: m.AdminCategoryProductsPage,
  }))
);
const AdminOrdersPage = lazy(() =>
  import("./pages/admin/AdminOrdersPage").then((m) => ({
    default: m.AdminOrdersPage,
  }))
);
const AdminWholesalePage = lazy(() =>
  import("./pages/admin/AdminWholesalePage").then((m) => ({
    default: m.AdminWholesalePage,
  }))
);
const AdminCustomersPage = lazy(() =>
  import("./pages/admin/AdminCustomersPage").then((m) => ({
    default: m.AdminCustomersPage,
  }))
);
const AdminCustomerDetailPage = lazy(() =>
  import("./pages/admin/AdminCustomerDetailPage").then((m) => ({
    default: m.AdminCustomerDetailPage,
  }))
);
const AdminPromotionsPage = lazy(() =>
  import("./pages/admin/AdminPromotionsPage").then((m) => ({
    default: m.AdminPromotionsPage,
  }))
);
const AdminPromotionEditPage = lazy(() =>
  import("./pages/admin/AdminPromotionEditPage").then((m) => ({
    default: m.AdminPromotionEditPage,
  }))
);
const AdminBulkTagsPage = lazy(() =>
  import("./pages/admin/AdminBulkTagsPage").then((m) => ({
    default: m.AdminBulkTagsPage,
  }))
);

// ✅ Легкий спиннер для lazy-страниц (не полноэкранный)
function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-forest rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function MainRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const deepLinkDone = useRef(false);

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
          "tgWebAppStartParam"
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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ✅ Главная — без lazy, грузится мгновенно */}
          <Route path="/" element={<HomePage />} />

          {/* Остальные — lazy */}
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/:slug" element={<CategoryPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/promotion/:slug" element={<PromotionPage />} />
          <Route path="/special-offers" element={<SpecialOffersPage />} />
          <Route path="/new-arrivals" element={<NewArrivalsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route
            path="/order-success/:orderId"
            element={<OrderSuccessPage />}
          />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

function AdminRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
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
    </Suspense>
  );
}

export function AppRouter() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  if (isAdminRoute) return <AdminRoutes />;
  return <MainRoutes />;
}