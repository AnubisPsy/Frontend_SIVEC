import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { facturasApi } from "../services/api";
import FormularioAsignarFactura from "../components/FormularioAsignarFactura";
import { Button } from "../components/ui/Button";
import { Icons } from "../components/icons/IconMap";
import { theme } from "../styles/theme";
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
     // console.log("⚠️ Inicio: No autenticado, saltando carga");
      setLoading(false);
      return;
    }

   // console.log("✅ Inicio: Autenticado, cargando viajes...");
    cargarViajes();
  }, [isAuthenticated]);

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
    viaje: Viaje
  ): { texto: string; color: string; bgColor: string } => {
    if (viaje.total_guias === 0) {
      return {
        texto: "Sin guías asignadas",
        color: "text-gray-700 dark:text-gray-300",
        bgColor: "bg-gray-100 dark:bg-gray-900/30",
      };
    } else if (viaje.guias_entregadas === viaje.total_guias) {
      return {
        texto: "Completado",
        color: "text-green-700 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/30",
      };
    } else if (viaje.guias_entregadas > 0) {
      return {
        texto: "En ruta",
        color: "text-blue-700 dark:text-blue-300",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
      };
    } else {
      return {
        texto: "Preparando",
        color: "text-orange-700 dark:text-orange-300",
        bgColor: "bg-orange-100 dark:bg-orange-900/30",
      };
    }
  };

  const cargarViajes = async () => {
  //  console.log("🚀 INICIANDO cargarViajes...");
    try {
      setLoading(true);
      const token = localStorage.getItem("sivec_token");

      if (!token) {
        setError("No hay token de autenticación");
        navigate("/login");
        return;
      }

      const response = await axios.get<Viaje[]>(
        "http://localhost:3000/api/viajes?estado=activo",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

    //  console.log("✅ Viajes recibidos:", response.data.length);
      setViajes(response.data);
      setError(null);
    } catch (err: any) {
      console.error(
        "❌ Error cargando viajes:",
        err.response?.status,
        err.message
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

  const calcularProgreso = (viaje: Viaje): number => {
    if (viaje.total_guias === 0) return 0;
    return Math.round((viaje.guias_entregadas / viaje.total_guias) * 100);
  };

  const getProgresoColor = (progreso: number): string => {
    if (progreso === 0) return "bg-gray-400";
    if (progreso < 50) return "bg-red-500";
    if (progreso < 100) return "bg-yellow-500";
    return "bg-green-500";
  };

  const verDetalle = (viajeId: number) => {
    navigate(`/viaje/${viajeId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <Icons.refresh className="w-16 h-16 text-blue-600 dark:text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-slate-300 font-medium">
            Cargando viajes activos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                Vista de Viajes
              </h1>
              <p className="text-gray-600 dark:text-slate-400">
                Monitorea el estado de todos los viajes activos en tiempo real
              </p>
            </div>

            {puedeAsignar && (
              <Button
                variant={mostrarFormulario ? "outline" : "primary"}
                size="lg"
                icon={mostrarFormulario ? "x" : "plus"}
                onClick={() => setMostrarFormulario(!mostrarFormulario)}
              >
                {mostrarFormulario ? "Cancelar" : "Asignar Factura"}
              </Button>
            )}
          </div>
        </div>

        {/* Formulario de asignación */}
        {mostrarFormulario && puedeAsignar && (
          <div className="mb-8 animate-fadeIn">
            <FormularioAsignarFactura
              onAsignarFactura={handleAsignarFactura}
              onCancelar={() => setMostrarFormulario(false)}
            />
          </div>
        )}

        {/* Toggle Vista */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Vista:
          </span>
          <div className="inline-flex rounded-lg bg-gray-100 dark:bg-slate-700 p-1">
            <button
              onClick={() => cambiarVista("cards")}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${
                vistaActual === "cards"
                  ? "bg-white dark:bg-slate-600 text-gray-900 dark:text-slate-100 shadow-sm"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
              }`}
            >
              <Icons.grid className="w-4 h-4" />
              Tarjetas
            </button>
            <button
              onClick={() => cambiarVista("tabla")}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${
                vistaActual === "tabla"
                  ? "bg-white dark:bg-slate-600 text-gray-900 dark:text-slate-100 shadow-sm"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
              }`}
            >
              <Icons.list className="w-4 h-4" />
              Tabla
            </button>
          </div>
        </div>

        {/* Resumen rápido - Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Viajes Activos */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-1">
                  Viajes Activos
                </p>
                <p className="text-4xl font-bold text-gray-900 dark:text-slate-100">
                  {viajes.length}
                </p>
              </div>
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Icons.truck className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Total Guías */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-1">
                  Total Guías
                </p>
                <p className="text-4xl font-bold text-gray-900 dark:text-slate-100">
                  {viajes.reduce((sum, v) => sum + v.total_guias, 0)}
                </p>
              </div>
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Icons.document className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Guías Entregadas */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-1">
                  Guías Entregadas
                </p>
                <p className="text-4xl font-bold text-gray-900 dark:text-slate-100">
                  {viajes.reduce((sum, v) => sum + v.guias_entregadas, 0)}
                </p>
              </div>
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Icons.checkCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

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
            obtenerEstadoViaje={obtenerEstadoViaje}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {viajes.map((viaje) => {
              const progreso = calcularProgreso(viaje);
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
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Icons.truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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

                    {/* Barra de progreso */}
                    <div>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-gray-600 dark:text-slate-400 font-medium">
                          Progreso de entregas
                        </span>
                        <span className="font-bold text-gray-900 dark:text-slate-100">
                          {viaje.guias_entregadas} / {viaje.total_guias}
                        </span>
                      </div>

                      <div className="relative w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full ${getProgresoColor(
                            progreso
                          )} transition-all duration-500 ease-out rounded-full`}
                          style={{ width: `${progreso}%` }}
                        />
                      </div>

                      <p className="text-xs text-gray-500 dark:text-slate-500 mt-1.5 font-medium">
                        {progreso}% completado
                      </p>
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
                              <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full" />
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
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
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
      </div>
    </div>
  );
};

export default Home;
