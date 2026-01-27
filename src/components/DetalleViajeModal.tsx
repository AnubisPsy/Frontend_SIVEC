// src/components/DetalleViajeModal.tsx
import React from "react";
import { Icons } from "./icons/IconMap";

interface Viaje {
  viaje_id: number;
  numero_vehiculo: string;
  piloto: string;
  fecha_viaje: string;
  created_at: string;
  updated_at: string;
  facturas: Array<{
    numero_factura: string;
    notas_jefe?: string;
  }>;
  guias: Array<{
    guia_id: number;
    numero_guia: string;
    estado_id: number;
    fecha_entrega?: string;
    estados: {
      nombre: string;
    };
  }>;
  estadisticas: {
    total_facturas: number;
    total_guias: number;
    guias_entregadas: number;
    guias_no_entregadas: number;
    porcentaje_exito: number;
  };
}

interface Props {
  viaje: Viaje;
  onCerrar: () => void;
}

const DetalleViajeModal: React.FC<Props> = ({ viaje, onCerrar }) => {
  const calcularDuracion = (inicio: string, fin: string) => {
    const duracionMs = new Date(fin).getTime() - new Date(inicio).getTime();
    const horas = Math.floor(duracionMs / (1000 * 60 * 60));
    const minutos = Math.floor((duracionMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${horas}h ${minutos}m`;
  };

  const getEstadoBadge = (estado_id: number) => {
    switch (estado_id) {
      case 3:
        return {
          bg: "bg-madeyso-green-100 text-blue-800 dark:bg-blue-900/30 dark:text-madeyso-primary-light",
          icon: <Icons.package className="w-4 h-4" />,
          text: "Asignada",
        };
      case 4:
        return {
          bg: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
          icon: <Icons.checkCircle className="w-4 h-4" />,
          text: "Entregada",
        };
      case 5:
        return {
          bg: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
          icon: <Icons.xCircle className="w-4 h-4" />,
          text: "No Entregada",
        };
      default:
        return {
          bg: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
          icon: <Icons.alertCircle className="w-4 h-4" />,
          text: "Desconocido",
        };
    }
  };

  const getEstadoProgress = (porcentaje: number) => {
    if (porcentaje === 100)
      return "bg-gradient-to-r from-green-500 to-green-600";
    if (porcentaje >= 80)
      return "bg-gradient-to-r from-yellow-500 to-yellow-600";
    return "bg-gradient-to-r from-red-500 to-red-600";
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 border-b border-purple-800 dark:border-purple-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Icons.truck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Viaje #{viaje.viaje_id}
                </h2>
                <div className="flex items-center gap-2 text-purple-100 text-sm">
                  <Icons.calendar className="w-4 h-4" />
                  <span>
                    {new Date(viaje.fecha_viaje).toLocaleDateString("es-HN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onCerrar}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
              aria-label="Cerrar"
            >
              <Icons.x className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-auto px-6 py-6">
          {/* Información General */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Icons.info className="w-5 h-5 text-madeyso-primary dark:text-madeyso-primary-light" />
              Información General
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-madeyso-green-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                <p className="text-xs text-madeyso-primary dark:text-madeyso-primary-light font-semibold uppercase mb-2">
                  Piloto
                </p>
                <div className="flex items-center gap-2">
                  <Icons.user className="w-6 h-6 text-madeyso-primary dark:text-madeyso-primary-light" />
                  <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                    {viaje.piloto}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase mb-2">
                  Vehículo
                </p>
                <div className="flex items-center gap-2">
                  <Icons.truck className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                    {viaje.numero_vehiculo}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase mb-2">
                  Duración
                </p>
                <div className="flex items-center gap-2">
                  <Icons.clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                    {calcularDuracion(viaje.created_at, viaje.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Icons.barChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Estadísticas del Viaje
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-xl border-2 border-gray-200 dark:border-slate-600">
                <div className="w-10 h-10 bg-madeyso-green-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icons.document className="w-5 h-5 text-madeyso-primary dark:text-madeyso-primary-light" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1">
                  {viaje.estadisticas.total_facturas}
                </p>
                <p className="text-xs text-gray-600 dark:text-slate-400 uppercase font-semibold">
                  Facturas
                </p>
              </div>

              <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-xl border-2 border-gray-200 dark:border-slate-600">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icons.package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1">
                  {viaje.estadisticas.total_guias}
                </p>
                <p className="text-xs text-gray-600 dark:text-slate-400 uppercase font-semibold">
                  Guías
                </p>
              </div>

              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icons.checkCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400 mb-1">
                  {viaje.estadisticas.guias_entregadas}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 uppercase font-semibold">
                  Entregadas
                </p>
              </div>

              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icons.xCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400 mb-1">
                  {viaje.estadisticas.guias_no_entregadas}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 uppercase font-semibold">
                  No Entregadas
                </p>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-750 rounded-xl border-2 border-gray-200 dark:border-slate-600">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  Progreso de Entregas
                </span>
                <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {viaje.estadisticas.porcentaje_exito}%
                </span>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getEstadoProgress(
                    viaje.estadisticas.porcentaje_exito
                  )}`}
                  style={{ width: `${viaje.estadisticas.porcentaje_exito}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Icons.clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              Línea de Tiempo
            </h3>
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
              <div className="text-center">
                <div className="w-12 h-12 bg-madeyso-green-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icons.clock className="w-6 h-6 text-madeyso-primary dark:text-madeyso-primary-light" />
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-400 uppercase font-semibold mb-1">
                  Inicio
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                  {new Date(viaje.created_at).toLocaleTimeString("es-HN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="flex-1 mx-4">
                <div className="h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icons.clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-400 uppercase font-semibold mb-1">
                  Duración
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                  {calcularDuracion(viaje.created_at, viaje.updated_at)}
                </p>
              </div>

              <div className="flex-1 mx-4">
                <div className="h-1 bg-gradient-to-r from-purple-400 to-green-400 rounded-full"></div>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icons.checkCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-400 uppercase font-semibold mb-1">
                  Fin
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                  {new Date(viaje.updated_at).toLocaleTimeString("es-HN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Facturas */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Icons.document className="w-5 h-5 text-madeyso-primary dark:text-madeyso-primary-light" />
              Facturas Asignadas ({viaje.facturas.length})
            </h3>
            {viaje.facturas.length > 0 ? (
              <div className="space-y-3">
                {viaje.facturas.map((factura, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white dark:bg-slate-700 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-madeyso-green-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Icons.document className="w-5 h-5 text-madeyso-primary dark:text-madeyso-primary-light" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-slate-100">
                            {factura.numero_factura}
                          </p>
                          {factura.notas_jefe && (
                            <div className="flex items-start gap-2 mt-1">
                              <Icons.edit className="w-4 h-4 text-gray-500 dark:text-slate-400 mt-0.5" />
                              <p className="text-sm text-gray-600 dark:text-slate-400">
                                {factura.notas_jefe}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 dark:bg-slate-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600">
                <Icons.document className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-slate-400">
                  No hay facturas asignadas
                </p>
              </div>
            )}
          </div>

          {/* Guías */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Icons.package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Guías de Remisión ({viaje.guias.length})
            </h3>
            {viaje.guias.length > 0 ? (
              <div className="space-y-3">
                {viaje.guias.map((guia) => {
                  const badge = getEstadoBadge(guia.estado_id);
                  return (
                    <div
                      key={guia.guia_id}
                      className="p-4 bg-white dark:bg-slate-700 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <Icons.package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-slate-100">
                              {guia.numero_guia}
                            </p>
                            {guia.fecha_entrega && (
                              <div className="flex items-center gap-2 mt-1">
                                <Icons.calendar className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                                <p className="text-xs text-gray-600 dark:text-slate-400">
                                  Entregada:{" "}
                                  {new Date(
                                    guia.fecha_entrega
                                  ).toLocaleDateString("es-HN")}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ${badge.bg}`}
                        >
                          {badge.icon}
                          {badge.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 dark:bg-slate-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600">
                <Icons.package className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-slate-400">
                  No hay guías vinculadas
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600 flex justify-end">
          <button
            onClick={onCerrar}
            className="px-6 py-2.5 bg-madeyso-primary-dark hover:bg-madeyso-green-700 dark:bg-madeyso-primary-dark dark:hover:bg-madeyso-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
          >
            <Icons.x className="w-4 h-4" />
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetalleViajeModal;
