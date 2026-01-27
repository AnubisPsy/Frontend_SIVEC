// src/components/FormularioUsuario.tsx
import React, { useState, useEffect } from "react";
import { Icons } from "./icons/IconMap";
import Modal from "./Modal";

interface FormularioUsuarioData {
  nombre_usuario: string;
  correo: string;
  password: string;
  rol_id: number;
  sucursal_id: number;
  piloto_sql_id: number | null;
  piloto_temporal_id: number | null;
  activo?: boolean;
}

interface UsuarioConPiloto {
  usuario_id: number;
  nombre_usuario: string;
  correo: string;
  rol_id: number;
  sucursal_id: number;
  piloto_sql_id: number | null;
  piloto_temporal_id: number | null;
  activo?: boolean;
  piloto_vinculado?: {
    nombre: string;
    tipo: string;
    id: number;
  } | null;
}

interface Piloto {
  nombre_piloto: string;
  es_temporal: boolean;
  piloto_temporal_id?: number;
  piloto_id?: number;
  fuente: string;
  migrado?: boolean; // ✅ Campo para identificar si fue migrado
}

interface Sucursal {
  sucursal_id: number;
  nombre_sucursal: string;
}

interface FormularioUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioEditando: UsuarioConPiloto | null;
  onSubmit: (formulario: FormularioUsuarioData) => Promise<void>;
  sucursales: Sucursal[];
  pilotos: Piloto[];
  loadingPilotos: boolean;
}

const ROLES = [
  { id: 1, nombre: "Piloto" },
  { id: 2, nombre: "Jefe de Yarda" },
  { id: 3, nombre: "Administrador" },
];

