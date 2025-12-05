// src/pages/MapaVivo.tsx
import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Icons } from "../components/icons/IconMap";
import { useAuth } from "../contexts/AuthContext";
import { ubicacionesApi, sucursalesApi } from "../services/api";
import { io, Socket } from "socket.io-client";
import MapaVivoComponent from "../components/MapaVivoComponent";

interface Ubicacion {
  vehiculo_id: number;
  numero_vehiculo: string;
  placa: string;
  sucursal_id: number;
  sucursal: string;
  tiene_gps: boolean;
  latitud: number | null;
  longitud: number | null;
  velocidad: number;
  direccion: number;
  ultima_actualizacion: string | null;
  tiene_viaje: boolean;
  viaje_id: number | null;
  piloto: string | null;
  estado_viaje: string;
  estado_viaje_id: number | null;
  wialon_nombre: string | null;
}

interface Sucursal {
  sucursal_id: number;
  nombre_sucursal: string;
}

const MapaVivo = () => {
  const { user } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});

  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Filtros
  const [filtroSucursal, setFiltroSucursal] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [soloConGPS, setSoloConGPS] = useState(false);
  const [soloEnViaje, setSoloEnViaje] = useState(false);

  // UI
  const [vehiculoSeleccionado, setVehiculoSeleccionado] =
    useState<Ubicacion | null>(null);

  // Honduras - Centro aproximado
  const centroHonduras: [number, number] = [14.0723, -87.1921];

  // Inicializar mapa una sola vez
  useEffect(() => {
    if (mapContainer.current && !mapInstance.current) {
      mapInstance.current = L.map(mapContainer.current).setView(
        centroHonduras,
        8
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstance.current);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
    conectarWebSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Actualizar marcadores cuando cambien las ubicaciones
  useEffect(() => {
    actualizarMarcadores();
  }, [ubicaciones]);

  // 🐛 DEBUG: Loguear cuando cambian los filtros
  useEffect(() => {
    const total = ubicaciones.length;
    const filtradas = obtenerUbicacionesFiltradas().length;
    // console.log(`🔍 Filtros aplicados: ${filtradas} de ${total} ubicaciones`);
    // console.log(`   ✓ Solo GPS: ${soloConGPS}, Solo Viaje: ${soloEnViaje}`);
  }, [soloConGPS, soloEnViaje, busqueda, filtroSucursal]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);

      // Cargar sucursales (solo admin)
      if (user?.rol_id === 3) {
        const resSucursales = await sucursalesApi.obtenerTodas();
        if (resSucursales.data.success) {
          setSucursales(resSucursales.data.data);
        }
      }

      // Cargar ubicaciones
      const params: any = {};

      // ✅ FIX: Filtrar por sucursal para jefes de yarda (rol_id = 2)
      if (user?.rol_id === 2) {
        params.sucursal_id = user.sucursal_id;
        //  console.log("🗺️ Filtrando vehículos por sucursal:", user.sucursal_id);
      }

      const resUbicaciones = await ubicacionesApi.obtenerTodas(params);
      if (resUbicaciones.data.success) {
        const ubicaciones = resUbicaciones.data.data.ubicaciones;
        /*         console.log("✅ Ubicaciones cargadas:", ubicaciones?.length);
        console.log(
          "   📊 Con GPS:",
          ubicaciones?.filter((u: Ubicacion) => u.tiene_gps).length
        );
        console.log(
          "   📊 Sin GPS:",
          ubicaciones?.filter((u: Ubicacion) => !u.tiene_gps).length
        ); */
        setUbicaciones(ubicaciones);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const conectarWebSocket = () => {
    const socketUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : window.location.origin;

    const token = localStorage.getItem("token");

    const newSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      auth: { token },
    });

    newSocket.on("connect", () => {
      //  console.log("✅ WebSocket conectado");

      // ✅ FIX: Enviar sucursal_id al conectar para recibir solo actualizaciones relevantes
      if (user?.rol_id === 2) {
        newSocket.emit("join_sucursal", { sucursal_id: user.sucursal_id });
      }
    });

    newSocket.on("ubicaciones_actualizadas", (data) => {
      //  console.log("📡 Ubicaciones actualizadas:", data.ubicaciones.length);

      // ✅ FILTRAR POR SUCURSAL SEGÚN ROL ANTES DE ACTUALIZAR ESTADO
      let ubicacionesFiltradas = data.ubicaciones;

      if (user?.rol_id === 2 && user?.sucursal_id) {
        ubicacionesFiltradas = data.ubicaciones.filter(
          (u: Ubicacion) => u.sucursal_id === user.sucursal_id
        );
        /*         console.log(
          "🔍 Filtradas por sucursal:",
          ubicacionesFiltradas.length,
          "de",
          data.ubicaciones.length
        ); */
      }

      setUbicaciones(ubicacionesFiltradas);
    });

    newSocket.on("disconnect", () => {
      console.log("WebSocket desconectado");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Error conectando WebSocket:", error);
    });

    setSocket(newSocket);
  };

  const actualizarMarcadores = () => {
    if (!mapInstance.current) return;

    const ubicacionesFiltradas = obtenerUbicacionesFiltradas();
    const ubicacionesConGPS = ubicacionesFiltradas.filter(
      (u) => u.tiene_gps && u.latitud && u.longitud
    );

    // Remover marcadores que ya no existen
    Object.keys(markersRef.current).forEach((key) => {
      const vehiculoId = parseInt(key);
      if (!ubicacionesConGPS.find((u) => u.vehiculo_id === vehiculoId)) {
        markersRef.current[vehiculoId].remove();
        delete markersRef.current[vehiculoId];
      }
    });

    // Agregar o actualizar marcadores
    ubicacionesConGPS.forEach((ubicacion) => {
      const marker = markersRef.current[ubicacion.vehiculo_id];
      const position: [number, number] = [
        ubicacion.latitud!,
        ubicacion.longitud!,
      ];

      if (marker) {
        // Actualizar posición del marcador existente
        marker.setLatLng(position);
      } else {
        // Crear nuevo marcador
        const icon = crearIcono(ubicacion);
        const newMarker = L.marker(position, { icon })
          .addTo(mapInstance.current!)
          .bindPopup(crearPopupContent(ubicacion))
          .on("click", () => handleSeleccionarVehiculo(ubicacion));

        markersRef.current[ubicacion.vehiculo_id] = newMarker;
      }
    });
  };

  const crearIcono = (ubicacion: Ubicacion) => {
    const color = ubicacion.tiene_viaje ? "#3b82f6" : "#10b981";
    const html = `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      ">
        🚛
      </div>
    `;

    return L.divIcon({
      html,
      className: "custom-marker",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  const crearPopupContent = (ubicacion: Ubicacion) => {
    return `
      <div style="text-align: center; font-family: sans-serif;">
        <strong style="font-size: 14px;">${
          ubicacion.numero_vehiculo
        }</strong><br/>
        <span style="font-size: 12px;">Placa: ${ubicacion.placa}</span><br/>
        ${
          ubicacion.piloto
            ? `<span style="font-size: 12px;">Piloto: ${ubicacion.piloto}</span><br/>`
            : ""
        }
        <span style="font-size: 12px;">Velocidad: ${
          ubicacion.velocidad
        } km/h</span><br/>
        <span style="font-size: 12px; color: ${
          ubicacion.tiene_viaje ? "#3b82f6" : "#10b981"
        };">
          ${ubicacion.estado_viaje}
        </span>
      </div>
    `;
  };

  const obtenerUbicacionesFiltradas = () => {
    return ubicaciones.filter((ubicacion) => {
      // Filtro por sucursal
      if (user?.rol_id === 3 && filtroSucursal !== "todas") {
        if (ubicacion.sucursal_id !== parseInt(filtroSucursal)) return false;
      }

      // Filtro solo con GPS
      if (soloConGPS && !ubicacion.tiene_gps) return false;

      // Filtro solo en viaje
      if (soloEnViaje && !ubicacion.tiene_viaje) return false;

      // Búsqueda
      if (busqueda) {
        const busquedaLower = busqueda.toLowerCase();
        const coincide =
          ubicacion.numero_vehiculo.toLowerCase().includes(busquedaLower) ||
          ubicacion.placa.toLowerCase().includes(busquedaLower) ||
          ubicacion.piloto?.toLowerCase().includes(busquedaLower);
        if (!coincide) return false;
      }

      return true;
    });
  };

  const handleSeleccionarVehiculo = (ubicacion: Ubicacion) => {
    setVehiculoSeleccionado(ubicacion);
    if (ubicacion.latitud && ubicacion.longitud && mapInstance.current) {
      mapInstance.current.flyTo([ubicacion.latitud, ubicacion.longitud], 15, {
        duration: 1,
      });
    }
  };

  const ubicacionesFiltradas = obtenerUbicacionesFiltradas();
  const ubicacionesConGPS = ubicacionesFiltradas.filter((u) => u.tiene_gps);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <Icons.refresh className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-slate-400">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.history.back()}
                className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors flex items-center gap-2"
              >
                <Icons.chevronLeft className="w-5 h-5" />
                Volver
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-slate-600"></div>
              <Icons.map className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                Mapa en Vivo
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-lg font-semibold">
                {ubicacionesConGPS.length} con GPS
              </span>
              <span className="text-gray-500 dark:text-slate-400">de</span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300 rounded-lg font-semibold">
                {ubicacionesFiltradas.length} total
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <div className="relative">
              <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar vehículo o piloto..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filtro Sucursal */}
          {user?.rol_id === 3 && (
            <div>
              <select
                value={filtroSucursal}
                onChange={(e) => setFiltroSucursal(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas las sucursales</option>
                {sucursales.map((s) => (
                  <option key={s.sucursal_id} value={s.sucursal_id}>
                    {s.nombre_sucursal}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Checkboxes */}
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={soloConGPS}
                onChange={(e) => setSoloConGPS(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-slate-300">
                Solo con GPS
              </span>
            </label>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={soloEnViaje}
                onChange={(e) => setSoloEnViaje(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-slate-300">
                Solo en viaje
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Mapa y Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mapa */}
        <div className="flex-1 relative z-0">
          <MapaVivoComponent
            ubicaciones={ubicacionesConGPS}
            onVehiculoClick={handleSeleccionarVehiculo}
          />
        </div>

        {/* Panel Lateral */}
        <div className="w-80 bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="font-bold text-gray-900 dark:text-slate-100">
              Vehículos ({ubicacionesFiltradas.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {ubicacionesFiltradas.map((ubicacion) => (
              <div
                key={ubicacion.vehiculo_id}
                onClick={() => handleSeleccionarVehiculo(ubicacion)}
                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                  vehiculoSeleccionado?.vehiculo_id === ubicacion.vehiculo_id
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icons.truck
                    className={`w-5 h-5 mt-1 ${
                      ubicacion.tiene_gps
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-slate-100">
                      {ubicacion.numero_vehiculo}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      {ubicacion.placa}
                    </p>

                    {ubicacion.piloto && (
                      <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                        👤 {ubicacion.piloto}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          ubicacion.tiene_viaje
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        {ubicacion.estado_viaje}
                      </span>

                      {!ubicacion.tiene_gps && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Sin GPS
                        </span>
                      )}
                    </div>

                    {ubicacion.tiene_gps && (
                      <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">
                        🕒{" "}
                        {ubicacion.ultima_actualizacion
                          ? new Date(
                              ubicacion.ultima_actualizacion
                            ).toLocaleString("es-HN")
                          : "N/A"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {ubicacionesFiltradas.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-slate-400">
              <Icons.truck className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No se encontraron vehículos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapaVivo;
