// src/components/FiltrosHistorial.tsx
import React, { useState, useEffect } from "react";

interface Filtros {
  fecha_desde?: string;
  fecha_hasta?: string;
  piloto?: string;
  numero_vehiculo?: string;
  sucursal_id?: string;
  estado_viaje?: string;
  porcentaje_minimo?: string;
  agrupacion?: string;
}

interface Props {
  filtros: Filtros;
  onAplicarFiltros: (filtros: Filtros) => void;
}

interface Sucursal {
  sucursal_id: number;
  nombre_sucursal: string;
}

interface Vehiculo {
  vehiculo_id: number;
  numero_vehiculo: string;
  placa: string;
  agrupacion?: string;
  sucursal_id: number;
}

interface Piloto {
  nombre_piloto: string;
  es_temporal: boolean;
}

const FiltrosHistorial: React.FC<Props> = ({ filtros, onAplicarFiltros }) => {
  const [filtrosTemp, setFiltrosTemp] = useState<Filtros>(filtros);
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);

  // Estados para opciones
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [pilotos, setPilotos] = useState<Piloto[]>([]);

  // Estados de carga
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);
  const [loadingPilotos, setLoadingPilotos] = useState(false);

  useEffect(() => {
    cargarSucursales();
    cargarPilotos();
  }, []);

  // Cargar vehículos cuando cambia la sucursal
  useEffect(() => {
    if (filtrosTemp.sucursal_id === "") {
      // Si no hay sucursal, cargar todos
      cargarVehiculos();
    } else {
      // Si hay sucursal, filtrar
      cargarVehiculos(filtrosTemp.sucursal_id);
    }
  }, [filtrosTemp.sucursal_id]);

  const cargarSucursales = async () => {
    setLoadingSucursales(true);
    try {
      const response = await fetch("http://localhost:3000/api/sucursales", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sivec_token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSucursales(data.data);
      }
    } catch (error) {
      console.error("Error cargando sucursales:", error);
    } finally {
      setLoadingSucursales(false);
    }
  };

  const cargarVehiculos = async (sucursal_id?: string) => {
    setLoadingVehiculos(true);
    try {
      // Si sucursal_id está vacío o es undefined, obtener todos
      const url =
        sucursal_id && sucursal_id !== ""
          ? `http://localhost:3000/api/vehiculos?sucursal_id=${sucursal_id}`
          : "http://localhost:3000/api/vehiculos";

      console.log("🚛 Cargando vehículos desde:", url); // Log para debug

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sivec_token")}`,
        },
      });
      const data = await response.json();

      console.log("📦 Vehículos recibidos:", data.data?.length); // Log para debug

      if (data.success) {
        setVehiculos(data.data);
      }
    } catch (error) {
      console.error("Error cargando vehículos:", error);
    } finally {
      setLoadingVehiculos(false);
    }
  };

  const cargarPilotos = async () => {
    setLoadingPilotos(true);
    try {
      const response = await fetch("http://localhost:3000/api/pilotos", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sivec_token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPilotos(data.data);
        console.log(`✅ ${data.data.length} pilotos cargados`);
      }
    } catch (error) {
      console.error("Error cargando pilotos:", error);
    } finally {
      setLoadingPilotos(false);
    }
  };
  
  const handleChange = (campo: keyof Filtros, valor: string) => {
    setFiltrosTemp((prev) => {
      const nuevos = {
        ...prev,
        [campo]: valor,
      };

      // Si cambia la sucursal, limpiar el vehículo seleccionado
      if (campo === "sucursal_id") {
        nuevos.numero_vehiculo = "";
      }

      return nuevos;
    });
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">
              🏭 Sucursal
            </label>
            <select
              className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-white"
              value={filtrosTemp.sucursal_id || ""}
              onChange={(e) => handleChange("sucursal_id", e.target.value)}
              disabled={loadingSucursales}
            >
              <option value="">Todas las sucursales</option>
              {sucursales.map((sucursal) => (
                <option key={sucursal.sucursal_id} value={sucursal.sucursal_id}>
                  {sucursal.nombre_sucursal}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">
              📊 Estado de Viaje
            </label>
            <select
              className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-white"
              value={filtrosTemp.estado_viaje || ""}
              onChange={(e) => handleChange("estado_viaje", e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="7">⏳ Pendiente</option>
              <option value="8">🚛 En Proceso</option>
              <option value="9">✅ Completado</option>
            </select>
          </div>
        </div>

        {/* Botón para filtros avanzados */}
        <button
          onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
          className="w-full py-2.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-all mb-4 flex items-center justify-center gap-2"
        >
          {mostrarFiltrosAvanzados ? (
            <>
              <span>▲</span>
              <span>Ocultar filtros avanzados</span>
            </>
          ) : (
            <>
              <span>▼</span>
              <span>Mostrar filtros avanzados</span>
            </>
          )}
        </button>

        {/* Filtros Avanzados */}
        {mostrarFiltrosAvanzados && (
          <div className="p-4 bg-gray-50 rounded-lg mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">
              🔍 Filtros Adicionales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Piloto con datalist */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">
                  👨‍✈️ Piloto ({pilotos.length} disponibles)
                </label>
                <input
                  list="pilotos-list"
                  type="text"
                  className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  placeholder="Buscar piloto..."
                  value={filtrosTemp.piloto || ""}
                  onChange={(e) => handleChange("piloto", e.target.value)}
                  disabled={loadingPilotos}
                />
                <datalist id="pilotos-list">
                  {pilotos.map((piloto, index) => (
                    <option key={index} value={piloto.nombre_piloto}>
                      {piloto.nombre_piloto}{" "}
                      {piloto.es_temporal ? "(Temporal)" : "(SQL)"}
                    </option>
                  ))}
                </datalist>
              </div>

              {/* Vehículo con datalist */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">
                  🚛 Vehículo ({vehiculos.length} disponibles)
                </label>
                <input
                  list="vehiculos-list"
                  type="text"
                  className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  placeholder="Buscar vehículo..."
                  value={filtrosTemp.numero_vehiculo || ""}
                  onChange={(e) =>
                    handleChange("numero_vehiculo", e.target.value)
                  }
                  disabled={loadingVehiculos}
                />
                <datalist id="vehiculos-list">
                  {vehiculos.map((vehiculo) => (
                    <option
                      key={vehiculo.vehiculo_id}
                      value={vehiculo.numero_vehiculo}
                    >
                      {vehiculo.numero_vehiculo} - {vehiculo.placa}
                      {vehiculo.agrupacion && ` (${vehiculo.agrupacion})`}
                    </option>
                  ))}
                </datalist>
                {filtrosTemp.sucursal_id && (
                  <p className="text-xs text-blue-600 mt-1">
                    Filtrando por sucursal seleccionada
                  </p>
                )}
              </div>

              {/* Agrupación */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">
                  🔗 Agrupación
                </label>
                <input
                  type="text"
                  className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  placeholder="Ej: Flota A"
                  value={filtrosTemp.agrupacion || ""}
                  onChange={(e) => handleChange("agrupacion", e.target.value)}
                />
              </div>

              {/* % Éxito Mínimo */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">
                  📈 % Éxito Mínimo
                </label>
                <select
                  className="px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-white"
                  value={filtrosTemp.porcentaje_minimo || ""}
                  onChange={(e) =>
                    handleChange("porcentaje_minimo", e.target.value)
                  }
                >
                  <option value="">Cualquier porcentaje</option>
                  <option value="100">100% (Perfecto)</option>
                  <option value="80">≥ 80% (Bueno)</option>
                  <option value="50">≥ 50% (Regular)</option>
                  <option value="0">≥ 0% (Todos)</option>
                </select>
              </div>
            </div>

            {/* Indicador de filtros activos */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                <span className="font-semibold">
                  Filtros avanzados activos:
                </span>{" "}
                {[
                  filtrosTemp.piloto && "Piloto",
                  filtrosTemp.numero_vehiculo && "Vehículo",
                  filtrosTemp.agrupacion && "Agrupación",
                  filtrosTemp.porcentaje_minimo && "% Éxito",
                ]
                  .filter(Boolean)
                  .join(", ") || "Ninguno"}
              </p>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={limpiar}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all"
          >
            🔄 Limpiar Filtros
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
