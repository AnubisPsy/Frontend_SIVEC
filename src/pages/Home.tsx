import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useSocket } from "../contexts/SocketContext";
import { facturasApi } from "../services/api";
import FormularioAsignarFactura from "../components/FormularioAsignarFactura";
import { Button } from "../components/ui/Button";
import { Icons } from "../components/icons/IconMap";
import { chartColors } from "../styles/theme";
import { useNotification } from "../hooks/useNotification";
import TablaViajesDashboard from "../components/TablaViajesDashboard";

// Tipos
interface Vehiculo {
  placa: string;
  agrupacion: string;
}

interface Estados {
  codigo: string;
  nombre: string;
}

interface Guia {
  guia_id: number;
  numero_guia: string;
  detalle_producto: string;
  cliente: string;
  direccion: string;
  estado_id: number;
  fecha_entrega: string | null;
  estados: Estados;
}

interface Factura {
  factura_id: number;
  numero_factura: string;
  estado_id: number;
  notas_jefe: string | null;
  guias: Guia[];
}

interface Viaje {
  viaje_id: number;
  numero_vehiculo: string;
  piloto: string;
  created_at: string;
  vehiculo: Vehiculo;
  facturas: Factura[];
  total_guias: number;
  guias_entregadas: number;
  guias_no_entregadas: number; // ✅ NUEVO
  total_facturas: number;
  estado_viaje?: number;
}

