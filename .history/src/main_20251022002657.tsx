import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import "./index.css";

const queryClient = new QueryClient();

// --- Proteção de rota ---
function ProtectedAdmin() {
  const userRaw = localStorage.getItem("user");
  if (!userRaw) return <Navigate to="/login" replace />;
  const user = JSON.parse(userRaw);
  if (!user.is_admin) return <Navigate to="/" replace />;
  return <AdminPage />;
}

const router = createBrowserRouter([
  { path: "/", element: <App /> }, // mapa
  { path: "/login", element: <LoginPage /> },
  { path: "/admin", element: <ProtectedAdmin /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
