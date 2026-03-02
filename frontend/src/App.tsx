import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import WebApp from "@twa-dev/sdk";
import { AppRouter } from "./router";

function App() {
  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();
      WebApp.setHeaderColor("#1B4332");
      WebApp.setBackgroundColor("#FFFCF5");
    } catch (e) {
      console.log("Not in Telegram environment");
    }
  }, []);

  return (
    <BrowserRouter>
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
