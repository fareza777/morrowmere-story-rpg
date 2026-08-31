import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export const isAndroidMode = (mode: string): boolean => mode.startsWith('android');

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(isAndroidMode(mode) ? [] : [VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/icons/app-icon.webp'],
      manifest: {
        name: 'MORROWMERE: A Sword & Sorcery Chronicle',
        short_name: 'MORROWMERE',
        description: 'An offline procedural sword and sorcery text adventure through a kingdom of black rain.',
        lang: 'en',
        theme_color: '#f3ead6',
        background_color: '#f3ead6',
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
        cacheId: 'morrowmere-1-1-bright',
        dontCacheBustURLsMatching: /assets\/index-[A-Za-z0-9_-]+\.(?:js|css)$/,
        globPatterns: ['**/*.{js,css,html,png,webp,ogg,m4a,mp3,json}'],
        globIgnores: [
          'assets/icons/app-icon.webp',
          'assets/icons/pwa-192.png',
          'assets/icons/pwa-512.png',
          'assets/chronicle1/**/*',
          'audio/chronicle1/**/*',
        ],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        runtimeCaching: [{
          urlPattern: /\/(?:assets|audio)\/chronicle1\//,
          handler: 'CacheFirst',
          options: {
            cacheName: 'morrowmere-chronicle1-media-v1',
            cacheableResponse: { statuses: [0, 200] },
            expiration: { maxEntries: 800, maxAgeSeconds: 31_536_000 },
          },
        }],
      },
    })]),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: './vitest.setup.ts',
    css: true,
    execArgv: ['--no-webstorage'],
  },
}));
