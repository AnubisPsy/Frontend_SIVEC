import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Icons } from "./icons/IconMap";
import "../styles/leaflet-fix.css";

interface MapaWialonProps {
  numeroVehiculo: string;
}

interface VehiculoGPS {
  nombre: string;
  latitud: number;
  longitud: number;
  velocidad: number;
  timestamp: number;
  enMovimiento: boolean;
}

const MapaWialon: React.FC<MapaWialonProps> = ({ numeroVehiculo }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerInstance = useRef<L.Marker | null>(null);

  const [vehiculo, setVehiculo] = useState<VehiculoGPS | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Inicializar mapa
    if (mapContainer.current && !mapInstance.current) {
      mapInstance.current = L.map(mapContainer.current).setView(
        [15.7536, -86.7732],
        13
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstance.current);
    }

    // Cargar ubicación del vehículo
    if (numeroVehiculo) {
      cargarUbicacion();
    }

    return () => {
      // Limpiar mapa al desmontar
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (numeroVehiculo) {
      cargarUbicacion();
    }
  }, [numeroVehiculo]);

  const cargarUbicacion = async () => {
    try {
      setLoading(true);
      setError(null);

      // Llamar al endpoint del backend que creaste
      const response = await fetch(
        `http://localhost:3000/api/gps/ubicacion/${numeroVehiculo}`
      );

      if (!response.ok) {
        throw new Error("No se pudo obtener la ubicación del vehículo");
      }

      const data = await response.json();

      setVehiculo(data);
      actualizarMapa(data);
    } catch (err: any) {
      console.error("Error cargando ubicación:", err);
      setError(err.message || "Error al cargar ubicación");
    } finally {
      setLoading(false);
    }
  };

  const actualizarMapa = (datos: VehiculoGPS) => {
    if (!mapInstance.current) return;

    const { latitud, longitud, enMovimiento } = datos;

    // Centrar mapa en la ubicación
    mapInstance.current.setView([latitud, longitud], 15);

    // Remover marcador anterior si existe
    if (markerInstance.current) {
      markerInstance.current.remove();
    }

    // Crear icono personalizado según estado
    const iconColor = enMovimiento ? "green" : "red";
    const customIcon = L.divIcon({
      className: "custom-marker",
      html: `
        <div style="
          background-color: ${iconColor};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    // Crear nuevo marcador
    markerInstance.current = L.marker([latitud, longitud], {
      icon: customIcon,
    }).addTo(mapInstance.current).bindPopup(`
        <div style="text-align: center;">
          <strong>${datos.nombre}</strong><br/>
          Velocidad: ${datos.velocidad} km/h<br/>
          Estado: ${enMovimiento ? "En movimiento" : "Detenido"}
        </div>
      `);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-madeyso-green-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Icons.mapPin className="w-6 h-6 text-madeyso-primary dark:text-madeyso-primary-light" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 dark:text-slate-100">
              Ubicación en Tiempo Real
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Vehículo {numeroVehiculo}
            </p>
          </div>
        </div>
        <button
          onClick={cargarUbicacion}
          disabled={loading}
          className="px-4 py-2 bg-madeyso-primary-dark hover:bg-madeyso-green-700 dark:bg-madeyso-primary-dark dark:hover:bg-madeyso-green-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-2"
        >
          <Icons.refresh
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
            <Icons.alertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Mapa */}
      <div
        ref={mapContainer}
        style={{
          height: "400px",
          width: "100%",
          position: "relative",
          zIndex: 0,
        }}
      />

      {/* Info del vehículo */}
      {vehiculo && (
        <div className="p-4 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1 font-medium">
                Estado
              </p>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    vehiculo.enMovimiento ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                  {vehiculo.enMovimiento ? "En movimiento" : "Detenido"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1 font-medium">
                Velocidad
              </p>
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                {vehiculo.velocidad} km/h
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1 font-medium">
                Latitud
              </p>
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                {vehiculo.latitud.toFixed(6)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1 font-medium">
                Longitud
              </p>
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                {vehiculo.longitud.toFixed(6)}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
              <Icons.clock className="w-3 h-3" />
              <span>
                Última actualización:{" "}
                {new Date(vehiculo.timestamp * 1000).toLocaleString("es-HN")}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapaWialon;
