import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Icons } from "../components/icons/IconMap";
import FormularioPilotoTemporal from "../components/FormularioPilotoTemporal";
import { useConfirm } from "../hooks/useConfirm";
import { ConfirmDialog } from "../hooks/ConfirmDialog";
import { useNotification } from "../hooks/useNotification";

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

  const { confirm, isOpen, options, handleConfirm, handleCancel } =
    useConfirm();
  const noti = useNotification();

  useEffect(() => {
    if (user?.rol_id !== 3) {
      window.location.href = "/home";
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
      noti.error({
        title: "Error",
        message: "No se pudieron cargar los pilotos temporales",
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setPilotoEditando(null);
    setMostrarFormulario(false);
  };

  const handleSubmit = async (formulario: {
    nombre: string;
    notas: string;
  }) => {
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
        noti.success({
          title: pilotoEditando ? "Piloto actualizado" : "Piloto creado",
          message: pilotoEditando
            ? "El piloto temporal se actualizó correctamente"
            : "El piloto temporal se creó correctamente",
        });
        limpiarFormulario();
        cargarPilotos();
      } else {
        noti.error({
          title: "Error",
          message: data.error || "Ocurrió un error al procesar la solicitud",
        });
      }
    } catch (error: any) {
      noti.error({
        title: "Error",
        message: error.message || "Ocurrió un error inesperado",
      });
      throw error;
    }
  };

  const handleEditar = (piloto: PilotoTemporal) => {
    setPilotoEditando(piloto);
    setMostrarFormulario(true);
  };

  const handleToggleActivo = async (piloto: PilotoTemporal) => {
    // ✅ Si está intentando ACTIVAR un piloto inactivo, verificar si fue migrado
    if (!piloto.activo) {
      // Verificar si las notas indican que fue migrado
      if (piloto.notas && piloto.notas.includes("Migrado a piloto SQL ID")) {
        // Extraer el SQL ID de las notas
        const match = piloto.notas.match(/SQL ID (\d+)/);
        const sqlId = match ? match[1] : "desconocido";

        noti.error({
          title: "No se puede activar",
          message: `El piloto "${piloto.nombre}" fue migrado a piloto permanente (SQL ID: ${sqlId}). No es posible reactivarlo como piloto temporal.`,
        });
        return; // Detener la ejecución
      }
    }

    const confirmed = await confirm({
      title: piloto.activo ? "¿Desactivar piloto?" : "¿Activar piloto?",
      message: piloto.activo
        ? `¿Estás seguro de que deseas desactivar al piloto "${piloto.nombre}"?`
        : `¿Estás seguro de que deseas activar al piloto "${piloto.nombre}"?`,
      confirmText: piloto.activo ? "Sí, desactivar" : "Sí, activar",
      cancelText: "Cancelar",
      variant: piloto.activo ? "danger" : "warning",
    });

    if (!confirmed) return;

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
        noti.success({
          title: piloto.activo ? "Piloto desactivado" : "Piloto activado",
          message: `El piloto ${piloto.nombre} fue ${
            piloto.activo ? "desactivado" : "activado"
          } correctamente`,
        });
        cargarPilotos();
      } else {
        noti.error({
          title: "Error",
          message: data.error || "Ocurrió un error al cambiar el estado",
        });
      }
    } catch (error: any) {
      noti.error({
        title: "Error",
        message: error.message || "Ocurrió un error inesperado",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Icons.refresh className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-slate-400">
            Cargando pilotos temporales...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
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
              <Icons.users className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                Pilotos Temporales
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-lg font-semibold">
                {pilotos.filter((p) => p.activo).length} activos
              </span>
              <span className="text-gray-500 dark:text-slate-400">de</span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300 rounded-lg font-semibold">
                {pilotos.length} total
              </span>
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
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
          >
            <Icons.plus className="w-5 h-5" />
            Crear Piloto Temporal
          </button>
        </div>

        <FormularioPilotoTemporal
          isOpen={mostrarFormulario}
          onClose={limpiarFormulario}
          pilotoEditando={pilotoEditando}
          onSubmit={handleSubmit}
        />

        <ConfirmDialog
          isOpen={isOpen}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          {...options}
        />

        {/* Lista de pilotos */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <Icons.users className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              Lista de Pilotos Temporales
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                    Notas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {pilotos.map((piloto) => (
                  <tr
                    key={piloto.piloto_temporal_id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Icons.user className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-slate-100">
                            {piloto.nombre}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-slate-400">
                            ID: {piloto.piloto_temporal_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          piloto.activo
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                        }`}
                      >
                        {piloto.activo ? (
                          <Icons.checkCircle className="w-3 h-3" />
                        ) : (
                          <Icons.xCircle className="w-3 h-3" />
                        )}
                        {piloto.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Icons.calendar className="w-4 h-4" />
                        {new Date(piloto.fecha_creacion).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                      {piloto.notas || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditar(piloto)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                      >
                        <Icons.edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleActivo(piloto)}
                        className={`transition-colors inline-flex items-center gap-1 ${
                          piloto.activo
                            ? "text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            : "text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                        }`}
                      >
                        {piloto.activo ? (
                          <>
                            <Icons.xCircle className="w-4 h-4" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <Icons.checkCircle className="w-4 h-4" />
                            Activar
                          </>
                        )}
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