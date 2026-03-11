import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import WebApp from "@twa-dev/sdk";
import { AppRouter } from "./router";
import { API_URL } from "@/utils/constants";

// ✅ FIX: preconnect к API — ускоряет первый запрос на ~100-300ms
function addPreconnect() {
  try {
    const apiOrigin = new URL(API_URL).origin;

    if (!document.querySelector(`link[href="${apiOrigin}"]`)) {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = apiOrigin;
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);

      const dnsPrefetch = document.createElement("link");
      dnsPrefetch.rel = "dns-prefetch";
      dnsPrefetch.href = apiOrigin;
      document.head.appendChild(dnsPrefetch);
    }
  } catch {}
}

function App() {
  useEffect(() => {
    // ✅ Preconnect сразу
    addPreconnect();

    try {
      WebApp.ready();
      WebApp.expand();
      WebApp.setHeaderColor("#22c55e");
      WebApp.setBackgroundColor("#f9fafb");
    } catch (e) {
      // Not in Telegram environment
    }
  }, []);

  return (
    <BrowserRouter>
      <AppRouter />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: "#333",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "14px",
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;