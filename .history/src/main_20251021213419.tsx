import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import AdminPage from './pages/AdminPage';
import './index.css';

// Cria o cliente do React Query (cache e fetch automáticos)
const queryClient = new QueryClient();

// Define as rotas da aplicação
const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/admin', element: <AdminPage /> },
]);

// Renderização principal
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
