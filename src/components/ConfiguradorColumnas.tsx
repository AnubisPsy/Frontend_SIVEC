// src/components/ConfiguradorColumnas.tsx
import React, { useState } from "react";

interface Columna {
  id: string;
  nombre: string;
  visible: boolean;
}

interface Props {
  columnasDisponibles: Columna[];
  columnasSeleccionadas: Columna[];
  onGuardar: (columnas: Columna[]) => void;
  onCerrar: () => void;
}

const ConfiguradorColumnas: React.FC<Props> = ({
  columnasDisponibles,
  columnasSeleccionadas,
  onGuardar,
  onCerrar,
}) => {
  const [columnas, setColumnas] = useState<Columna[]>(
    columnasDisponibles.map((col) => ({
      ...col,
      visible: columnasSeleccionadas.some((c) => c.id === col.id),
    }))
  );

  const toggleColumna = (id: string) => {
    setColumnas((prev) =>
      prev.map((col) =>
        col.id === id ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const seleccionarTodas = () => {
    setColumnas((prev) => prev.map((col) => ({ ...col, visible: true })));
  };

  const deseleccionarTodas = () => {
    setColumnas((prev) => prev.map((col) => ({ ...col, visible: false })));
  };

  const guardar = () => {
    const columnasSeleccionadasNuevas = columnas.filter((col) => col.visible);
    onGuardar(columnasSeleccionadasNuevas);
  };

  const columnasVisibles = columnas.filter((col) => col.visible).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                ⚙️ Configurar Columnas
              </h2>
              <p className="text-blue-100 text-sm">
                Selecciona las columnas que deseas ver en la tabla
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

        {/* Estadísticas */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-lg">
                {columnasVisibles}
              </div>
              <div>
                <p className="text-sm text-gray-600">Columnas seleccionadas</p>
                <p className="text-xs text-gray-500">
                  de {columnas.length} disponibles
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={seleccionarTodas}
                className="px-4 py-2 bg-white border-2 border-blue-200 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-all"
              >
                ✅ Todas
              </button>
              <button
                onClick={deseleccionarTodas}
                className="px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all"
              >
                ❌ Ninguna
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Columnas */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {columnas.map((columna) => (
              <div
                key={columna.id}
                onClick={() => toggleColumna(columna.id)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  columna.visible
                    ? "bg-blue-50 border-blue-300 hover:bg-blue-100"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    columna.visible
                      ? "bg-blue-600 border-blue-600"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {columna.visible && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={`font-medium text-sm ${
                    columna.visible ? "text-blue-900" : "text-gray-700"
                  }`}
                >
                  {columna.nombre}
                </span>
              </div>
            ))}
          </div>
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
            onClick={guardar}
            disabled={columnasVisibles === 0}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
              columnasVisibles === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            💾 Guardar Configuración
          </button>
        </div>

        {/* Advertencia si no hay columnas */}
        {columnasVisibles === 0 && (
          <div className="px-6 pb-4">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Debe seleccionar al menos una columna
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    La tabla necesita mostrar al menos una columna de datos
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfiguradorColumnas;
