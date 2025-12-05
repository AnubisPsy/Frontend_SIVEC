import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { Icons } from "../components/icons/IconMap";
import { useConfirm } from "../hooks/useConfirm";
import { ConfirmDialog } from "../hooks/ConfirmDialog";
import SelectorSucursal from "./SelectorSucursal";
import sivecLogoSvg from "../assets/logos/sivec-logo.svg";
import sivecIconOnly from "../assets/logos/sivec-icon-only.png";
import {
  Home,
  Clock,
  BarChart3,
  Map,
  Activity,
  Users,
  UserPlus,
  Truck,
  User,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Calendar,
} from "lucide-react";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const { confirm, isOpen, options, handleConfirm, handleCancel } =
    useConfirm();

  const usuario = user;

  // Actualizar fecha y hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Formatear fecha y hora
  const formatDateTime = () => {
    const dias = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const dia = dias[currentDateTime.getDay()];
    const numeroDia = currentDateTime.getDate().toString().padStart(2, "0");
    const mes = meses[currentDateTime.getMonth()];

    let horas = currentDateTime.getHours();
    const minutos = currentDateTime.getMinutes().toString().padStart(2, "0");
    const ampm = horas >= 12 ? "PM" : "AM";
    horas = horas % 12 || 12;

    return {
      fecha: `${dia}, ${numeroDia} de ${mes}`,
      hora: `${horas}:${minutos} ${ampm}`,
    };
  };

  const { fecha, hora } = formatDateTime();

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

  // Configuración del menú del sidebar
  const menuSections = [
    {
      title: null,
      items: [
        { icon: Home, label: "Inicio", path: "/home", roles: [1, 2, 3] },
        {
          icon: Clock,
          label: "Historial (24h)",
          path: "/historial",
          roles: [2, 3],
        },
        {
          icon: BarChart3,
          label: "Dashboard Analytics",
          path: "/dashboard",
          roles: [2, 3],
        },
        { icon: Map, label: "Mapa en Vivo", path: "/mapa-vivo", roles: [2, 3] },
        {
          icon: Activity,
          label: "Reportes Avanzados",
          path: "/reportes",
          roles: [2, 3],
        },
      ],
    },
    {
      title: "Administración",
      items: [
        {
          icon: Users,
          label: "Administrar Usuarios",
          path: "/admin/usuarios",
          roles: [3],
        },
        {
          icon: UserPlus,
          label: "Pilotos Temporales",
          path: "/admin/pilotos-temporales",
          roles: [3],
        },
        {
          icon: Truck,
          label: "Administrar Vehículos",
          path: "/admin/vehiculos",
          roles: [3],
        },
        { icon: User, label: "Mi Perfil", path: "/perfil", roles: [1, 2, 3] },
      ],
    },
    {
      title: "Soporte",
      items: [
        {
          icon: HelpCircle,
          label: "Ayuda y Soporte",
          path: "/ayuda",
          roles: [1, 2, 3],
        },
      ],
    },
  ];

  // Filtrar según rol
  const filteredSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.roles.includes(usuario?.rol_id || 0)
      ),
    }))
    .filter((section) => section.items.length > 0);

  const isActive = (path: string) => {
    if (path === "/home") return location.pathname === "/home";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Navbar (sin dropdown de usuario) */}
      <nav className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 fixed top-0 left-0 right-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button
              onClick={() => navigate("/home")}
              className="flex items-center hover:opacity-80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 rounded-lg p-1"
            >
              <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center mr-3 shadow-sm border border-gray-100 dark:border-slate-600 transition-colors">
                <img
                  src={sivecIconOnly}
                  alt="SIVEC"
                  className="w-7 h-7 object-contain"
                />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                  SIVEC
                </h1>
                <p className="text-xs text-gray-600 dark:text-slate-400">
                  Sistema de Control de Vehículos
                </p>
              </div>
            </button>

            {/* Right side: Selector Sucursal + Theme toggle */}
            <div className="flex items-center gap-3">
              <SelectorSucursal />

              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Icons.sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Icons.moon className="w-5 h-5 text-gray-700" />
                )}
              </button>

              {/* Botón hamburger para mobile */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2.5 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 w-72
          bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-800 dark:to-slate-900
          border-r border-gray-200 dark:border-slate-700/50
          transition-transform duration-300 ease-in-out
          z-20
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
        style={{ height: "calc(100vh - 4rem)" }}
      >
        {/* Container flex para dividir el espacio */}
        <div className="flex flex-col h-full">
          {/* User info header - Fixed */}
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <Icons.user className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {usuario?.nombre_usuario || "Usuario"}
                </p>
                <p className="text-xs text-gray-600 dark:text-slate-400">
                  {getRolNombre(usuario?.rol_id || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Menu items - Scrollable */}
          <div className="flex-1 overflow-y-auto sidebar-scroll">
            <nav className="p-4 space-y-2">
              {filteredSections.map((section, sectionIdx) => (
                <div key={sectionIdx}>
                  {section.title && (
                    <div className="px-3 pt-4 pb-2">
                      <p className="text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider">
                        {section.title}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    {section.items.map((item, itemIdx) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);

                      return (
                        <button
                          key={itemIdx}
                          onClick={() => {
                            navigate(item.path);
                            // Cerrar sidebar en mobile después de navegar
                            if (window.innerWidth < 1024) {
                              setSidebarOpen(false);
                            }
                          }}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                            transition-all duration-200 group
                            ${
                              active
                                ? "bg-blue-100 dark:bg-slate-700/50 text-blue-700 dark:text-white shadow-sm dark:shadow-slate-900/50"
                                : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/30 hover:text-gray-900 dark:hover:text-white"
                            }
                          `}
                        >
                          <Icon
                            size={20}
                            className={`
                              flex-shrink-0
                              transition-colors
                              ${
                                active
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-gray-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                              }
                            `}
                          />
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {sectionIdx < filteredSections.length - 1 && (
                    <div className="my-3 border-t border-gray-200 dark:border-slate-700/30" />
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Fecha y Hora - Fixed above logout */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-slate-700/50">
            <div className="flex items-start gap-2.5">
              <Calendar
                size={16}
                className="flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-tight truncate text-gray-900 dark:text-white">
                  {fecha}
                </p>
                <p className="text-xs mt-0.5 text-gray-600 dark:text-slate-300">
                  {hora}
                </p>
              </div>
            </div>
          </div>

          {/* Logout button - Fixed at bottom */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-900/50">
            <button
              onClick={cerrarSesion}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300 transition-all group"
            >
              <LogOut
                size={20}
                className="group-hover:translate-x-0.5 transition-transform flex-shrink-0"
              />
              <span className="text-sm font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          style={{ top: "4rem" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="pt-16 lg:ml-72">
        <Outlet />
      </main>

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
