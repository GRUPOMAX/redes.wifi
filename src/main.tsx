// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import './index.css';

const queryClient = new QueryClient();

// --- Normalização da URL para HashRouter (mantém igual ao teu) ---
(function normalizeForHashRouter() {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const path = location.pathname.startsWith(base)
    ? location.pathname.slice(base.length) || '/'
    : location.pathname || '/';
  const search = location.search || '';
  const hasHashPath = /^#\/.*/.test(location.hash);

  if (hasHashPath && path !== '/') {
    history.replaceState(null, '', `${base}/${location.hash}${search}`);
    return;
  }
  if (!hasHashPath) {
    const clean = path.startsWith('/') ? path : `/${path}`;
    history.replaceState(null, '', `${base}/#${clean}${search}`);
    return;
  }
  if (location.hash === '#' || location.hash === '#/ ' || location.hash === '# ') {
    history.replaceState(null, '', `${base}/#/${search}`);
  }
})();

// --- Leitura segura do usuário ---
function getUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// --- Componentes de proteção ---
function RequireAuth({ children }: { children: React.ReactElement }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }: { children: React.ReactElement }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;

  // Se o usuário não for admin, exibe aviso
  if (!user.is_admin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center bg-gray-100 text-gray-800">
        <h1 className="text-2xl font-semibold mb-2">Acesso negado</h1>
        <p className="text-sm text-gray-600">
          Sua conta não possui permissão para acessar esta página.
        </p>
        <button
          onClick={() => (window.location.hash = '/')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Voltar à página inicial
        </button>
      </div>
    );
  }

  return children;
}

function LoginOnly({ children }: { children: React.ReactElement }) {
  const user = getUser();
  if (user) return <Navigate to="/" replace />;
  return children;
}

// --- Rotas ---
const router = createHashRouter([
  {
    path: '/',
    element: (
      <RequireAuth>
        <App />
      </RequireAuth>
    ),
  },
  {
    path: '/login',
    element: (
      <LoginOnly>
        <LoginPage />
      </LoginOnly>
    ),
  },
  {
    path: '/admin',
    element: (
      <RequireAdmin>
        <AdminPage />
      </RequireAdmin>
    ),
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
