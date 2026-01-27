// ============================================
// FRONTEND - MODAL MIGRACIÓN DE PILOTO (JSX)
// ============================================

import React, { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  Loader2,
} from "lucide-react";

const MigrarPilotoModal = ({ usuario, onClose, onSuccess }) => {
  const [pilotosSql, setPilotosSql] = useState([]);
  const [pilotoSeleccionado, setPilotoSeleccionado] = useState("");
  const [desactivarTemporal, setDesactivarTemporal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingPilotos, setLoadingPilotos] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  // Cargar pilotos de SQL Server al montar el componente
  useEffect(() => {
    cargarPilotosSQL();
  }, []);

  const cargarPilotosSQL = async () => {
    try {
      setLoadingPilotos(true);
      const token = localStorage.getItem("sivec_token"); // Corregido: sivec_token
      const response = await fetch("http://localhost:3000/api/pilotos/sql", {
        // URL completa
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar pilotos de Redis");
      }

      const data = await response.json();
      console.log("Pilotos SQL cargados:", data);
      setPilotosSql(data.pilotos || []);
    } catch (err) {
      console.error("❌ Error cargando pilotos SQL:", err);
      setError("No se pudieron cargar los pilotos del sistema principal");
    } finally {
      setLoadingPilotos(false);
    }
  };

  // ==========================================
  // MigrarPilotoModal.jsx - handleMigrar CORREGIDO
  // ==========================================

  const handleMigrar = async () => {
    if (!pilotoSeleccionado) {
      setError("Debe seleccionar un piloto permanente");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = `http://localhost:3000/api/usuarios/${usuario.usuario_id}/migrar-piloto`;
      const token = localStorage.getItem("sivec_token");

      const body = {
        piloto_sql_id: parseInt(pilotoSeleccionado),
        desactivar_temporal: desactivarTemporal,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          throw new Error(
            `Error del servidor (${response.status}): ${responseText}`
          );
        }
        throw new Error(errorData.error || "Error al migrar piloto");
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error("Respuesta del servidor no es JSON válido");
      }

      console.log("✅ Migración exitosa, datos:", data);

      // ✅ IMPORTANTE: Pasar los datos a onSuccess
      onSuccess(data);
      onClose();
    } catch (err) {
      console.error("❌ ERROR EN MIGRACIÓN:", err);
      setError(err.message || "Error al migrar piloto");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar pilotos por búsqueda
  const pilotosFiltrados = pilotosSql.filter((piloto) =>
    piloto.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Buscar si el nombre del temporal coincide con algún piloto SQL (sugerencia inteligente)
  const pilotoSugerido =
    usuario.piloto_temporal &&
    pilotosSql.find(
      (p) =>
        p.nombre.toLowerCase() === usuario.piloto_temporal.nombre.toLowerCase()
    );

  useEffect(() => {
    if (pilotoSugerido && !pilotoSeleccionado) {
      setPilotoSeleccionado(pilotoSugerido.piloto_id.toString());
    }
  }, [pilotoSugerido, pilotoSeleccionado]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-madeyso-green-100 dark:bg-blue-900/30 rounded-lg">
              <UserCheck className="w-6 h-6 text-madeyso-primary dark:text-madeyso-primary-light" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                Migrar Piloto a Permanente
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Cambiar de piloto temporal a piloto del sistema principal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información del Usuario */}
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
            <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              Información Actual
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-slate-400">
                  Usuario:
                </span>
                <span className="font-medium text-gray-900 dark:text-slate-100">
                  {usuario.nombre_usuario}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-slate-400">
                  Correo:
                </span>
                <span className="font-medium text-gray-900 dark:text-slate-100">
                  {usuario.correo}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-slate-400">
                  Piloto Temporal:
                </span>
                <span className="font-medium text-madeyso-primary dark:text-madeyso-primary-light">
                  {usuario.piloto_temporal?.nombre || "N/A"}
                </span>
              </div>
              {usuario.piloto_temporal?.notas && (
                <div className="mt-2 pt-2 border-t border-gray-300 dark:border-slate-600">
                  <span className="text-gray-600 dark:text-slate-400 text-xs">
                    Notas:
                  </span>
                  <p className="text-gray-700 dark:text-slate-300 text-xs mt-1">
                    {usuario.piloto_temporal.notas}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Alerta de Sugerencia Inteligente */}
          {pilotoSugerido && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-green-900">
                  Coincidencia Detectada
                </p>
                <p className="text-green-700 mt-1">
                  Se encontró un piloto permanente con el mismo nombre:{" "}
                  <strong>{pilotoSugerido.nombre}</strong> (ID:{" "}
                  {pilotoSugerido.piloto_id})
                </p>
                <p className="text-green-600 text-xs mt-1">
                  ✓ Se ha seleccionado automáticamente
                </p>
              </div>
            </div>
          )}

          {/* Selección de Piloto Permanente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Seleccione Piloto Permanente (Sistema Principal)
              <span className="text-red-500 ml-1">*</span>
            </label>

            {/* Búsqueda */}
            <input
              type="text"
              placeholder="Buscar piloto por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-madeyso-primary dark:bg-slate-700 dark:text-slate-100"
              disabled={loadingPilotos || loading}
            />

            {loadingPilotos ? (
              <div className="flex items-center justify-center py-8 text-gray-500 dark:text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Cargando pilotos del sistema principal...</span>
              </div>
            ) : pilotosSql.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-slate-500" />
                <p>No hay pilotos activos en el sistema principal</p>
              </div>
            ) : (
              <div className="border border-gray-300 dark:border-slate-600 rounded-lg max-h-64 overflow-y-auto">
                {pilotosFiltrados.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 dark:text-slate-400 text-sm">
                    No se encontraron pilotos con ese nombre
                  </div>
                ) : (
                  pilotosFiltrados.map((piloto) => (
                    <label
                      key={piloto.piloto_id}
                      className={`flex items-center gap-3 p-3 border-b border-gray-200 dark:border-slate-600 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                        pilotoSeleccionado === piloto.piloto_id.toString()
                          ? "bg-madeyso-green-50 dark:bg-blue-900/20"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="piloto_sql"
                        value={piloto.piloto_id}
                        checked={
                          pilotoSeleccionado === piloto.piloto_id.toString()
                        }
                        onChange={(e) => setPilotoSeleccionado(e.target.value)}
                        className="w-4 h-4 text-madeyso-primary"
                        disabled={loading}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-slate-100">
                          {piloto.nombre}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          ID: {piloto.piloto_id}
                        </p>
                      </div>
                      {piloto.piloto_id.toString() === pilotoSeleccionado && (
                        <CheckCircle2 className="w-5 h-5 text-madeyso-primary dark:text-madeyso-primary-light" />
                      )}
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Opción de Desactivar Temporal */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <input
              type="checkbox"
              id="desactivar_temporal"
              checked={desactivarTemporal}
              onChange={(e) => setDesactivarTemporal(e.target.checked)}
              className="w-4 h-4 text-madeyso-primary mt-1"
              disabled={loading}
            />
            <label
              htmlFor="desactivar_temporal"
              className="text-sm text-gray-700 cursor-pointer"
            >
              <span className="font-semibold">Desactivar piloto temporal</span>
              <p className="text-gray-600 mt-1">
                El piloto temporal será marcado como inactivo pero se mantendrá
                en el sistema para mantener el histórico de viajes.
              </p>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Advertencia */}
          <div className="bg-madeyso-green-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">
              ⚠️ Importante:
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>
                • Los viajes pasados mantendrán la referencia al piloto temporal
                (histórico)
              </li>
              <li>
                • Los viajes futuros se vincularán con el piloto permanente
              </li>
              <li>
                • El usuario mantendrá sus credenciales de acceso (mismo correo
                y contraseña)
              </li>
              <li>• Esta acción quedará registrada en los logs del sistema</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-600 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleMigrar}
            disabled={loading || !pilotoSeleccionado || loadingPilotos}
            className="px-4 py-2 bg-madeyso-primary-dark text-white rounded-lg hover:bg-madeyso-green-700 disabled:bg-gray-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Migrando...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                Confirmar Migración
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MigrarPilotoModal;
