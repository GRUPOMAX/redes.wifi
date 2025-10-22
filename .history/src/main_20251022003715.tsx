// src/main.tsx ou src/index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import "./index.css";

const queryClient = new QueryClient();

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

const router = createBrowserRouter([
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
  // fallback: qualquer coisa vira home (que já está protegida)
  { path: "*", element: <Navigate to="/" replace /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
