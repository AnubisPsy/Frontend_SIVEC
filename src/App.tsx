import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DetalleViaje from "./pages/DetalleViaje";
import Layout from "./components/Layout";
import AdminUsuarios from "./pages/AdminUsuarios";
import AdminPilotosTemporales from "./pages/AdminPilotosTemporales";
import HistorialViajes from "./pages/HistorialViajes";
import Reportes from "./pages/Reportes";

// Componente para proteger rutas
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Ruta pública - Login */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="viaje/:id" element={<DetalleViaje />} />
            <Route path="/historial" element={<HistorialViajes />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="admin/usuarios" element={<AdminUsuarios />} />
            <Route
              path="admin/pilotos-temporales"
              element={<AdminPilotosTemporales />}
            />
          </Route>

          {/* Redirigir cualquier ruta no encontrada */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
