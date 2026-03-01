import { useEffect } from "react";
import { BrowserRouter, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import WebApp from "@twa-dev/sdk";
import { AppRouter } from "./router";

function DeepLinkHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      const startParam = WebApp.initDataUnsafe?.start_param;
      if (!startParam) return;

      // ✅ Только если мы на главной (не обрабатывать повторно)
      if (location.pathname !== "/") return;

      console.log("📎 Deep link param:", startParam);

      if (startParam.startsWith("category_")) {
        const slug = startParam.replace("category_", "");
        // ✅ FIX: сначала главная в истории, потом категория
        // Так кнопка «назад» вернёт на главную
        navigate(`/catalog/${slug}`);
      } else if (startParam.startsWith("product_")) {
        const slug = startParam.replace("product_", "");
        navigate(`/product/${encodeURIComponent(slug)}`);
      } else if (startParam.startsWith("promo_")) {
        const slug = startParam.replace("promo_", "");
        navigate(`/promotion/${slug}`);
      }
    } catch (e) {
      console.log("Deep link handling error:", e);
    }
  }, [navigate, location.pathname]);

  return null;
}

function App() {
  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();
      WebApp.setHeaderColor("#1B4332");
      WebApp.setBackgroundColor("#FFFCF5");

      if (typeof (WebApp as any).disableVerticalSwipes === "function") {
        (WebApp as any).disableVerticalSwipes();
      }

      if (typeof WebApp.enableClosingConfirmation === "function") {
        WebApp.enableClosingConfirmation();
      }
    } catch (e) {
      console.log("Not in Telegram environment");
    }
  }, []);

  return (
    <BrowserRouter>
      <DeepLinkHandler />
      <AppRouter />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#333",
            color: "#fff",
            borderRadius: "12px",
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
