import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { app as apiApp } from './server/app';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-middleware',
      configureServer(server) {
        // Mount Express API directly into Vite dev server
        server.middlewares.use(apiApp);
      },
    },
  ],
  // CRITICAL for Capacitor Android: use relative paths so assets load inside the WebView APK
  base: './',
  server: {
    port: 3000,
    host: true,
  },
  build: {
    // Ensure assets are properly bundled for Capacitor
    assetsDir: 'assets',
    sourcemap: false,
  },
});
