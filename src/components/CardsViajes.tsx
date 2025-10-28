// src/components/CardsViajes.tsx
import React from "react";
import { Icons } from "./icons/IconMap";

interface Viaje {
  viaje_id: number;
  numero_vehiculo: string;
  piloto: string;
  fecha_viaje: string;
  created_at: string;
  updated_at: string;
  facturas: any[];
  guias: any[];
  estadisticas: {
    total_facturas: number;
    total_guias: number;
    guias_entregadas: number;
    guias_no_entregadas: number;
    porcentaje_exito: number;
  };
}

interface Props {
  viajes: Viaje[];
  onVerDetalle: (viaje: Viaje) => void;
}

const CardsViajes: React.FC<Props> = ({ viajes, onVerDetalle }) => {
  const calcularDuracion = (inicio: string, fin: string) => {
    const duracionMs = new Date(fin).getTime() - new Date(inicio).getTime();
    const horas = Math.floor(duracionMs / (1000 * 60 * 60));
    const minutos = Math.floor((duracionMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${horas}h ${minutos}m`;
  };

  const getEstadoClasses = (porcentaje: number) => {
    if (porcentaje === 100)
      return {
        border: "border-l-green-500 dark:border-l-green-400",
        badge:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        progress: "bg-gradient-to-r from-green-500 to-green-600",
      };
    if (porcentaje >= 80)
      return {
        border: "border-l-yellow-500 dark:border-l-yellow-400",
        badge:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        progress: "bg-gradient-to-r from-yellow-500 to-yellow-600",
      };
    return {
      border: "border-l-red-500 dark:border-l-red-400",
      badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      progress: "bg-gradient-to-r from-red-500 to-red-600",
    };
  };

  const getEstadoIcon = (porcentaje: number) => {
    if (porcentaje === 100) return <Icons.checkCircle className="w-5 h-5" />;
    if (porcentaje >= 80) return <Icons.alertCircle className="w-5 h-5" />;
    return <Icons.xCircle className="w-5 h-5" />;
  };

  return (
    <div className="p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {viajes.map((viaje) => {
          const estadoClasses = getEstadoClasses(
            viaje.estadisticas.porcentaje_exito
          );

          return (
            <div
              key={viaje.viaje_id}
              className={`bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-[6px] ${estadoClasses.border}`}
            >
              {/* Header */}
              <div className="px-5 py-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-750 border-b border-gray-200 dark:border-slate-600">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                      Viaje #{viaje.viaje_id}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400 font-medium">
                      <Icons.calendar className="w-4 h-4" />
                      <span>
                        {new Date(viaje.fecha_viaje).toLocaleDateString(
                          "es-HN",
                          {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-base ${estadoClasses.badge}`}
                  >
                    {getEstadoIcon(viaje.estadisticas.porcentaje_exito)}
                    <span>{viaje.estadisticas.porcentaje_exito}%</span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                {/* Info Principal */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Icons.user className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">
                        Piloto
                      </p>
                      <p className="text-sm text-gray-900 dark:text-slate-100 font-semibold truncate">
                        {viaje.piloto}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Icons.truck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">
                        Vehículo
                      </p>
                      <p className="text-sm text-gray-900 dark:text-slate-100 font-semibold truncate">
                        {viaje.numero_vehiculo}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Estadísticas Grid */}
                <div className="grid grid-cols-4 gap-3 mb-5">
                  <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Icons.document className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-1">
                      {viaje.estadisticas.total_facturas}
                    </p>
                    <p className="text-[9px] text-gray-600 dark:text-slate-400 uppercase font-semibold">
                      Facturas
                    </p>
                  </div>

                  <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Icons.package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-1">
                      {viaje.estadisticas.total_guias}
                    </p>
                    <p className="text-[9px] text-gray-600 dark:text-slate-400 uppercase font-semibold">
                      Guías
                    </p>
                  </div>

                  <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Icons.checkCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-1">
                      {viaje.estadisticas.guias_entregadas}
                    </p>
                    <p className="text-[9px] text-gray-600 dark:text-slate-400 uppercase font-semibold">
                      Entregadas
                    </p>
                  </div>

                  <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Icons.xCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-1">
                      {viaje.estadisticas.guias_no_entregadas}
                    </p>
                    <p className="text-[9px] text-gray-600 dark:text-slate-400 uppercase font-semibold">
                      No entregadas
                    </p>
                  </div>
                </div>

                {/* Barra de Progreso */}
                <div className="mb-5">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-gray-600 dark:text-slate-400 font-semibold">
                      Progreso de entregas
                    </span>
                    <span className="text-xs text-gray-900 dark:text-slate-100 font-bold">
                      {viaje.estadisticas.porcentaje_exito}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${estadoClasses.progress}`}
                      style={{
                        width: `${viaje.estadisticas.porcentaje_exito}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Icons.clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 dark:text-slate-400 uppercase font-semibold mb-0.5">
                        Inicio
                      </p>
                      <p className="text-xs text-gray-900 dark:text-slate-100 font-semibold">
                        {new Date(viaje.created_at).toLocaleTimeString(
                          "es-HN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  <Icons.chevronRight className="w-4 h-4 text-gray-300 dark:text-slate-600" />

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Icons.clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 dark:text-slate-400 uppercase font-semibold mb-0.5">
                        Duración
                      </p>
                      <p className="text-xs text-gray-900 dark:text-slate-100 font-semibold">
                        {calcularDuracion(viaje.created_at, viaje.updated_at)}
                      </p>
                    </div>
                  </div>

                  <Icons.chevronRight className="w-4 h-4 text-gray-300 dark:text-slate-600" />

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Icons.checkCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 dark:text-slate-400 uppercase font-semibold mb-0.5">
                        Fin
                      </p>
                      <p className="text-xs text-gray-900 dark:text-slate-100 font-semibold">
                        {new Date(viaje.updated_at).toLocaleTimeString(
                          "es-HN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 pb-5 pt-2 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => onVerDetalle(viaje)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Icons.info className="w-4 h-4" />
                  Ver Detalles Completos
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CardsViajes;
