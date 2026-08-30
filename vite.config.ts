import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/icons/app-icon.webp'],
      manifest: {
        name: 'MORROWMERE: A Sword & Sorcery Chronicle',
        short_name: 'MORROWMERE',
        description: 'An offline procedural sword and sorcery text adventure through a kingdom of black rain.',
        lang: 'en',
        theme_color: '#090a0a',
        background_color: '#090a0a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['games', 'entertainment'],
        icons: [
          { src: '/assets/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/assets/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/assets/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webp}'],
        globIgnores: ['assets/icons/app-icon.webp', 'assets/icons/pwa-192.png', 'assets/icons/pwa-512.png'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: './vitest.setup.ts',
    css: true,
    execArgv: ['--no-webstorage'],
  },
});
