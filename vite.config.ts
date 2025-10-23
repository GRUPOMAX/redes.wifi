// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'; // ou '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'; // só use se estiver no Tailwind v4+
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Variáveis do .env (no build o Vite injeta como import.meta.env)
  const env = loadEnv(mode, process.cwd(), '');

  const nocodbUrl = env.VITE_NOCODB_URL || '';
  const nocodbToken = env.VITE_NOCODB_TOKEN || '';

  // Em produção (build/deploy), GitHub Pages precisa do base com o nome do repo
  const isProd = mode === 'production';
  const repoBase = '/redes.wifi/';
  const base = isProd ? repoBase : '/';

  // start_url para funcionar com HashRouter no GH Pages
  const startUrl = `${repoBase}#/`;

  return {
    plugins: [
      react(),
      tailwindcss(), // remova esta linha se NÃO estiver no Tailwind v4

      // 🔌 PWA – deixa o app instalável e offline
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        // habilita no dev pra testar instalação/offline
        devOptions: { enabled: true },

        manifest: {
            name: 'Redes Wi-Fi',
            short_name: 'Wi-Fi',
            description: 'Mapa e painel de redes Wi-Fi',
            start_url: '/redes.wifi/#/',     // ✅ correto para HashRouter no GH Pages
            scope: '/redes.wifi/',           // ✅ escopo no Pages
            display: 'standalone',
            background_color: '#0B1020',
            theme_color: '#0EA5E9',
            icons: [
              { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
              { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
              { src: 'icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable any' },
              { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable any' },
            ],
          },

        workbox: {
          // fallback pra SPA em produção (em dev o Vite serve index.html)
          navigateFallback: `${repoBase}index.html`,
          runtimeCaching: [
            // ✅ NocoDB: Stale-While-Revalidate
            {
              urlPattern: ({ url }) => url.origin.includes('nocodb.nexusnerds.com.br'),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'api-nocodb',
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            // ✅ Tiles do OpenStreetMap
            {
              urlPattern: /^https:\/\/(?:[abc]\.)?tile\.openstreetmap\.org\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'osm-tiles',
                expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 14 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            // ✅ Assets estáticos do próprio app
            {
              urlPattern: ({ request, sameOrigin }) =>
                sameOrigin &&
                ['style', 'script', 'worker', 'image', 'font'].includes(request.destination),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'app-static',
                expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
    ],

    // 👇 ESSENCIAL pro GitHub Pages
    base,

    server: {
      hmr: { overlay: true },
      strictPort: false,

      // Proxy só vale no DEV. No build (Pages) suas chamadas devem ir direto ao VITE_NOCODB_URL.
      proxy: {
        '/api-noco': {
          target: nocodbUrl,
          changeOrigin: true,
          secure: /^https:\/\//i.test(nocodbUrl),
          rewrite: (p) => p.replace(/^\/api-noco/, '/api/v2'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (nocodbToken) proxyReq.setHeader('xc-token', nocodbToken);
            });
          },
        },
      },
    },

    // build com sourcemap ajuda a debugar se algo quebrar no Pages
    build: {
      sourcemap: true,
      outDir: 'dist',
      emptyOutDir: true,
    },

    // garante resolução moderna pra TSX/JSX
    esbuild: { jsx: 'automatic' },
  };
});
