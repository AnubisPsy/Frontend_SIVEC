// src/components/PreviewExportacion.tsx
import React, { useState } from "react";

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-green-600 to-green-700 border-b border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                👁️ Preview de Exportación
              </h2>
              <p className="text-green-100 text-sm">
                Así se verá tu archivo de Excel
              </p>
            </div>
            <button
              onClick={onCerrar}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Información del archivo */}
        <div className="px-6 py-4 bg-green-50 border-b border-green-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 text-white px-4 py-2 rounded-lg">
                <span className="text-2xl font-bold">{viajes.length}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Total de registros
                </p>
                <p className="text-xs text-gray-500">Filas en el archivo</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                <span className="text-2xl font-bold">{columnas.length}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Columnas</p>
                <p className="text-xs text-gray-500">Campos a exportar</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-purple-600 text-white px-4 py-2 rounded-lg">
                <span className="text-2xl font-bold">
                  {incluirEstadisticas ? "2" : "1"}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Hojas</p>
                <p className="text-xs text-gray-500">Pestañas en Excel</p>
              </div>
            </div>
          </div>

          {/* Opción de incluir estadísticas */}
          <div className="mt-4 flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-green-200">
            <input
              type="checkbox"
              id="incluir-stats"
              checked={incluirEstadisticas}
              onChange={(e) => setIncluirEstadisticas(e.target.checked)}
              className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
            />
            <label
              htmlFor="incluir-stats"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              📊 Incluir hoja de estadísticas generales
            </label>
          </div>
        </div>

        {/* Preview de la tabla */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              📄 Hoja 1: Historial de Viajes
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Mostrando los primeros {registrosMostrados} de {viajes.length}{" "}
              registros
            </p>
          </div>

          <div className="border-2 border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    {columnas.map((columna) => (
                      <th
                        key={columna.id}
                        className="px-4 py-3 text-left font-bold text-gray-700 border-b-2 border-gray-300 whitespace-nowrap"
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
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      {columnas.map((columna) => (
                        <td
                          key={columna.id}
                          className="px-4 py-3 text-gray-700 border-b border-gray-200 whitespace-nowrap"
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
            <div className="text-center py-3 bg-blue-50 rounded-lg border-2 border-blue-200">
              <p className="text-sm text-blue-800 font-medium">
                + {viajes.length - registrosMostrados} registros más serán
                exportados...
              </p>
            </div>
          )}

          {/* Preview de estadísticas */}
          {incluirEstadisticas && estadisticas && (
            <div className="mt-8">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  📊 Hoja 2: Estadísticas Generales
                </h3>
              </div>

              <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left font-bold text-gray-700 border-b-2 border-gray-300">
                        Métrica
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-gray-700 border-b-2 border-gray-300">
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="px-4 py-3 text-gray-700 border-b border-gray-200">
                        Total Viajes
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 border-b border-gray-200">
                        {estadisticas.total_viajes}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-gray-700 border-b border-gray-200">
                        Total Facturas
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 border-b border-gray-200">
                        {estadisticas.total_facturas}
                      </td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-3 text-gray-700 border-b border-gray-200">
                        Total Guías
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 border-b border-gray-200">
                        {estadisticas.total_guias}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-gray-700 border-b border-gray-200">
                        Guías Entregadas
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-600 border-b border-gray-200">
                        {estadisticas.total_entregadas}
                      </td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-4 py-3 text-gray-700">
                        Pilotos Activos
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
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
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onCerrar}
            className="px-6 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onExportar}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Exportar a Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewExportacion;
