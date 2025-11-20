import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { Icons } from "../components/icons/IconMap";
import { useConfirm } from "../hooks/useConfirm";
import { ConfirmDialog } from "../hooks/ConfirmDialog";
import SelectorSucursal from "./SelectorSucursal";

interface Usuario {
  usuario_id: number;
  nombre_usuario: string;
  correo: string;
  rol_id: number;
}

const Layout = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const { confirm, isOpen, options, handleConfirm, handleCancel } =
    useConfirm();

  // ✅ USAR user del AuthContext directamente:
  const usuario = user;

  // ✅ AGREGAR ESTA FUNCIÓN:
  const cerrarSesion = async () => {
    const confirmed = await confirm({
      title: "¿Cerrar sesión?",
      message: "¿Estás seguro de que deseas cerrar sesión?",
      confirmText: "Sí, cerrar sesión",
      cancelText: "Cancelar",
      variant: "warning",
    });

    if (confirmed) {
      console.log("🚪 Layout: Cerrando sesión...");
      setMenuAbierto(false);
      logout();
    }
  };

  const getRolNombre = (rolId: number) => {
    switch (rolId) {
      case 1:
        return "Piloto";
      case 2:
        return "Jefe";
      case 3:
        return "Administrador";
      default:
        return "Usuario";
    }
  };

  const getRolBadgeColor = (rolId: number) => {
    switch (rolId) {
      case 1:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case 2:
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case 3:
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Navbar */}
      <nav className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y título */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                <Icons.truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                  SIVEC
                </h1>
                <p className="text-xs text-gray-600 dark:text-slate-400">
                  Sistema de Control de Vehículos
                </p>
              </div>
            </div>

            {/* Right side: Theme toggle + User menu */}
            <div className="flex items-center gap-3">
              {/* ✅ Selector de Sucursal (solo admins) */}
              <SelectorSucursal />

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                aria-label="Toggle theme"
                title={
                  isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
                }
              >
                {isDark ? (
                  <Icons.sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Icons.moon className="w-5 h-5 text-gray-700" />
                )}
              </button>

              {/* Menú de usuario */}
              <div className="relative">
                <button
                  onClick={() => setMenuAbierto(!menuAbierto)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                      {usuario?.nombre_usuario || "USUARIO"}
                    </p>
                    <p
                      className={`text-xs px-2 py-0.5 rounded-full inline-block ${getRolBadgeColor(
                        usuario?.rol_id || 0
                      )}`}
                    >
                      {usuario ? getRolNombre(usuario.rol_id) : ""}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Icons.user className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Icons.chevronDown
                    className={`w-5 h-5 text-gray-400 dark:text-slate-500 transition-transform ${
                      menuAbierto ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown menu */}
                {menuAbierto && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 py-2 z-50 animate-fadeIn">
                    {/* Info del usuario (móvil) */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 sm:hidden">
                      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                        {usuario?.nombre_usuario}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-slate-400">
                        {usuario?.correo}
                      </p>
                      <span
                        className={`inline-block text-xs px-2 py-1 rounded-full mt-2 ${getRolBadgeColor(
                          usuario?.rol_id || 0
                        )}`}
                      >
                        {usuario ? getRolNombre(usuario.rol_id) : ""}
                      </span>
                    </div>

                    {/* Opciones del menú */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setMenuAbierto(false);
                          navigate("/dashboard");
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                      >
                        <Icons.home className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                        <span className="font-medium">Dashboard</span>
                      </button>

                      {/* Historial (para Jefes y Admins) */}
                      {(usuario?.rol_id === 2 || usuario?.rol_id === 3) && (
                        <button
                          onClick={() => {
                            setMenuAbierto(false);
                            navigate("/historial");
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                        >
                          <Icons.clock className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                          <span className="font-medium">Historial (24h)</span>
                        </button>
                      )}

                      {/* Opciones solo para admins */}
                      {usuario?.rol_id === 3 && (
                        <>
                          <button
                            onClick={() => {
                              setMenuAbierto(false);
                              navigate("/reportes");
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                          >
                            <Icons.activity className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                            <span className="font-medium">
                              Reportes Avanzados
                            </span>
                          </button>

                          <div className="border-t border-gray-100 dark:border-slate-700 my-2"></div>

                          <button
                            onClick={() => {
                              setMenuAbierto(false);
                              navigate("/admin/usuarios");
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                          >
                            <Icons.user className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                            <span className="font-medium">
                              Administrar Usuarios
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              setMenuAbierto(false);
                              navigate("/admin/pilotos-temporales");
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                          >
                            <Icons.user className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                            <span className="font-medium">
                              Pilotos Temporales
                            </span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setMenuAbierto(false);
                          navigate("/perfil");
                          // Aquí irían más opciones
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                      >
                        <Icons.user className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                        <span className="font-medium">Mi Perfil</span>
                      </button>

                      <div className="border-t border-gray-100 dark:border-slate-700 my-2"></div>

                      <button
                        onClick={cerrarSesion}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                      >
                        <Icons.x className="w-5 h-5" />
                        <span className="font-medium">Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main>
        <Outlet />
      </main>

      {/* Overlay para cerrar el menú al hacer clic fuera */}
      {menuAbierto && (
        <div
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
          onClick={() => setMenuAbierto(false)}
        ></div>
      )}

      <ConfirmDialog
        isOpen={isOpen}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default Layout;
