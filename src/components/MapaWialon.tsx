import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <svg
            className="w-6 h-6 text-blue-600 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <div>
            <h3 className="font-bold text-gray-800">
              Ubicación en Tiempo Real
            </h3>
            <p className="text-sm text-gray-500">Vehículo {numeroVehiculo}</p>
          </div>
        </div>
        <button
          onClick={cargarUbicacion}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 flex items-center"
        >
          <svg
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        </div>
      )}

      {/* Mapa */}
      <div ref={mapContainer} style={{ height: "400px", width: "100%" }} />

      {/* Info del vehículo */}
      {vehiculo && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Estado</p>
              <div className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    vehiculo.enMovimiento ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <p className="text-sm font-semibold text-gray-800">
                  {vehiculo.enMovimiento ? "En movimiento" : "Detenido"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Velocidad</p>
              <p className="text-sm font-semibold text-gray-800">
                {vehiculo.velocidad} km/h
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Latitud</p>
              <p className="text-sm font-semibold text-gray-800">
                {vehiculo.latitud.toFixed(6)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Longitud</p>
              <p className="text-sm font-semibold text-gray-800">
                {vehiculo.longitud.toFixed(6)}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Última actualización:{" "}
              {new Date(vehiculo.timestamp * 1000).toLocaleString("es-HN")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapaWialon;
