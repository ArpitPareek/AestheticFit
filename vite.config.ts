import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          // GET reads: NetworkFirst so fresh data wins when online; cached
          // fallback keeps the app usable offline.
          {
            urlPattern: ({ url, request }) =>
              request.method === 'GET' &&
              url.href.startsWith('https://ahsdpbjdqxeacnjfljio.supabase.co/rest/v1/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              networkTimeoutSeconds: 3,
            },
          },
          // Mutations (POST/PATCH/DELETE) MUST never be served from cache — a
          // cached response would fake a successful write. NetworkOnly with
          // no offline fallback: writes fail loudly instead of silently.
          {
            urlPattern: ({ url, request }) =>
              request.method !== 'GET' &&
              url.href.startsWith('https://ahsdpbjdqxeacnjfljio.supabase.co/'),
            handler: 'NetworkOnly',
            method: 'POST',
          },
          {
            urlPattern: ({ url, request }) =>
              request.method !== 'GET' &&
              url.href.startsWith('https://ahsdpbjdqxeacnjfljio.supabase.co/'),
            handler: 'NetworkOnly',
            method: 'PATCH',
          },
          {
            urlPattern: ({ url, request }) =>
              request.method !== 'GET' &&
              url.href.startsWith('https://ahsdpbjdqxeacnjfljio.supabase.co/'),
            handler: 'NetworkOnly',
            method: 'DELETE',
          },
          {
            urlPattern: ({ url, request }) =>
              request.method !== 'GET' &&
              url.href.startsWith('https://ahsdpbjdqxeacnjfljio.supabase.co/'),
            handler: 'NetworkOnly',
            method: 'PUT',
          },
        ],
      },
      manifest: {
        name: 'AestheticFit',
        short_name: 'AeFit',
        description: 'Personal fitness, nutrition & skincare tracker',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['health', 'fitness', 'lifestyle'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
