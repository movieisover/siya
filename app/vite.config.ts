import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [react()],
  clearScreen: false,
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React 코어
          'react-vendor': ['react', 'react-dom'],
          // Supabase
          'supabase': ['@supabase/supabase-js'],
          // 모바일 컴포넌트 모음
          'mobile': [
            './src/components/mobile/MobileApp',
            './src/components/mobile/MobileHeader',
            './src/components/mobile/MobileTabBar',
            './src/components/mobile/MobileStockList',
            './src/components/mobile/MobileStockDetail',
            './src/components/mobile/MobileThemeView',
            './src/components/mobile/MobileScreenerView',
            './src/components/mobile/MobileWatchlistView',
            './src/components/mobile/MobileInstallGuide',
          ],
        },
      },
    },
  },
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
}));
