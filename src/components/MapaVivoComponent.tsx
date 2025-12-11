// src/components/MapaVivoComponent.tsx
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

interface MapaVivoComponentProps {
  ubicaciones: Ubicacion[];
  onVehiculoClick?: (ubicacion: Ubicacion) => void;
}

const MapaVivoComponent: React.FC<MapaVivoComponentProps> = ({
  ubicaciones,
  onVehiculoClick,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});
  const primeraVezRef = useRef<boolean>(true);

  const centroHonduras: [number, number] = [14.0723, -87.1921];

  // ✅ FUNCIÓN PARA CREAR ÍCONO
  const crearIcono = (ubicacion: Ubicacion): L.DivIcon => {
    const color = ubicacion.tiene_viaje ? "#3b82f6" : "#10b981";
    const enMovimiento = ubicacion.velocidad > 5;

    return L.divIcon({
      html: `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        ">
          <div style="
            position: relative;
            background-color: ${color};
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          ">
            🚛
            ${
              enMovimiento
                ? `
              <div class="direction-arrow" style="
                position: absolute;
                top: -8px;
                left: 50%;
                transform: translateX(-50%) rotate(${ubicacion.direccion}deg);
                transform-origin: center bottom;
                transition: transform 0.3s ease;
              ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#10b981">
                  <path d="M12 2L4 12h16L12 2z"/>
                </svg>
              </div>
            `
                : ""
            }
          </div>
          <div style="
            background-color: rgba(0, 0, 0, 0.75);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-family: sans-serif;
            white-space: nowrap;
            text-align: center;
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
          ">
            ${ubicacion.wialon_nombre || ubicacion.numero_vehiculo}
          </div>
        </div>
      `,
      className: "custom-marker",
      iconSize: [150, 60],
      iconAnchor: [75, 20],
    });
  };

  // ✅ Inicializar mapa UNA SOLA VEZ
  useEffect(() => {
    if (mapContainer.current && !mapInstance.current) {
      console.log("🗺️ Inicializando mapa...");

      mapInstance.current = L.map(mapContainer.current).setView(
        centroHonduras,
        8
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstance.current);

      console.log("✅ Mapa inicializado");
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // ✅ Actualizar marcadores - ESTRATEGIA SIMPLE (igual que la prueba)
  useEffect(() => {
    if (!mapInstance.current) {
      console.log("⚠️ Mapa no inicializado todavía");
      return;
    }

    console.log("📍 Actualizando marcadores:", ubicaciones.length);
    console.log(
      "   📊 Con viaje:",
      ubicaciones.filter((u) => u.tiene_viaje).length
    );

    // 🔥 LIMPIAR TODOS LOS MARCADORES EXISTENTES
    Object.values(markersRef.current).forEach((marker) => {
      marker.remove();
    });
    markersRef.current = {};

    if (ubicaciones.length === 0) {
      console.log("ℹ️ No hay ubicaciones para mostrar");
      return;
    }

    // 🔥 CREAR NUEVOS MARCADORES
    ubicaciones.forEach((ubicacion) => {
      console.log(
        "➕ Creando marcador:",
        ubicacion.numero_vehiculo,
        "tiene_viaje:",
        ubicacion.tiene_viaje
      );

      const position: [number, number] = [
        ubicacion.latitud!,
        ubicacion.longitud!,
      ];

      const newMarker = L.marker(position, { icon: crearIcono(ubicacion) })
        .addTo(mapInstance.current!)
        .bindPopup(
          `
          <div>
            <strong>${ubicacion.numero_vehiculo}</strong><br/>
            Placa: ${ubicacion.placa}<br/>
            Velocidad: ${ubicacion.velocidad} km/h<br/>
            Sucursal: ${ubicacion.sucursal}<br/>
            ${ubicacion.piloto ? `Piloto: ${ubicacion.piloto}<br/>` : ""}
            Estado: ${ubicacion.estado_viaje || "N/A"}
          </div>
        `
        )
        .on("click", () => {
          if (onVehiculoClick) {
            onVehiculoClick(ubicacion);
          }
        });

      markersRef.current[ubicacion.vehiculo_id] = newMarker;
      console.log("✅ Marcador creado:", ubicacion.numero_vehiculo);
    });

    // ✅ Ajustar vista SOLO en la primera carga
    if (primeraVezRef.current && ubicaciones.length > 0) {
      console.log("🎯 Primera carga: ajustando vista del mapa");
      const bounds = L.latLngBounds(
        ubicaciones.map((u) => [u.latitud!, u.longitud!] as [number, number])
      );
      mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      primeraVezRef.current = false;
      console.log("✅ Vista inicial ajustada");
    }
  }, [ubicaciones, onVehiculoClick]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
};

export default MapaVivoComponent;