const FormularioUsuario: React.FC<FormularioUsuarioProps> = ({
  isOpen,
  onClose,
  usuarioEditando,
  onSubmit,
  sucursales,
  pilotos,
  loadingPilotos,
}) => {
  const [formulario, setFormulario] = useState<FormularioUsuarioData>({
    nombre_usuario: "",
    correo: "",
    password: "",
    rol_id: 1,
    sucursal_id: 1,
    piloto_sql_id: null,
    piloto_temporal_id: null,
  });

  const [tipoVinculacion, setTipoVinculacion] = useState<
    "ninguno" | "sql" | "temporal"
  >("ninguno");

  const [loading, setLoading] = useState(false);

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen && usuarioEditando) {
      setFormulario({
        nombre_usuario: usuarioEditando.nombre_usuario,
        correo: usuarioEditando.correo,
        password: "", // No cargar password al editar
        rol_id: usuarioEditando.rol_id,
        sucursal_id: usuarioEditando.sucursal_id,
        piloto_sql_id: usuarioEditando.piloto_sql_id,
        piloto_temporal_id: usuarioEditando.piloto_temporal_id,
        activo: usuarioEditando.activo,
      });

      // Detectar tipo de vinculación
      if (usuarioEditando.piloto_sql_id) {
        setTipoVinculacion("sql");
      } else if (usuarioEditando.piloto_temporal_id) {
        setTipoVinculacion("temporal");
      } else {
        setTipoVinculacion("ninguno");
      }
    } else if (isOpen) {
      // Limpiar formulario en modo crear
      setFormulario({
        nombre_usuario: "",
        correo: "",
        password: "",
        rol_id: 1,
        sucursal_id: 1,
        piloto_sql_id: null,
        piloto_temporal_id: null,
      });
      setTipoVinculacion("ninguno");
    }
  }, [isOpen, usuarioEditando]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formulario);
      // El componente padre cerrará el modal después del éxito
    } catch (error) {
      // El error se maneja en el componente padre
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleTipoVinculacionChange = (
    tipo: "ninguno" | "sql" | "temporal"
  ) => {
    setTipoVinculacion(tipo);
    if (tipo === "ninguno") {
      setFormulario({
        ...formulario,
        piloto_sql_id: null,
        piloto_temporal_id: null,
      });
    } else if (tipo === "sql") {
      setFormulario({
        ...formulario,
        piloto_sql_id: null,
        piloto_temporal_id: null,
      });
    } else if (tipo === "temporal") {
      setFormulario({
        ...formulario,
        piloto_sql_id: null,
        piloto_temporal_id: null,
      });
    }
  };

  const pilotosSQL = pilotos.filter((p) => !p.es_temporal && p.piloto_id);
  // ✅ Filtrar pilotos temporales que NO estén migrados
  const pilotosTemporales = pilotos.filter(
    (p) => p.es_temporal && p.piloto_temporal_id && !p.migrado
  );

  const esRolPiloto = formulario.rol_id === 1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={usuarioEditando ? "Editar Usuario" : "Crear Usuario"}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre de Usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Icons.user className="w-4 h-4" />
              Nombre de Usuario <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={loading}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-madeyso-primary dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Ej: juan.perez"
              value={formulario.nombre_usuario}
              onChange={(e) =>
                setFormulario({ ...formulario, nombre_usuario: e.target.value })
              }
            />
          </div>

          {/* Correo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Icons.mail className="w-4 h-4" />
              Correo Electrónico{" "}
              {formulario.rol_id !== 1 && (
                <span className="text-red-500">*</span>
              )}
            </label>
            <input
              type="email"
              required={formulario.rol_id !== 1}
              disabled={loading}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-madeyso-primary dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={
                formulario.rol_id === 1
                  ? "Opcional para pilotos"
                  : "usuario@ejemplo.com"
              }
              value={formulario.correo}
              onChange={(e) =>
                setFormulario({ ...formulario, correo: e.target.value })
              }
            />
            {formulario.rol_id === 1 && (
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Si no se proporciona, se generará automáticamente
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Icons.lock className="w-4 h-4" />
              Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required={!usuarioEditando}
              disabled={loading}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-madeyso-primary dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={
                usuarioEditando
                  ? "Dejar vacío para no cambiar"
                  : "Contraseña segura"
              }
              value={formulario.password}
              onChange={(e) =>
                setFormulario({ ...formulario, password: e.target.value })
              }
            />
            {usuarioEditando && (
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Solo completa si deseas cambiar la contraseña
              </p>
            )}
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Icons.shield className="w-4 h-4" />
              Rol <span className="text-red-500">*</span>
            </label>
            <select
              required
              disabled={loading}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-madeyso-primary dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              value={formulario.rol_id}
              onChange={(e) =>
                setFormulario({ ...formulario, rol_id: Number(e.target.value) })
              }
            >
              {ROLES.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {rol.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Sucursal */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Icons.building className="w-4 h-4" />
              Sucursal <span className="text-red-500">*</span>
            </label>
            <select
              required
              disabled={loading}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-madeyso-primary dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              value={formulario.sucursal_id}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  sucursal_id: Number(e.target.value),
                })
              }
            >
              {sucursales.map((sucursal) => (
                <option key={sucursal.sucursal_id} value={sucursal.sucursal_id}>
                  {sucursal.nombre_sucursal}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vinculación con Piloto */}
        {esRolPiloto && (
          <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-madeyso-primary-dark dark:bg-madeyso-primary rounded-lg flex items-center justify-center">
                <Icons.truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-slate-100">
                  Vinculación con Piloto
                </h4>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Asocia este usuario con un piloto existente
                </p>
              </div>
            </div>

            {/* Tipo de vinculación */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Tipo de vinculación
              </label>

              <div className="space-y-2">
                {/* Sin vinculación */}
                <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-400 dark:hover:border-madeyso-primary transition-all">
                  <input
                    type="radio"
                    name="tipo_vinculacion"
                    checked={tipoVinculacion === "ninguno"}
                    disabled={loading}
                    onChange={() => handleTipoVinculacionChange("ninguno")}
                    className="w-4 h-4 text-madeyso-primary"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      Sin vinculación
                    </span>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Usuario no asociado a ningún piloto
                    </p>
                  </div>
                </label>

                {/* Piloto SQL */}
                <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-400 dark:hover:border-madeyso-primary transition-all">
                  <input
                    type="radio"
                    name="tipo_vinculacion"
                    checked={tipoVinculacion === "sql"}
                    disabled={loading}
                    onChange={() => handleTipoVinculacionChange("sql")}
                    className="w-4 h-4 text-madeyso-primary"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-slate-100 flex items-center gap-2">
                      Piloto Regular (SQL)
                      <span className="px-2 py-0.5 bg-madeyso-green-100 dark:bg-blue-900/30 text-blue-800 dark:text-madeyso-primary-light rounded text-xs">
                        {pilotosSQL.length} disponibles
                      </span>
                    </span>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Pilotos permanentes de la empresa
                    </p>
                  </div>
                </label>

                {/* Piloto Temporal */}
                <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-400 dark:hover:border-madeyso-primary transition-all">
                  <input
                    type="radio"
                    name="tipo_vinculacion"
                    checked={tipoVinculacion === "temporal"}
                    disabled={loading}
                    onChange={() => handleTipoVinculacionChange("temporal")}
                    className="w-4 h-4 text-madeyso-primary"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-slate-100 flex items-center gap-2">
                      Piloto Temporal
                      <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded text-xs">
                        {pilotosTemporales.length} disponibles
                      </span>
                    </span>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Pilotos eventuales o por temporada
                    </p>
                  </div>
                </label>
              </div>

              {/* Select de Piloto SQL */}
              {tipoVinculacion === "sql" && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Seleccionar Piloto Regular
                  </label>
                  {loadingPilotos ? (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <Icons.refresh className="w-4 h-4 text-madeyso-primary animate-spin" />
                      <span className="text-sm text-gray-600 dark:text-slate-400">
                        Cargando pilotos...
                      </span>
                    </div>
                  ) : (
                    <select
                      disabled={loading}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-madeyso-primary dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      value={formulario.piloto_sql_id || ""}
                      onChange={(e) =>
                        setFormulario({
                          ...formulario,
                          piloto_sql_id: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    >
                      <option value="">Seleccionar piloto...</option>
                      {pilotosSQL.map((piloto) => (
                        <option key={piloto.piloto_id} value={piloto.piloto_id}>
                          {piloto.nombre_piloto}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Select de Piloto Temporal */}
              {tipoVinculacion === "temporal" && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Seleccionar Piloto Temporal
                  </label>
                  {loadingPilotos ? (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <Icons.refresh className="w-4 h-4 text-madeyso-primary animate-spin" />
                      <span className="text-sm text-gray-600 dark:text-slate-400">
                        Cargando pilotos...
                      </span>
                    </div>
                  ) : (
                    <select
                      disabled={loading}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-madeyso-primary dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      value={formulario.piloto_temporal_id || ""}
                      onChange={(e) =>
                        setFormulario({
                          ...formulario,
                          piloto_temporal_id: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    >
                      <option value="">Seleccionar piloto...</option>
                      {pilotosTemporales.map((piloto) => (
                        <option
                          key={piloto.piloto_temporal_id}
                          value={piloto.piloto_temporal_id}
                        >
                          {piloto.nombre_piloto}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Advertencia */}
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Icons.alert className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-yellow-800 dark:text-yellow-300">
                    <p className="font-medium mb-1">Importante:</p>
                    <p>
                      Cada piloto solo puede tener un usuario asignado. Si
                      vinculas este usuario a un piloto que ya tiene cuenta, el
                      piloto solo puede tener un usuario asignado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-madeyso-primary-dark hover:bg-madeyso-green-700 dark:bg-madeyso-primary-dark dark:hover:bg-madeyso-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Icons.refresh className="w-4 h-4 animate-spin" />
                {usuarioEditando ? "Actualizando..." : "Creando..."}
              </>
            ) : (
              <>
                <Icons.save className="w-4 h-4" />
                {usuarioEditando ? "Actualizar" : "Crear"} Usuario
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-6 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icons.x className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FormularioUsuario;
