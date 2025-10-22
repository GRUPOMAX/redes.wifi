// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'; // ou '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'; // só use se estiver no Tailwind v4+

export default defineConfig(({ mode }) => {
  // carrega variáveis do .env (Vite usa import.meta.env; em config use loadEnv)
  const env = loadEnv(mode, process.cwd(), '');

  const nocodbUrl = env.VITE_NOCODB_URL;
  const nocodbToken = env.VITE_NOCODB_TOKEN;

  return {
    plugins: [
      react(),
      tailwindcss(), // remova esta linha se NÃO estiver no Tailwind v4
    ],
    server: {
      // ajuda a depurar refresh/hmr no navegador
      hmr: { overlay: true },
      strictPort: false,
      proxy: {
        '/api-noco': {
          target: nocodbUrl,
          changeOrigin: true,
          // usa https só se a URL for https
          secure: /^https:\/\//i.test(nocodbUrl || ''),
          rewrite: (p) => p.replace(/^\/api-noco/, '/api/v2'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (nocodbToken) proxyReq.setHeader('xc-token', nocodbToken);
            });
          },
        },
      },
    },
    // garante resolução moderna pra TSX/JSX
    esbuild: { jsx: 'automatic' },
  };
});
