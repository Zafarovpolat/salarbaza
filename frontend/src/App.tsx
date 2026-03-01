import { useEffect } from "react";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import WebApp from "@twa-dev/sdk";
import { AppRouter } from "./router";

// ✅ НОВОЕ: обработка deep-link из startapp
function DeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const startParam = WebApp.initDataUnsafe?.start_param;
      if (!startParam) return;

      console.log("📎 Deep link param:", startParam);

      if (startParam.startsWith("category_")) {
        const slug = startParam.replace("category_", "");
        navigate(`/catalog/${slug}`, { replace: true });
      } else if (startParam.startsWith("product_")) {
        const slug = startParam.replace("product_", "");
        navigate(`/product/${encodeURIComponent(slug)}`, { replace: true });
      } else if (startParam.startsWith("promo_")) {
        const slug = startParam.replace("promo_", "");
        navigate(`/promotion/${slug}`, { replace: true });
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
