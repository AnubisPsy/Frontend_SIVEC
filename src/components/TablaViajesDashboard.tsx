// src/components/TablaViajesDashboard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "./icons/IconMap";

interface Viaje {
  viaje_id: number;
  numero_vehiculo: string;
  piloto: string;
  created_at: string;
  vehiculo: {
    placa: string;
    agrupacion: string;
  };
  facturas: any[];
  total_guias: number;
  guias_entregadas: number;
  estado_viaje?: number;
}

interface TablaViajesDashboardProps {
  viajes: Viaje[];
  calcularProgreso: (viaje: Viaje) => number;
  obtenerEstadoViaje: (viaje: Viaje) => {
    texto: string;
    color: string;
    bgColor: string;
  };
}

const TablaViajesDashboard: React.FC<TablaViajesDashboardProps> = ({
  viajes,
  calcularProgreso,
  obtenerEstadoViaje,
}) => {
  const navigate = useNavigate();

  const verDetalle = (viajeId: number) => {
    navigate(`/viaje/${viajeId}`);
  };

  const getProgresoColor = (progreso: number): string => {
    if (progreso === 0) return "bg-gray-400";
    if (progreso < 50) return "bg-red-500";
    if (progreso < 100) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Vehículo
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Piloto
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Facturas
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Guías
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Progreso
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {viajes.map((viaje) => {
              const progreso = calcularProgreso(viaje);
              const estado = obtenerEstadoViaje(viaje);

              return (
                <tr
                  key={viaje.viaje_id}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                  onClick={() => verDetalle(viaje.viaje_id)}
                >
                  {/* Vehículo */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icons.truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-slate-100">
                          {viaje.numero_vehiculo}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">
                          {viaje.vehiculo?.placa || "Sin placa"}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Piloto */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Icons.user className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                        {viaje.piloto}
                      </span>
                    </div>
                  </td>

                  {/* Facturas */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Icons.FileTextIcon className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                        {viaje.facturas?.length || 0}
                      </span>
                    </div>
                  </td>

                  {/* Guías */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700 dark:text-slate-300">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {viaje.guias_entregadas}
                      </span>
                      {" / "}
                      <span className="font-semibold">{viaje.total_guias}</span>
                    </span>
                  </td>

                  {/* Progreso */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-[100px]">
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${getProgresoColor(
                              progreso
                            )}`}
                            style={{ width: `${progreso}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-slate-100 min-w-[45px] text-right">
                        {progreso}%
                      </span>
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${estado.color} ${estado.bgColor} dark:bg-opacity-20`}
                    >
                      {estado.texto}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        verDetalle(viaje.viaje_id);
                      }}
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      Ver detalles
                      <Icons.chevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaViajesDashboard;
