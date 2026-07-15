import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { sentryVitePlugin } from "@sentry/vite-plugin";

const hasSentryAuth = !!process.env.SENTRY_AUTH_TOKEN;
const sentryOrg = process.env.SENTRY_ORG || "dekorhouse";
const sentryProject = process.env.SENTRY_PROJECT_FRONTEND || "frontend";

export default defineConfig({
  plugins: [
    react(),
    ...(hasSentryAuth
      ? [
          sentryVitePlugin({
            org: sentryOrg,
            project: sentryProject,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            sourcemaps: {
              filesToDeleteAfterUpload: ["./dist/**/*.map"],
            },
          }),
        ]
      : []),
  ],
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
    sourcemap: hasSentryAuth ? "hidden" : false,
    minify: "esbuild",
    target: "es2020",
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@supabase")) {
            return "supabase-admin";
          }
          if (id.includes("react-dom") || id.includes("react/")) {
            return "react-core";
          }
          if (id.includes("react-router")) {
            return "router";
          }
          if (id.includes("framer-motion")) {
            return "motion";
          }
          if (id.includes("lucide-react")) {
            return "icons";
          }
          if (id.includes("zustand")) {
            return "state";
          }
          if (id.includes("axios")) {
            return "http";
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "zustand", "axios"],
  },
});
