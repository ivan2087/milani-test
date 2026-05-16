import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/graphql": {
        target: "https://nmilani.local",
        changeOrigin: true,
        secure: false,
      },

      "/wp-ajax": {
        target: "https://nmilani.local",
        changeOrigin: true,
        secure: false,
        rewrite: () => "/wp-admin/admin-ajax.php",
      },

      "/api/ip-location": {
        target: "https://ipwho.is",
        changeOrigin: true,
        secure: true,
        rewrite: () => "/",
      },
    },
  },

  build: {
    target: "es2015",
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "@apollo/client",
            "graphql",
            "react-helmet-async",
            "dompurify",
          ],
          swiper: ["swiper"],
        },
      },
    },
  },
});