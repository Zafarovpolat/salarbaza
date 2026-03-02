import { useEffect, useRef } from "react";
import { BrowserRouter, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import WebApp from "@twa-dev/sdk";
import { AppRouter } from "./router";

function DeepLinkHandler() {
  const navigate = useNavigate();
  // ✅ FIX: флаг — обработать deep link ТОЛЬКО ОДИН РАЗ
  const handled = useRef(false);

  useEffect(() => {
    // Если уже обработали — больше не трогаем
    if (handled.current) return;

    try {
      const startParam = WebApp.initDataUnsafe?.start_param;
      if (!startParam) return;

      // Помечаем как обработанный
      handled.current = true;

      console.log("📎 Deep link param:", startParam);

      if (startParam.startsWith("category_")) {
        const slug = startParam.replace("category_", "");
        // ✅ push (не replace) — чтобы «назад» вёл на главную
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
  }, [navigate]);

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
