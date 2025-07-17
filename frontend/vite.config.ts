import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5050", // Port backend
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'react-vendor': ['react', 'react-dom'],
          
          // Router et navigation
          'router': ['react-router-dom'],
          
          // UI et animations
          'ui-motion': ['framer-motion'],
          'ui-icons': ['lucide-react', 'react-icons'],
          
          // Utilitaires et outils
          'utils': ['date-fns', 'axios'],
          
          // PDF et export
          'pdf': ['jspdf', 'jspdf-autotable'],
          
          // Lottie animations (volumineux)
          'lottie': ['lottie-react'],
          
          // Styled components et thème
          'styles': ['styled-components', 'react-helmet-async'],
          
          // Internationalisation
          'i18n': ['i18next', 'react-i18next'],
          
          // Compteurs et visualisations
          'charts': ['use-count-up']
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? 
            chunkInfo.facadeModuleId.split('/').pop().replace(/\.\w+$/, '') : 
            'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash].${ext}`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `fonts/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      },
    },
    chunkSizeWarningLimit: 800, // Réduire la limite pour encourager un meilleur splitting
  },
  define: {
    "process.env": {},
  },
});
