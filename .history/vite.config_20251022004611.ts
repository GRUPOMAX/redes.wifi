// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'; // ou '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'; // só use se estiver no Tailwind v4+

export default defineConfig(({ mode }) => {
  // Variáveis do .env (no build o Vite injeta como import.meta.env)
  const env = loadEnv(mode, process.cwd(), '');

  const nocodbUrl = env.VITE_NOCODB_URL || '';
  const nocodbToken = env.VITE_NOCODB_TOKEN || '';

  // Em produção (build/deploy), GitHub Pages precisa do base com o nome do repo
  const isProd = mode === 'production';
  const repoBase = '/redes.wifi/';

  return {
    plugins: [
      react(),
      tailwindcss(), // remova esta linha se NÃO estiver no Tailwind v4
    ],

    // 👇 ESSENCIAL pro GitHub Pages
    base: isProd ? repoBase : '/',

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
