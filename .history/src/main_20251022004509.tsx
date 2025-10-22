// src/main.tsx ou src/index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import {
  createHashRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import "./index.css";

const queryClient = new QueryClient();

/** 🔧 Normaliza a URL para HashRouter
 * - Se o user abriu /login (sem hash), convertemos para /#/login
 * - Se já tem hash, mas está com path extra, removemos o path extra.
 * Funciona em dev e em produção (GitHub Pages com base /repo/).
 */
(function normalizeForHashRouter() {
  // BASE_URL do Vite: "/" no dev, "/redes.wifi/" no build
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, ""); // "/" ou "/redes.wifi"
  const path = location.pathname.startsWith(base)
    ? location.pathname.slice(base.length) || "/"
    : location.pathname || "/";

  const search = location.search || ""; // preserva ?...
  const hasHashPath = /^#\/.*/.test(location.hash);

  // 1) Já tem hash *e* tem path extra (caso /login#/login) -> remove o path
  if (hasHashPath && path !== "/") {
    history.replaceState(null, "", `${base}/${location.hash}${search}`);
    return;
  }

  // 2) Não tem hash -> converte /algo -> /#/algo (preservando query)
  if (!hasHashPath) {
    const clean = path.startsWith("/") ? path : `/${path}`;
    history.replaceState(null, "", `${base}/#${clean}${search}`);
    return;
  }

  // 3) Hash existe mas vazio ("#" ou "# ") -> força "#/"
  if (location.hash === "#" || location.hash === "#/ " || location.hash === "# ") {
    history.replaceState(null, "", `${base}/#/${search}`);
  }
})();


function getUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Protege qualquer rota: exige login
function RequireAuth({ children }: { children: React.ReactElement }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Protege rota de admin: exige login + flag is_admin
function RequireAdmin({ children }: { children: React.ReactElement }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_admin) return <Navigate to="/" replace />;
  return children;
}

// Evita que usuário logado veja a página de login
function LoginOnly({ children }: { children: React.ReactElement }) {
  const user = getUser();
  if (user) return <Navigate to="/" replace />;
  return children;
}

// Agora usando createHashRouter (para GitHub Pages)
const router = createHashRouter([
  {
    path: "/",
    element: (
      <RequireAuth>
        <App />
      </RequireAuth>
    ),
  },
  {
    path: "/login",
    element: (
      <LoginOnly>
        <LoginPage />
      </LoginOnly>
    ),
  },
  {
    path: "/admin",
    element: (
      <RequireAdmin>
        <AdminPage />
      </RequireAdmin>
    ),
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
