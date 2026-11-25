import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

/**
 * BASE_PATH:
 *  - Cloudflare Pages / Netlify / Vercel / custom domain  -> "/" (default)
 *  - GitHub Pages project site (user.github.io/krayechi)  -> "/krayechi/"
 */
function resolveBase(): string {
  let base = process.env.BASE_PATH || '/';
  if (!base.startsWith('/')) base = `/${base}`;
  if (!base.endsWith('/')) base = `${base}/`;
  return base;
}

export default defineConfig(() => {
  const base = resolveBase();

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifestFilename: 'manifest.json',
        includeAssets: [
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          id: base,
          name: 'کرایه‌چی',
          short_name: 'کرایه‌چی',
          description: 'پرداخت سریع کرایه تاکسی با اسکن کد QR و کارت‌به‌کارت',
          theme_color: '#0F172A',
          background_color: '#0F172A',
          display: 'standalone',
          orientation: 'portrait',
          dir: 'rtl',
          lang: 'fa',
          start_url: base,
          scope: base,
          icons: [
            {src: `${base}pwa-192x192.png`, sizes: '192x192', type: 'image/png', purpose: 'any'},
            {src: `${base}pwa-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'any'},
            {src: `${base}pwa-maskable-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable'},
            {src: `${base}icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any'},
          ],
        },
        workbox: {
          // fonts (woff2) are self-hosted, so the app works fully offline after first visit
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
          navigateFallback: `${base}index.html`,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
