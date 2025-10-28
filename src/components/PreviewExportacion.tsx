// src/components/PreviewExportacion.tsx
import React, { useState } from "react";
import { Icons } from "./icons/IconMap";

interface Columna {
  id: string;
  nombre: string;
  visible: boolean;
}

interface Viaje {
  viaje_id: number;
  numero_vehiculo: string;
  piloto: string;
  fecha_viaje: string;
  created_at: string;
  updated_at: string;
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
  columnas: Columna[];
  estadisticas: any;
  onCerrar: () => void;
  onExportar: () => void;
}

const PreviewExportacion: React.FC<Props> = ({
  viajes,
  columnas,
  estadisticas,
  onCerrar,
  onExportar,
}) => {
  const [incluirEstadisticas, setIncluirEstadisticas] = useState(true);
  const [registrosMostrados] = useState(5);

  const obtenerValorCelda = (viaje: Viaje, columnaId: string) => {
    switch (columnaId) {
      case "viaje_id":
        return viaje.viaje_id;
      case "fecha_viaje":
        return new Date(viaje.fecha_viaje).toLocaleDateString("es-HN");
      case "piloto":
        return viaje.piloto;
      case "numero_vehiculo":
        return viaje.numero_vehiculo;
      case "total_facturas":
        return viaje.estadisticas.total_facturas;
      case "total_guias":
        return viaje.estadisticas.total_guias;
      case "guias_entregadas":
        return viaje.estadisticas.guias_entregadas;
      case "guias_no_entregadas":
        return viaje.estadisticas.guias_no_entregadas;
      case "porcentaje_exito":
        return `${viaje.estadisticas.porcentaje_exito}%`;
      case "hora_inicio":
        return new Date(viaje.created_at).toLocaleTimeString("es-HN");
      case "hora_fin":
        return new Date(viaje.updated_at).toLocaleTimeString("es-HN");
      case "duracion":
        const duracionMs =
          new Date(viaje.updated_at).getTime() -
          new Date(viaje.created_at).getTime();
        const horas = Math.floor(duracionMs / (1000 * 60 * 60));
        const minutos = Math.floor(
          (duracionMs % (1000 * 60 * 60)) / (1000 * 60)
        );
        return `${horas}h ${minutos}m`;
      default:
        return "-";
    }
  };

  const viajesPreview = viajes.slice(0, registrosMostrados);

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 border-b border-green-800 dark:border-green-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Icons.eye className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Preview de Exportación
                </h2>
                <p className="text-green-100 text-sm">
                  Así se verá tu archivo de Excel
                </p>
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

        {/* Información del archivo */}
        <div className="px-6 py-4 bg-green-50 dark:bg-slate-700 border-b border-green-100 dark:border-slate-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-lg shadow-md">
                <span className="text-2xl font-bold">{viajes.length}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                  Total de registros
                </p>
                <p className="text-xs text-gray-600 dark:text-slate-400">
                  Filas en el archivo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md">
                <span className="text-2xl font-bold">{columnas.length}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                  Columnas
                </p>
                <p className="text-xs text-gray-600 dark:text-slate-400">
                  Campos a exportar
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-purple-600 dark:bg-purple-500 text-white px-4 py-2 rounded-lg shadow-md">
                <span className="text-2xl font-bold">
                  {incluirEstadisticas ? "2" : "1"}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                  Hojas
                </p>
                <p className="text-xs text-gray-600 dark:text-slate-400">
                  Pestañas en Excel
                </p>
              </div>
            </div>
          </div>

          {/* Opción de incluir estadísticas */}
          <div className="mt-4 flex items-center gap-3 p-3 bg-white dark:bg-slate-600 rounded-lg border-2 border-green-200 dark:border-green-700">
            <input
              type="checkbox"
              id="incluir-stats"
              checked={incluirEstadisticas}
              onChange={(e) => setIncluirEstadisticas(e.target.checked)}
              className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
            />
            <label
              htmlFor="incluir-stats"
              className="text-sm font-medium text-gray-700 dark:text-slate-200 cursor-pointer flex items-center gap-2"
            >
              <Icons.barChart className="w-4 h-4 text-green-600 dark:text-green-400" />
              Incluir hoja de estadísticas generales
            </label>
          </div>
        </div>

        {/* Preview de la tabla */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Icons.fileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Hoja 1: Historial de Viajes
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
              Mostrando los primeros {registrosMostrados} de {viajes.length}{" "}
              registros
            </p>
          </div>

          <div className="border-2 border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-slate-700">
                    {columnas.map((columna) => (
                      <th
                        key={columna.id}
                        className="px-4 py-3 text-left font-bold text-gray-700 dark:text-slate-200 border-b-2 border-gray-300 dark:border-slate-600 whitespace-nowrap"
                      >
                        {columna.nombre}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {viajesPreview.map((viaje, index) => (
                    <tr
                      key={viaje.viaje_id}
                      className={
                        index % 2 === 0
                          ? "bg-white dark:bg-slate-800"
                          : "bg-gray-50 dark:bg-slate-750"
                      }
                    >
                      {columnas.map((columna) => (
                        <td
                          key={columna.id}
                          className="px-4 py-3 text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700 whitespace-nowrap"
                        >
                          {obtenerValorCelda(viaje, columna.id)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {viajes.length > registrosMostrados && (
            <div className="text-center py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center gap-2">
              <Icons.moreHorizontal className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                + {viajes.length - registrosMostrados} registros más serán
                exportados
              </p>
            </div>
          )}

          {/* Preview de estadísticas */}
          {incluirEstadisticas && estadisticas && (
            <div className="mt-8">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                  <Icons.barChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Hoja 2: Estadísticas Generales
                </h3>
              </div>

              <div className="border-2 border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-slate-700">
                      <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-slate-200 border-b-2 border-gray-300 dark:border-slate-600">
                        Métrica
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-slate-200 border-b-2 border-gray-300 dark:border-slate-600">
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white dark:bg-slate-800">
                      <td className="px-4 py-3 text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700">
                        Total Viajes
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-slate-100 border-b border-gray-200 dark:border-slate-700">
                        {estadisticas.total_viajes}
                      </td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-slate-750">
                      <td className="px-4 py-3 text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700">
                        Total Facturas
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-slate-100 border-b border-gray-200 dark:border-slate-700">
                        {estadisticas.total_facturas}
                      </td>
                    </tr>
                    <tr className="bg-white dark:bg-slate-800">
                      <td className="px-4 py-3 text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700">
                        Total Guías
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-slate-100 border-b border-gray-200 dark:border-slate-700">
                        {estadisticas.total_guias}
                      </td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-slate-750">
                      <td className="px-4 py-3 text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700">
                        Guías Entregadas
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400 border-b border-gray-200 dark:border-slate-700">
                        {estadisticas.total_entregadas}
                      </td>
                    </tr>
                    <tr className="bg-white dark:bg-slate-800">
                      <td className="px-4 py-3 text-gray-700 dark:text-slate-300">
                        Pilotos Activos
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-slate-100">
                        {estadisticas.pilotos_activos}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600 flex gap-3 justify-end">
          <button
            onClick={onCerrar}
            className="px-6 py-2.5 bg-white dark:bg-slate-600 border-2 border-gray-200 dark:border-slate-500 text-gray-700 dark:text-slate-200 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-slate-500 transition-all flex items-center gap-2"
          >
            <Icons.x className="w-4 h-4" />
            Cancelar
          </button>
          <button
            onClick={onExportar}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
          >
            <Icons.download className="w-5 h-5" />
            Exportar a Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewExportacion;
