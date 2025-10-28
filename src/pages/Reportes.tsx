// src/pages/Reportes.tsx
import React, { useState, useEffect } from "react";
import { viajesApi } from "../services/api";
import FiltrosHistorial from "../components/FiltrosHistorial";
import TablaViajes from "../components/TablaViajes";
import CardsViajes from "../components/CardsViajes";
import ConfiguradorColumnas from "../components/ConfiguradorColumnas";
import PreviewExportacion from "../components/PreviewExportacion";
import DetalleViajeModal from "../components/DetalleViajeModal";
import { Icons } from "../components/icons/IconMap";
import * as XLSX from "xlsx";

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

interface Filtros {
  fecha_desde?: string;
  fecha_hasta?: string;
  piloto?: string;
  numero_vehiculo?: string;
}

const Reportes = () => {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [filtros, setFiltros] = useState<Filtros>({
    fecha_desde: new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0],
    fecha_hasta: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [vistaActual, setVistaActual] = useState<"tabla" | "cards">("tabla");
  const [viajeSeleccionado, setViajeSeleccionado] = useState<Viaje | null>(
    null
  );
  const [showConfigColumnas, setShowConfigColumnas] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [columnasDisponibles] = useState([
    { id: "viaje_id", nombre: "ID Viaje", visible: true },
    { id: "fecha_viaje", nombre: "Fecha", visible: true },
    { id: "piloto", nombre: "Piloto", visible: true },
    { id: "numero_vehiculo", nombre: "Vehículo", visible: true },
    { id: "total_facturas", nombre: "Facturas", visible: true },
    { id: "total_guias", nombre: "Total Guías", visible: true },
    { id: "guias_entregadas", nombre: "Entregadas", visible: true },
    { id: "guias_no_entregadas", nombre: "No Entregadas", visible: true },
    { id: "porcentaje_exito", nombre: "% Éxito", visible: true },
    { id: "hora_inicio", nombre: "Hora Inicio", visible: false },
    { id: "hora_fin", nombre: "Hora Fin", visible: false },
    { id: "duracion", nombre: "Duración", visible: false },
  ]);

  const [columnasSeleccionadas, setColumnasSeleccionadas] = useState(
    columnasDisponibles.filter((col) => col.visible)
  );

  useEffect(() => {
    cargarHistorial();
  }, [filtros]);

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const response = await viajesApi.obtenerHistorial(filtros);

      if (response.data.success) {
        setViajes(response.data.data);
        setEstadisticas(response.data.estadisticas);
        console.log("✅ Historial cargado:", response.data.data.length);
      }
    } catch (error: any) {
      console.error("❌ Error cargando historial:", error);
      alert("Error al cargar el historial");
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = (nuevosFiltros: Filtros) => {
    setFiltros(nuevosFiltros);
  };

  const exportarAExcel = () => {
    const datosExportar = viajes.map((viaje) => {
      const fila: any = {};

      columnasSeleccionadas.forEach((columna) => {
        switch (columna.id) {
          case "viaje_id":
            fila["ID Viaje"] = viaje.viaje_id;
            break;
          case "fecha_viaje":
            fila["Fecha"] = new Date(viaje.fecha_viaje).toLocaleDateString(
              "es-HN"
            );
            break;
          case "piloto":
            fila["Piloto"] = viaje.piloto;
            break;
          case "numero_vehiculo":
            fila["Vehículo"] = viaje.numero_vehiculo;
            break;
          case "total_facturas":
            fila["Facturas"] = viaje.estadisticas.total_facturas;
            break;
          case "total_guias":
            fila["Total Guías"] = viaje.estadisticas.total_guias;
            break;
          case "guias_entregadas":
            fila["Entregadas"] = viaje.estadisticas.guias_entregadas;
            break;
          case "guias_no_entregadas":
            fila["No Entregadas"] = viaje.estadisticas.guias_no_entregadas;
            break;
          case "porcentaje_exito":
            fila["% Éxito"] = `${viaje.estadisticas.porcentaje_exito}%`;
            break;
          case "hora_inicio":
            fila["Hora Inicio"] = new Date(viaje.created_at).toLocaleTimeString(
              "es-HN"
            );
            break;
          case "hora_fin":
            fila["Hora Fin"] = new Date(viaje.updated_at).toLocaleTimeString(
              "es-HN"
            );
            break;
          case "duracion":
            const duracionMs =
              new Date(viaje.updated_at).getTime() -
              new Date(viaje.created_at).getTime();
            const horas = Math.floor(duracionMs / (1000 * 60 * 60));
            const minutos = Math.floor(
              (duracionMs % (1000 * 60 * 60)) / (1000 * 60)
            );
            fila["Duración"] = `${horas}h ${minutos}m`;
            break;
        }
      });

      return fila;
    });

    const ws = XLSX.utils.json_to_sheet(datosExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial de Viajes");

    const estadisticasSheet = XLSX.utils.json_to_sheet([
      { Métrica: "Total Viajes", Valor: estadisticas.total_viajes },
      { Métrica: "Total Facturas", Valor: estadisticas.total_facturas },
      { Métrica: "Total Guías", Valor: estadisticas.total_guias },
      { Métrica: "Guías Entregadas", Valor: estadisticas.total_entregadas },
      { Métrica: "Pilotos Activos", Valor: estadisticas.pilotos_activos },
    ]);
    XLSX.utils.book_append_sheet(wb, estadisticasSheet, "Estadísticas");

    const nombreArchivo = `reportes_viajes_${filtros.fecha_desde}_${filtros.fecha_hasta}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);

    console.log("✅ Archivo exportado:", nombreArchivo);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Icons.barChart className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100">
                Reportes de Viajes
              </h1>
              <p className="text-gray-600 dark:text-slate-400 text-lg">
                Visualiza y exporta el historial completo de viajes completados
              </p>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border-l-4 border-blue-500 dark:border-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mb-1">
                    Total Viajes
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                    {estadisticas.total_viajes}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Icons.truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border-l-4 border-purple-500 dark:border-purple-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mb-1">
                    Facturas
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                    {estadisticas.total_facturas}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Icons.document className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border-l-4 border-indigo-500 dark:border-indigo-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mb-1">
                    Guías
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                    {estadisticas.total_guias}
                  </p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                  <Icons.package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border-l-4 border-green-500 dark:border-green-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mb-1">
                    Entregadas
                  </p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                    {estadisticas.total_entregadas}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Icons.checkCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border-l-4 border-orange-500 dark:border-orange-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mb-1">
                    Pilotos
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                    {estadisticas.pilotos_activos}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Icons.user className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <FiltrosHistorial filtros={filtros} onAplicarFiltros={aplicarFiltros} />

        {/* Toolbar */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setVistaActual("tabla")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                vistaActual === "tabla"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
              }`}
            >
              <Icons.table className="w-4 h-4" />
              Tabla
            </button>
            <button
              onClick={() => setVistaActual("cards")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                vistaActual === "cards"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
              }`}
            >
              <Icons.grid className="w-4 h-4" />
              Cards
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowConfigColumnas(true)}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-all flex items-center gap-2"
            >
              <Icons.settings className="w-4 h-4" />
              Configurar Columnas
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-all flex items-center gap-2"
            >
              <Icons.eye className="w-4 h-4" />
              Preview Exportación
            </button>
            <button
              onClick={exportarAExcel}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              <Icons.download className="w-4 h-4" />
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Icons.refresh className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-slate-400">
                Cargando historial...
              </p>
            </div>
          </div>
        ) : viajes.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-gray-200 dark:border-slate-700 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icons.package className="w-10 h-10 text-gray-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
              No hay viajes en el historial
            </h3>
            <p className="text-gray-600 dark:text-slate-400">
              Ajusta los filtros para ver más resultados
            </p>
          </div>
        ) : vistaActual === "tabla" ? (
          <TablaViajes
            viajes={viajes}
            columnas={columnasSeleccionadas}
            onVerDetalle={setViajeSeleccionado}
          />
        ) : (
          <CardsViajes viajes={viajes} onVerDetalle={setViajeSeleccionado} />
        )}

        {/* Modals */}
        {showConfigColumnas && (
          <ConfiguradorColumnas
            columnasDisponibles={columnasDisponibles}
            columnasSeleccionadas={columnasSeleccionadas}
            onGuardar={(columnas) => {
              setColumnasSeleccionadas(columnas);
              setShowConfigColumnas(false);
            }}
            onCerrar={() => setShowConfigColumnas(false)}
          />
        )}

        {showPreview && (
          <PreviewExportacion
            viajes={viajes}
            columnas={columnasSeleccionadas}
            estadisticas={estadisticas}
            onCerrar={() => setShowPreview(false)}
            onExportar={() => {
              setShowPreview(false);
              exportarAExcel();
            }}
          />
        )}

        {viajeSeleccionado && (
          <DetalleViajeModal
            viaje={viajeSeleccionado}
            onCerrar={() => setViajeSeleccionado(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Reportes;
