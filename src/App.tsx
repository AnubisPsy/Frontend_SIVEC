// src/App.tsx
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import HistorialViajes from "./pages/HistorialViajes";
import Reportes from "./pages/Reportes";
import DetalleViaje from "./pages/DetalleViaje";
import AdminUsuarios from "./pages/AdminUsuarios";
import AdminPilotosTemporales from "./pages/AdminPilotosTemporales";
import Layout from "./components/Layout";

// ✅ Componente que maneja las rutas según autenticación
function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Ruta pública - Login */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />

      {/* Rutas protegidas */}
      {isAuthenticated ? (
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/historial" element={<HistorialViajes />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/viaje/:id" element={<DetalleViaje />} />
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
          <Route
            path="/admin/pilotos-temporales"
            element={<AdminPilotosTemporales />}
          />
        </Route>
      ) : null}

      {/* Redirección por defecto */}
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        }
      />

      <Route
        path="*"
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        }
      />
    </Routes>
  );
}

function App() {
  // Inyectar estilos personalizados para toast
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .Toastify__toast {
        font-family: inherit;
        border-radius: 12px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        padding: 16px;
        min-height: 64px;
      }
      
      .Toastify__toast--success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      }
      
      .Toastify__toast--error {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      }
      
      .Toastify__toast--warning {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      }
      
      .Toastify__toast--info {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      }
      
      .Toastify__progress-bar {
        height: 4px;
      }
      
      .Toastify__progress-bar--success,
      .Toastify__progress-bar--error,
      .Toastify__progress-bar--warning,
      .Toastify__progress-bar--info {
        background: rgba(255, 255, 255, 0.7);
      }
      
      .Toastify__close-button {
        opacity: 0.7;
        transition: opacity 0.2s;
      }
      
      .Toastify__close-button:hover {
        opacity: 1;
      }
      
      .dark .Toastify__toast {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
      }
      
      @keyframes toastSlideIn {
        from {
          transform: translate3d(110%, 0, 0);
          opacity: 0;
        }
        to {
          transform: translate3d(0, 0, 0);
          opacity: 1;
        }
      }
      
      @keyframes toastSlideOut {
        from {
          transform: translate3d(0, 0, 0);
          opacity: 1;
        }
        to {
          transform: translate3d(110%, 0, 0);
          opacity: 0;
        }
      }
      
      .Toastify__toast--top-right {
        animation: toastSlideIn 0.3s ease-out;
      }
      
      .Toastify__toast--top-right.Toastify__toast--closing {
        animation: toastSlideOut 0.3s ease-out;
      }
      
      @media only screen and (max-width: 480px) {
        .Toastify__toast-container {
          width: 100vw;
          padding: 0;
          left: 0;
          margin: 0;
          border-radius: 0;
        }
        
        .Toastify__toast {
          margin-bottom: 0;
          border-radius: 0;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />

          {/* Toast Container - Notificaciones elegantes */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
            aria-label="Notificaciones"
            style={{ zIndex: 99999 }}
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
