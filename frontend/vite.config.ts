import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/",
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    target: "es2020",
    // ✅ FIX: оптимизация CSS
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // ✅ FIX: разбиваем на более мелкие чанки
          "react-core": ["react", "react-dom"],
          router: ["react-router-dom"],
          motion: ["framer-motion"],
          icons: ["lucide-react"],
          state: ["zustand"],
          http: ["axios"],
        },
      },
    },
    // ✅ FIX: предупреждение при большом чанке
    chunkSizeWarningLimit: 500,
  },
  // ✅ FIX: оптимизация dev-сервера
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "zustand",
      "axios",
      "framer-motion",
    ],
  },
});