const Home = () => {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const { socket, isConnected } = useSocket();
  const location = useLocation();
  const [vistaActual, setVistaActual] = useState<"cards" | "tabla">(() => {
    // Cargar preferencia guardada o usar 'cards' por defecto
    const vistaGuardada = localStorage.getItem("vista_dashboard");
    return vistaGuardada === "tabla" || vistaGuardada === "cards"
      ? vistaGuardada
      : "cards";
  });
  const cambiarVista = (nuevaVista: "cards" | "tabla") => {
    setVistaActual(nuevaVista);
    localStorage.setItem("vista_dashboard", nuevaVista);
  };
  const noti = useNotification();

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    cargarViajes();
  }, [isAuthenticated]);

  // ==========================================
  // 🔌 WEBSOCKET - ACTUALIZACIÓN EN TIEMPO REAL
  // ==========================================
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log("⚠️ Socket no conectado aún");
      return;
    }

    console.log("📡 Configurando listeners de WebSocket en Home...");

    // Evento: Guía actualizada (entregada/no entregada)
    const handleGuiaActualizada = (data: any) => {
      console.log("📦 Guía actualizada:", data);

      setViajes((prevViajes) =>
        prevViajes.map((viaje) => {
          // Buscar si este viaje contiene la guía actualizada
          const facturaConGuia = viaje.facturas?.find((f) =>
            f.guias?.some((g) => g.guia_id === data.guia_id),
          );

          if (!facturaConGuia) return viaje;

          // Actualizar el estado de la guía
          const facturasActualizadas = viaje.facturas.map((factura) => ({
            ...factura,
            guias: factura.guias.map((guia) =>
              guia.guia_id === data.guia_id
                ? {
                    ...guia,
                    estado_id: data.estado_id,
                    fecha_entrega: data.fecha_entrega || guia.fecha_entrega,
                  }
                : guia,
            ),
          }));

          // Recalcular guías entregadas y no entregadas
          const todasLasGuias = facturasActualizadas.flatMap((f) => f.guias);
          const nuevasGuiasEntregadas = todasLasGuias.filter(
            (g) => g.estado_id === 4,
          ).length;
          const nuevasGuiasNoEntregadas = todasLasGuias.filter(
            (g) => g.estado_id === 5,
          ).length;

          return {
            ...viaje,
            facturas: facturasActualizadas,
            guias_entregadas: nuevasGuiasEntregadas,
            guias_no_entregadas: nuevasGuiasNoEntregadas,
          };
        }),
      );
    };

    // Evento: Progreso del viaje actualizado
    const handleProgresoActualizado = (data: any) => {
      console.log("📊 Progreso actualizado:", data);

      setViajes((prevViajes) =>
        prevViajes.map((viaje) =>
          viaje.viaje_id === data.viaje_id
            ? {
                ...viaje,
                guias_entregadas: data.guias_entregadas,
                guias_no_entregadas: data.guias_no_entregadas || 0,
                total_guias: data.total_guias,
              }
            : viaje,
        ),
      );
    };

    // Evento: Viaje completado
    const handleViajeCompletado = (data: any) => {
      console.log("✅ Viaje completado:", data);

      setViajes((prevViajes) =>
        prevViajes.map((viaje) =>
          viaje.viaje_id === data.viaje_id
            ? {
                ...viaje,
                estado_viaje: 9, // Estado completado
                guias_entregadas: data.guias_entregadas,
                guias_no_entregadas: data.guias_no_entregadas || 0,
              }
            : viaje,
        ),
      );
    };

    // Evento: Estado del viaje actualizado
    const handleEstadoViajeActualizado = (data: any) => {
      console.log("🚛 Estado de viaje actualizado:", data);

      setViajes((prevViajes) =>
        prevViajes.map((viaje) =>
          viaje.viaje_id === data.viaje_id
            ? { ...viaje, estado_viaje: data.estado_viaje }
            : viaje,
        ),
      );
    };

    // Evento: Guía asignada a factura
    const handleGuiaAsignada = (data: any) => {
      console.log("🔗 Guía asignada a factura:", data);

      // Actualizar silenciosamente sin recargar toda la página
      setViajes((prevViajes) =>
        prevViajes.map((viaje) => {
          // Buscar si este viaje contiene la factura afectada
          const facturaAfectada = viaje.facturas?.find(
            (f) => f.numero_factura === data.numero_factura,
          );

          if (!facturaAfectada) return viaje;

          // Crear nueva guía con los datos recibidos
          const nuevaGuia: Guia = {
            guia_id: data.guia_id,
            numero_guia: data.numero_guia,
            detalle_producto: data.detalle_producto || "",
            cliente: data.cliente || "",
            direccion: data.direccion || "",
            estado_id: 3, // Asignada
            fecha_entrega: null,
            estados: {
              codigo: "guia_asignada",
              nombre: "Asignada",
            },
          };

          // Agregar la guía a la factura
          const facturasActualizadas = viaje.facturas.map((factura) =>
            factura.numero_factura === data.numero_factura
              ? {
                  ...factura,
                  guias: [...(factura.guias || []), nuevaGuia],
                }
              : factura,
          );

          // Recalcular totales
          const nuevoTotalGuias = facturasActualizadas.reduce(
            (total, f) => total + (f.guias?.length || 0),
            0,
          );

          return {
            ...viaje,
            facturas: facturasActualizadas,
            total_guias: nuevoTotalGuias,
          };
        }),
      );
    };

    // Registrar listeners
    socket.on("guia:estado_actualizado", handleGuiaActualizada);
    socket.on("viaje:progreso_actualizado", handleProgresoActualizado);
    socket.on("viaje:completado", handleViajeCompletado);
    socket.on("viaje:estado_actualizado", handleEstadoViajeActualizado);
    socket.on("factura:guia_asignada", handleGuiaAsignada);

    // Cleanup
    return () => {
      console.log("🧹 Limpiando listeners de WebSocket en Home");
      socket.off("guia:estado_actualizado", handleGuiaActualizada);
      socket.off("viaje:progreso_actualizado", handleProgresoActualizado);
      socket.off("viaje:completado", handleViajeCompletado);
      socket.off("viaje:estado_actualizado", handleEstadoViajeActualizado);
      socket.off("factura:guia_asignada", handleGuiaAsignada);
    };
  }, [socket, isConnected]);

  const puedeAsignar = user?.rol_id === 2 || user?.rol_id === 3;

  const handleAsignarFactura = async (nuevaFactura: any) => {
    try {
      await facturasApi.asignar(nuevaFactura);
      noti.success({
        title: "Factura Asignada",
        message: `La factura ${nuevaFactura.numero_factura} ha sido asignada exitosamente.`,
      });
      setMostrarFormulario(false);
      cargarViajes();
    } catch (error: any) {
      noti.error({
        title: "Error al Asignar Factura",
        message: `No se pudo asignar la factura. ${
          error.response?.data?.error || error.message
        }`,
      });
      throw error;
    }
  };

  const obtenerEstadoViaje = (
    viaje: Viaje,
  ): { texto: string; color: string; bgColor: string } => {
    // Priorizar estado_viaje de la BD si existe
    if (viaje.estado_viaje === 9) {
      return {
        texto: "Completado",
        color: "text-green-700 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/30",
      };
    }

    // Si no hay guías asignadas pero hay facturas sin guías
    if (viaje.total_guias < viaje.total_facturas) {
      return {
        texto: "Preparando",
        color: "text-orange-700 dark:text-orange-300",
        bgColor: "bg-orange-100 dark:bg-orange-900/30",
      };
    }

    // Si no hay guías asignadas
    if (viaje.total_guias === 0) {
      return {
        texto: "Sin guías asignadas",
        color: "text-gray-700 dark:text-gray-300",
        bgColor: "bg-gray-100 dark:bg-gray-900/30",
      };
    }

    // Si hay guías en proceso
    if (viaje.total_guias === viaje.total_facturas) {
      return {
        texto: "En ruta",
        color: "text-blue-700 dark:text-blue-300",
        bgColor: "bg-madeyso-green-100 dark:bg-blue-900/30",
      };
    }

    // Estado inicial
    return {
      texto: "Preparando",
      color: "text-orange-700 dark:text-orange-300",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    };
  };

  const calcularProgreso = (viaje: Viaje): number => {
    if (viaje.total_guias === 0) return 0;
    const completadas =
      viaje.guias_entregadas + (viaje.guias_no_entregadas || 0);
    return Math.round((completadas / viaje.total_guias) * 100);
  };

  const calcularPorcentajes = (viaje: Viaje) => {
    if (viaje.total_guias === 0) {
      return { entregadas: 0, noEntregadas: 0, pendientes: 0 };
    }

    const entregadas = Math.round(
      (viaje.guias_entregadas / viaje.total_guias) * 100,
    );
    const noEntregadas = Math.round(
      ((viaje.guias_no_entregadas || 0) / viaje.total_guias) * 100,
    );
    const pendientes = 100 - entregadas - noEntregadas;

    return { entregadas, noEntregadas, pendientes };
  };

  const cargarViajes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("sivec_token");

      if (!token) {
        setError("No hay token de autenticación");
        navigate("/login");
        return;
      }

      const response = await axios.get<any>(
        "http://localhost:3000/api/viajes?estado=activo",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // ✅ Manejar ambos formatos de respuesta
      const viajesData = response.data.success
        ? response.data.data // Nuevo formato: { success: true, data: [...] }
        : response.data; // Formato antiguo: [...]

      // Agregar total_facturas y guias_no_entregadas a cada viaje
      const viajesConCalculos = viajesData.map((viaje: Viaje) => ({
        ...viaje,
        total_facturas: viaje.facturas?.length || 0,
        guias_no_entregadas:
          viaje.facturas
            ?.flatMap((f) => f.guias || [])
            .filter((g) => g.estado_id === 5).length || 0,
      }));

      setViajes(viajesConCalculos);
      setError(null);
    } catch (err: any) {
      console.error(
        "❌ Error cargando viajes:",
        err.response?.status,
        err.message,
      );

      if (err.response?.status === 401) {
        setError("Sesión expirada.");
      } else {
        setError("No se pudieron cargar los viajes activos");
      }
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = (viajeId: number) => {
    navigate(`/viaje/${viajeId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <Icons.refresh className="w-16 h-16 text-madeyso-primary dark:text-madeyso-primary-light animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-slate-300 font-medium">
            Cargando viajes activos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-4">
            {/* Lado izquierdo */}
            <div className="flex items-center gap-3">
              <Icons.truck className="w-6 h-6 text-madeyso-primary dark:text-madeyso-primary-light" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                  Viajes Activos
                </h1>
                <div className="flex items-center gap-3 text-sm mt-1">
                  <span className="text-gray-600 dark:text-slate-400 font-medium">
                    {viajes.length} {viajes.length === 1 ? "viaje" : "viajes"}
                  </span>
                  {isConnected && (
                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="font-medium">En tiempo real</span>
                    </div>
                  )}
                  {!isConnected && (
                    <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      <span className="font-medium">Reconectando...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lado derecho - Controles */}
            <div className="flex items-center gap-3">
              {/* Toggle Vista */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => cambiarVista("cards")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    vistaActual === "cards"
                      ? "bg-white dark:bg-slate-800 text-madeyso-primary dark:text-madeyso-primary-light shadow-sm"
                      : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100"
                  }`}
                >
                  <Icons.grid className="w-4 h-4" />
                  Cards
                </button>
                <button
                  onClick={() => cambiarVista("tabla")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    vistaActual === "tabla"
                      ? "bg-white dark:bg-slate-800 text-madeyso-primary dark:text-madeyso-primary-light shadow-sm"
                      : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100"
                  }`}
                >
                  <Icons.table className="w-4 h-4" />
                  Tabla
                </button>
              </div>

              {/* Botón Asignar Factura */}
              {puedeAsignar && (
                <button
                  onClick={() => setMostrarFormulario(true)}
                  className="px-4 py-2 bg-madeyso-primary-dark hover:bg-madeyso-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <Icons.plus className="w-4 h-4" />
                  Asignar Factura
                </button>
              )}

              {/* Botón Recargar */}
              <button
                onClick={cargarViajes}
                className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                title="Recargar"
              >
                <Icons.refresh className="w-5 h-5 text-gray-600 dark:text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg mb-6 flex items-start">
            <Icons.alertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">
                Error
              </p>
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Lista de viajes */}
        {viajes.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icons.truck className="w-10 h-10 text-gray-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
              No hay viajes activos
            </h3>
            <p className="text-gray-600 dark:text-slate-400 mb-6">
              Cuando se asignen viajes, aparecerán aquí
            </p>
            {puedeAsignar && (
              <Button
                variant="primary"
                icon="plus"
                onClick={() => setMostrarFormulario(true)}
              >
                Asignar Primera Factura
              </Button>
            )}
          </div>
        ) : vistaActual === "tabla" ? (
          <TablaViajesDashboard
            viajes={viajes}
            calcularProgreso={calcularProgreso}
            calcularPorcentajes={calcularPorcentajes}
            obtenerEstadoViaje={obtenerEstadoViaje}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {viajes.map((viaje) => {
              const progreso = calcularProgreso(viaje);
              const porcentajes = calcularPorcentajes(viaje);
              const estado = obtenerEstadoViaje(viaje);

              return (
                <div
                  key={viaje.viaje_id}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => verDetalle(viaje.viaje_id)}
                >
                  {/* Header del viaje */}
                  <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-madeyso-green-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Icons.truck className="w-6 h-6 text-madeyso-primary dark:text-madeyso-primary-light" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 group-hover:text-madeyso-primary dark:group-hover:text-madeyso-primary-light transition-colors">
                            {viaje.numero_vehiculo}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-slate-400">
                            {viaje.vehiculo?.placa || "Sin placa"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${estado.color} ${estado.bgColor}`}
                      >
                        {estado.texto}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300 mb-4">
                      <Icons.user className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                      <span className="text-sm font-medium">
                        {viaje.piloto}
                      </span>
                    </div>

                    {/* Barra de progreso con 3 colores */}
                    <div>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-gray-600 dark:text-slate-400 font-medium">
                          Progreso de entregas
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-green-600 dark:text-green-400">
                            {viaje.guias_entregadas}
                          </span>
                          {viaje.guias_no_entregadas > 0 && (
                            <>
                              <span className="text-gray-400">/</span>
                              <span className="font-bold text-red-600 dark:text-red-400">
                                {viaje.guias_no_entregadas}
                              </span>
                            </>
                          )}
                          <span className="text-gray-400">de</span>
                          <span className="font-bold text-gray-900 dark:text-slate-100">
                            {viaje.total_guias}
                          </span>
                        </div>
                      </div>

                      {/* Barra de progreso tricolor */}
                      <div className="relative w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div className="absolute inset-0 flex">
                          {/* Barra verde: Entregadas */}
                          {porcentajes.entregadas > 0 && (
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                width: `${porcentajes.entregadas}%`,
                                backgroundColor: "#10b981",
                              }}
                              title={`${viaje.guias_entregadas} entregadas (${porcentajes.entregadas}%)`}
                            />
                          )}

                          {/* Barra roja: No entregadas */}
                          {porcentajes.noEntregadas > 0 && (
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                width: `${porcentajes.noEntregadas}%`,
                                backgroundColor: "#ef4444",
                              }}
                              title={`${viaje.guias_no_entregadas} no entregadas (${porcentajes.noEntregadas}%)`}
                            />
                          )}

                          {/* Gris: Pendientes (fondo por defecto) */}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs mt-1.5">
                        <div className="flex items-center gap-3">
                          {porcentajes.entregadas > 0 && (
                            <div className="flex items-center gap-1">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: "#10b981" }}
                              ></div>
                              <span className="text-gray-600 dark:text-slate-400">
                                {porcentajes.entregadas}% entregadas
                              </span>
                            </div>
                          )}
                          {porcentajes.noEntregadas > 0 && (
                            <div className="flex items-center gap-1">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: "#ef4444" }}
                              ></div>
                              <span className="text-gray-600 dark:text-slate-400">
                                {porcentajes.noEntregadas}% no entregadas
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-gray-500 dark:text-slate-500">
                          {progreso}% procesado
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Facturas */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                        Facturas asignadas
                      </h4>
                      <span className="text-sm font-bold text-gray-600 dark:text-slate-400">
                        {viaje.facturas?.length || 0}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {viaje.facturas?.slice(0, 3).map((factura) => {
                        const guiasEntregadas =
                          factura.guias?.filter((g) => g.estado_id === 4)
                            .length || 0;
                        const totalGuias = factura.guias?.length || 0;
                        const porcentaje =
                          totalGuias > 0
                            ? Math.round((guiasEntregadas / totalGuias) * 100)
                            : 0;

                        return (
                          <div
                            key={factura.factura_id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-madeyso-primary dark:bg-blue-400 rounded-full" />
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm">
                                  {factura.numero_factura}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-slate-400">
                                  {totalGuias}{" "}
                                  {totalGuias === 1 ? "guía" : "guías"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                                  porcentaje === 100
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : porcentaje > 0
                                      ? "bg-madeyso-green-100 text-blue-700 dark:bg-blue-900/30 dark:text-madeyso-primary-light"
                                      : "bg-gray-100 text-gray-600 dark:bg-slate-600 dark:text-slate-300"
                                }`}
                              >
                                {guiasEntregadas}/{totalGuias}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {viaje.facturas?.length > 3 && (
                        <p className="text-xs text-gray-500 dark:text-slate-500 text-center pt-2 font-medium">
                          + {viaje.facturas.length - 3} facturas más
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-700 rounded-b-xl">
                    <button
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        verDetalle(viaje.viaje_id);
                      }}
                    >
                      Ver detalles completos
                      <Icons.chevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Formulario */}
        {mostrarFormulario && (
          <FormularioAsignarFactura
            isOpen={mostrarFormulario}
            onClose={() => setMostrarFormulario(false)}
            onAsignarFactura={handleAsignarFactura}
          />
        )}
      </div>
    </div>
  );
};

export default Home;
