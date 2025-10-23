// src/components/TablaViajes.tsx
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

interface Props {
  viajes: Viaje[];
  columnas: Columna[];
  onVerDetalle: (viaje: Viaje) => void;
}

const TablaViajes: React.FC<Props> = ({ viajes, columnas, onVerDetalle }) => {
  const [ordenamiento, setOrdenamiento] = useState<{
    columna: string;
    direccion: "asc" | "desc";
  }>({ columna: "fecha_viaje", direccion: "desc" });

  const obtenerValorCelda = (viaje: Viaje, columnaId: string) => {
    switch (columnaId) {
      case "viaje_id":
        return viaje.viaje_id;
      case "fecha_viaje":
        return new Date(viaje.fecha_viaje).toLocaleDateString("es-HN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
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
        return new Date(viaje.created_at).toLocaleTimeString("es-HN", {
          hour: "2-digit",
          minute: "2-digit",
        });
      case "hora_fin":
        return new Date(viaje.updated_at).toLocaleTimeString("es-HN", {
          hour: "2-digit",
          minute: "2-digit",
        });
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

  const ordenarPor = (columnaId: string) => {
    setOrdenamiento((prev) => ({
      columna: columnaId,
      direccion:
        prev.columna === columnaId && prev.direccion === "asc" ? "desc" : "asc",
    }));
  };

  const viajesOrdenados = [...viajes].sort((a, b) => {
    const valorA = obtenerValorCelda(a, ordenamiento.columna);
    const valorB = obtenerValorCelda(b, ordenamiento.columna);

    if (typeof valorA === "number" && typeof valorB === "number") {
      return ordenamiento.direccion === "asc"
        ? valorA - valorB
        : valorB - valorA;
    }

    const strA = String(valorA).toLowerCase();
    const strB = String(valorB).toLowerCase();

    if (ordenamiento.direccion === "asc") {
      return strA < strB ? -1 : strA > strB ? 1 : 0;
    } else {
      return strA > strB ? -1 : strA < strB ? 1 : 0;
    }
  });

  const getEstadoBadgeClasses = (porcentaje: number) => {
    if (porcentaje === 100)
      return "bg-green-100 text-green-800 border-green-200";
    if (porcentaje >= 80)
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              {columnas.map((columna) => (
                <th
                  key={columna.id}
                  onClick={() => ordenarPor(columna.id)}
                  className="px-4 py-4 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors select-none whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    <span>{columna.nombre}</span>
                    {ordenamiento.columna === columna.id && (
                      <span className="text-blue-600 text-xs">
                        {ordenamiento.direccion === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {viajesOrdenados.map((viaje) => (
              <tr
                key={viaje.viaje_id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                {columnas.map((columna) => (
                  <td key={columna.id} className="px-4 py-4 text-gray-700">
                    {columna.id === "porcentaje_exito" ? (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getEstadoBadgeClasses(
                          viaje.estadisticas.porcentaje_exito
                        )}`}
                      >
                        {obtenerValorCelda(viaje, columna.id)}
                      </span>
                    ) : columna.id === "piloto" ? (
                      <div className="flex items-center gap-2">
                        <span className="text-base">👨‍✈️</span>
                        <span className="font-medium">
                          {obtenerValorCelda(viaje, columna.id)}
                        </span>
                      </div>
                    ) : columna.id === "numero_vehiculo" ? (
                      <div className="flex items-center gap-2">
                        <span className="text-base">🚛</span>
                        <span className="font-medium">
                          {obtenerValorCelda(viaje, columna.id)}
                        </span>
                      </div>
                    ) : (
                      obtenerValorCelda(viaje, columna.id)
                    )}
                  </td>
                ))}
                <td className="px-4 py-4">
                  <button
                    onClick={() => onVerDetalle(viaje)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-all hover:-translate-y-0.5 whitespace-nowrap"
                  >
                    👁️ Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaViajes;
