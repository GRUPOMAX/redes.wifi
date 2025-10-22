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
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

function ProtectedAdmin() {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_admin) return <Navigate to="/" replace />;
  return <AdminPage />;
}

const router = createBrowserRouter([
  { path: "/", element: <App /> },            // mapa normal
  { path: "/login", element: <LoginPage /> }, // tela de login
  { path: "/admin", element: <ProtectedAdmin /> }, // só entra se for admin
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
