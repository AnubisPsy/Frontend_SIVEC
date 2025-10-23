// src/components/CardsViajes.tsx
import React from "react";

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
        border: "border-l-green-500",
        badge: "bg-green-100 text-green-800",
        progress: "bg-gradient-to-r from-green-500 to-green-600",
      };
    if (porcentaje >= 80)
      return {
        border: "border-l-yellow-500",
        badge: "bg-yellow-100 text-yellow-800",
        progress: "bg-gradient-to-r from-yellow-500 to-yellow-600",
      };
    return {
      border: "border-l-red-500",
      badge: "bg-red-100 text-red-800",
      progress: "bg-gradient-to-r from-red-500 to-red-600",
    };
  };

  const getEstadoIcon = (porcentaje: number) => {
    if (porcentaje === 100) return "✅";
    if (porcentaje >= 80) return "⚠️";
    return "❌";
  };

  return (
    <div className="p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {viajes.map((viaje) => {
          const estadoClasses = getEstadoClasses(
            viaje.estadisticas.porcentaje_exito
          );
          const estadoIcon = getEstadoIcon(viaje.estadisticas.porcentaje_exito);

          return (
            <div
              key={viaje.viaje_id}
              className={`bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-[6px] ${estadoClasses.border}`}
            >
              {/* Header */}
              <div className="px-5 py-4 bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Viaje #{viaje.viaje_id}
                    </h3>
                    <span className="text-xs text-gray-600 font-medium">
                      📅{" "}
                      {new Date(viaje.fecha_viaje).toLocaleDateString("es-HN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-base ${estadoClasses.badge}`}
                  >
                    <span className="text-xl">{estadoIcon}</span>
                    <span>{viaje.estadisticas.porcentaje_exito}%</span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                {/* Info Principal */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-2xl">👨‍✈️</span>
                    <div>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">
                        Piloto
                      </p>
                      <p className="text-sm text-gray-900 font-semibold">
                        {viaje.piloto}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-2xl">🚛</span>
                    <div>
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">
                        Vehículo
                      </p>
                      <p className="text-sm text-gray-900 font-semibold">
                        {viaje.numero_vehiculo}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Estadísticas Grid */}
                <div className="grid grid-cols-4 gap-3 mb-5">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <span className="block text-xl mb-2">📄</span>
                    <p className="text-xl font-bold text-gray-900 mb-1">
                      {viaje.estadisticas.total_facturas}
                    </p>
                    <p className="text-[9px] text-gray-600 uppercase font-semibold">
                      Facturas
                    </p>
                  </div>

                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <span className="block text-xl mb-2">📋</span>
                    <p className="text-xl font-bold text-gray-900 mb-1">
                      {viaje.estadisticas.total_guias}
                    </p>
                    <p className="text-[9px] text-gray-600 uppercase font-semibold">
                      Guías
                    </p>
                  </div>

                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <span className="block text-xl mb-2">✅</span>
                    <p className="text-xl font-bold text-gray-900 mb-1">
                      {viaje.estadisticas.guias_entregadas}
                    </p>
                    <p className="text-[9px] text-gray-600 uppercase font-semibold">
                      Entregadas
                    </p>
                  </div>

                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <span className="block text-xl mb-2">❌</span>
                    <p className="text-xl font-bold text-gray-900 mb-1">
                      {viaje.estadisticas.guias_no_entregadas}
                    </p>
                    <p className="text-[9px] text-gray-600 uppercase font-semibold">
                      No entregadas
                    </p>
                  </div>
                </div>

                {/* Barra de Progreso */}
                <div className="mb-5">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-gray-600 font-semibold">
                      Progreso de entregas
                    </span>
                    <span className="text-xs text-gray-900 font-bold">
                      {viaje.estadisticas.porcentaje_exito}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${estadoClasses.progress}`}
                      style={{
                        width: `${viaje.estadisticas.porcentaje_exito}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🕐</span>
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase font-semibold mb-0.5">
                        Inicio
                      </p>
                      <p className="text-xs text-gray-900 font-semibold">
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

                  <div className="text-gray-300 text-base font-bold">→</div>

                  <div className="flex items-center gap-2">
                    <span className="text-xl">⏱️</span>
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase font-semibold mb-0.5">
                        Duración
                      </p>
                      <p className="text-xs text-gray-900 font-semibold">
                        {calcularDuracion(viaje.created_at, viaje.updated_at)}
                      </p>
                    </div>
                  </div>

                  <div className="text-gray-300 text-base font-bold">→</div>

                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏁</span>
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase font-semibold mb-0.5">
                        Fin
                      </p>
                      <p className="text-xs text-gray-900 font-semibold">
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
              <div className="px-5 pb-5 pt-2 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => onVerDetalle(viaje)}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all hover:-translate-y-0.5"
                >
                  👁️ Ver Detalles Completos
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
