import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

interface PilotoTemporal {
  piloto_temporal_id: number;
  nombre: string;
  activo: boolean;
  creado_por: number;
  fecha_creacion: string;
  notas: string | null;
}

const AdminPilotosTemporales: React.FC = () => {
  const { user } = useAuth();
  const [pilotos, setPilotos] = useState<PilotoTemporal[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pilotoEditando, setPilotoEditando] = useState<PilotoTemporal | null>(
    null
  );
  const [formulario, setFormulario] = useState({
    nombre: "",
    notas: "",
  });

  // Verificar que sea admin
  useEffect(() => {
    if (user?.rol_id !== 3) {
      window.location.href = "/dashboard";
      return;
    }
    cargarPilotos();
  }, [user]);

  const cargarPilotos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("sivec_token");
      const response = await fetch(
        "http://localhost:3000/api/pilotos-temporales",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();

      if (data.success) {
        setPilotos(data.data);
      }
    } catch (error) {
      console.error("Error cargando pilotos temporales:", error);
      alert("Error al cargar pilotos temporales");
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setFormulario({ nombre: "", notas: "" });
    setPilotoEditando(null);
    setMostrarFormulario(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formulario.nombre.trim()) {
      alert("El nombre es requerido");
      return;
    }

    try {
      const token = localStorage.getItem("sivec_token");
      const url = pilotoEditando
        ? `http://localhost:3000/api/pilotos-temporales/${pilotoEditando.piloto_temporal_id}`
        : "http://localhost:3000/api/pilotos-temporales";

      const method = pilotoEditando ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formulario),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          pilotoEditando
            ? "Piloto actualizado exitosamente"
            : "Piloto temporal creado exitosamente"
        );
        limpiarFormulario();
        cargarPilotos();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  const handleEditar = (piloto: PilotoTemporal) => {
    setPilotoEditando(piloto);
    setFormulario({
      nombre: piloto.nombre,
      notas: piloto.notas || "",
    });
    setMostrarFormulario(true);
  };

  const handleToggleActivo = async (piloto: PilotoTemporal) => {
    try {
      const token = localStorage.getItem("sivec_token");
      const response = await fetch(
        `http://localhost:3000/api/pilotos-temporales/${piloto.piloto_temporal_id}/toggle`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(
          `Piloto ${piloto.activo ? "desactivado" : "activado"} exitosamente`
        );
        cargarPilotos();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando pilotos temporales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => window.history.back()}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                ← Volver
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Pilotos Temporales
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              {pilotos.filter((p) => p.activo).length} activos de{" "}
              {pilotos.length} total
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Botón crear */}
        <div className="mb-6">
          <button
            onClick={() => {
              limpiarFormulario();
              setMostrarFormulario(true);
            }}
            className="btn-primary"
          >
            + Crear Piloto Temporal
          </button>
        </div>

        {/* Formulario */}
        {mostrarFormulario && (
          <div className="card p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {pilotoEditando
                ? "Editar Piloto Temporal"
                : "Crear Piloto Temporal"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Ej: Juan Pérez"
                    value={formulario.nombre}
                    onChange={(e) =>
                      setFormulario({ ...formulario, nombre: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Observaciones"
                    value={formulario.notas}
                    onChange={(e) =>
                      setFormulario({ ...formulario, notas: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Los pilotos temporales aparecerán en el
                  datalist cuando los jefes de yarda asignen facturas.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary">
                  {pilotoEditando ? "Actualizar" : "Crear"} Piloto
                </button>
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de pilotos */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Lista de Pilotos Temporales
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Notas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pilotos.map((piloto) => (
                  <tr
                    key={piloto.piloto_temporal_id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {piloto.nombre}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {piloto.piloto_temporal_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          piloto.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {piloto.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(piloto.fecha_creacion).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {piloto.notas || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditar(piloto)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleActivo(piloto)}
                        className={
                          piloto.activo
                            ? "text-red-600 hover:text-red-900"
                            : "text-green-600 hover:text-green-900"
                        }
                      >
                        {piloto.activo ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPilotosTemporales;
