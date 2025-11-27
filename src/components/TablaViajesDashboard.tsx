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
  total_facturas: number;
  guias_no_entregadas: number;
}

interface TablaViajesDashboardProps {
  viajes: Viaje[];
  calcularProgreso: (viaje: Viaje) => number;
  calcularPorcentajes: (viaje: Viaje) => {
    entregadas: number;
    noEntregadas: number;
    pendientes: number;
  };
  obtenerEstadoViaje: (viaje: Viaje) => {
    texto: string;
    color: string;
    bgColor: string;
  };
}

const TablaViajesDashboard: React.FC<TablaViajesDashboardProps> = ({
  viajes,
  calcularProgreso,
  calcularPorcentajes,
  obtenerEstadoViaje,
}) => {
  const navigate = useNavigate();

  const verDetalle = (viajeId: number) => {
    navigate(`/viaje/${viajeId}`);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
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
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider min-w-[200px]">
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

          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {viajes.map((viaje) => {
              const progreso = calcularProgreso(viaje);
              const porcentajes = calcularPorcentajes(viaje);
              const estado = obtenerEstadoViaje(viaje);

              return (
                <tr
                  key={viaje.viaje_id}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                  onClick={() => verDetalle(viaje.viaje_id)}
                >
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

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Icons.user className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                        {viaje.piloto}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Icons.FileTextIcon className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                        {viaje.facturas?.length || 0}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {viaje.guias_entregadas}
                      </span>
                      {viaje.guias_no_entregadas > 0 && (
                        <>
                          <span className="text-gray-400">/</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            {viaje.guias_no_entregadas}
                          </span>
                        </>
                      )}
                      <span className="text-gray-400">de</span>
                      <span className="font-semibold text-gray-900 dark:text-slate-100">
                        {viaje.total_guias}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="relative w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div className="absolute inset-0 flex">
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
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {porcentajes.entregadas > 0 && (
                            <div className="flex items-center gap-1">
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: "#10b981" }}
                              ></div>
                              <span className="text-gray-600 dark:text-slate-400">
                                {porcentajes.entregadas}%
                              </span>
                            </div>
                          )}
                          {porcentajes.noEntregadas > 0 && (
                            <div className="flex items-center gap-1">
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: "#ef4444" }}
                              ></div>
                              <span className="text-gray-600 dark:text-slate-400">
                                {porcentajes.noEntregadas}%
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-slate-100">
                          {progreso}%
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${estado.color} ${estado.bgColor} dark:bg-opacity-20`}
                    >
                      {estado.texto}
                    </span>
                  </td>

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
