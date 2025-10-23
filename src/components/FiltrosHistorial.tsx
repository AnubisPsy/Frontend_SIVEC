// src/components/FiltrosHistorial.tsx
import React, { useState } from "react";

interface Filtros {
  fecha_desde?: string;
  fecha_hasta?: string;
  piloto?: string;
  numero_vehiculo?: string;
}

interface Props {
  filtros: Filtros;
  onAplicarFiltros: (filtros: Filtros) => void;
}

const FiltrosHistorial: React.FC<Props> = ({ filtros, onAplicarFiltros }) => {
  const [filtrosTemp, setFiltrosTemp] = useState<Filtros>(filtros);
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);

  const handleChange = (campo: keyof Filtros, valor: string) => {
    setFiltrosTemp((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const aplicar = () => {
    onAplicarFiltros(filtrosTemp);
  };

  const limpiar = () => {
    const filtrosVacios: Filtros = {
      fecha_desde: new Date(new Date().setDate(new Date().getDate() - 7))
        .toISOString()
        .split("T")[0],
      fecha_hasta: new Date().toISOString().split("T")[0],
    };
    setFiltrosTemp(filtrosVacios);
    onAplicarFiltros(filtrosVacios);
  };

  const establecerRangoRapido = (dias: number) => {
    const hoy = new Date();
    const desde = new Date(hoy);
    desde.setDate(desde.getDate() - dias);

    const nuevosFiltros = {
      ...filtrosTemp,
      fecha_desde: desde.toISOString().split("T")[0],
      fecha_hasta: new Date().toISOString().split("T")[0],
    };

    setFiltrosTemp(nuevosFiltros);
    onAplicarFiltros(nuevosFiltros);
  };

  return (
    <div className="mb-6">
      <div className="bg-white rounded-xl p-6 shadow-md">
        {/* Filtros Rápidos */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            ⚡ Rangos rápidos:
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => establecerRangoRapido(0)}
              className="px-4 py-2 border-2 border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all"
            >
              Hoy
            </button>
            <button
              onClick={() => establecerRangoRapido(7)}
              className="px-4 py-2 border-2 border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all"
            >
              Última semana
            </button>
            <button
              onClick={() => establecerRangoRapido(30)}
              className="px-4 py-2 border-2 border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all"
            >
              Último mes
            </button>
            <button
              onClick={() => establecerRangoRapido(90)}
              className="px-4 py-2 border-2 border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all"
            >
              Últimos 3 meses
            </button>
          </div>
        </div>

        {/* Filtros Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">
              📅 Fecha Desde <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
              value={filtrosTemp.fecha_desde || ""}
              onChange={(e) => handleChange("fecha_desde", e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">
              📅 Fecha Hasta <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
              value={filtrosTemp.fecha_hasta || ""}
              onChange={(e) => handleChange("fecha_hasta", e.target.value)}
            />
          </div>
        </div>

        {/* Botón Filtros Avanzados */}
        <button
          onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
          className="w-full py-2.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-all mb-4"
        >
          {mostrarFiltrosAvanzados ? "▲" : "▼"} Filtros avanzados
        </button>

        {/* Filtros Avanzados */}
        {mostrarFiltrosAvanzados && (
          <div className="p-4 bg-gray-50 rounded-lg mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">
                  👨‍✈️ Piloto
                </label>
                <input
                  type="text"
                  className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  placeholder="Nombre del piloto..."
                  value={filtrosTemp.piloto || ""}
                  onChange={(e) => handleChange("piloto", e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">
                  🚛 Vehículo
                </label>
                <input
                  type="text"
                  className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  placeholder="Número de vehículo..."
                  value={filtrosTemp.numero_vehiculo || ""}
                  onChange={(e) =>
                    handleChange("numero_vehiculo", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={limpiar}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all"
          >
            🔄 Limpiar
          </button>
          <button
            onClick={aplicar}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all"
          >
            🔍 Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiltrosHistorial;
