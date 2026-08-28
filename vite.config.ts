import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // CRITICAL for Capacitor Android: use relative paths so assets load inside the WebView APK
  base: './',
  server: {
    port: 3000,
    host: true
  },
  build: {
    // Ensure assets are properly bundled for Capacitor
    assetsDir: 'assets',
    sourcemap: false,
  }
});
