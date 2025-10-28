// src/components/ConfiguradorColumnas.tsx
import React, { useState } from "react";
import { Icons } from "./icons/IconMap";

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
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 border-b border-blue-800 dark:border-blue-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Icons.columns className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Configurar Columnas
                </h2>
                <p className="text-blue-100 text-sm">
                  Selecciona las columnas que deseas ver en la tabla
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

        {/* Estadísticas */}
        <div className="px-6 py-4 bg-blue-50 dark:bg-slate-700 border-b border-blue-100 dark:border-slate-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-md">
                {columnasVisibles}
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-slate-200 font-semibold">
                  Columnas seleccionadas
                </p>
                <p className="text-xs text-gray-600 dark:text-slate-400">
                  de {columnas.length} disponibles
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={seleccionarTodas}
                className="px-4 py-2 bg-white dark:bg-slate-600 border-2 border-blue-200 dark:border-slate-500 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-semibold hover:bg-blue-50 dark:hover:bg-slate-500 transition-all flex items-center gap-2"
              >
                <Icons.checkCircle className="w-4 h-4" />
                Todas
              </button>
              <button
                onClick={deseleccionarTodas}
                className="px-4 py-2 bg-white dark:bg-slate-600 border-2 border-gray-200 dark:border-slate-500 text-gray-700 dark:text-slate-200 rounded-lg text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-500 transition-all flex items-center gap-2"
              >
                <Icons.xCircle className="w-4 h-4" />
                Ninguna
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
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    : "bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    columna.visible
                      ? "bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500"
                      : "bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-500"
                  }`}
                >
                  {columna.visible && (
                    <Icons.check
                      className="w-4 h-4 text-white"
                      strokeWidth={3}
                    />
                  )}
                </div>
                <span
                  className={`font-medium text-sm ${
                    columna.visible
                      ? "text-blue-900 dark:text-blue-300"
                      : "text-gray-700 dark:text-slate-300"
                  }`}
                >
                  {columna.nombre}
                </span>
              </div>
            ))}
          </div>
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
            onClick={guardar}
            disabled={columnasVisibles === 0}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              columnasVisibles === 0
                ? "bg-gray-300 dark:bg-slate-600 text-gray-500 dark:text-slate-400 cursor-not-allowed"
                : "bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-700"
            }`}
          >
            <Icons.save className="w-4 h-4" />
            Guardar Configuración
          </button>
        </div>

        {/* Advertencia si no hay columnas */}
        {columnasVisibles === 0 && (
          <div className="px-6 pb-4">
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Icons.alertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                    Debe seleccionar al menos una columna
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
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
