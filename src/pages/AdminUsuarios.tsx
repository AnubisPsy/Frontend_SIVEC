// src/pages/AdminUsuarios.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usuariosApi, Usuario } from "../services/api";
import { Icons } from "../components/icons/IconMap";
import { useConfirm } from "../hooks/useConfirm";
import { ConfirmDialog } from "../hooks/ConfirmDialog";
import { useNotification } from "../hooks/useNotification";

interface FormularioUsuario {
  nombre_usuario: string;
  correo: string;
  password: string;
  rol_id: number;
  sucursal_id: number;
  piloto_sql_id: number | null;
  piloto_temporal_id: number | null;
  activo?: boolean;
}

interface Piloto {
  nombre_piloto: string;
  es_temporal: boolean;
  piloto_temporal_id?: number;
  piloto_id?: number;
  fuente: string;
}

interface UsuarioConPiloto extends Usuario {
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

const ROLES = [
  { id: 1, nombre: "Piloto" },
  { id: 2, nombre: "Jefe de Yarda" },
  { id: 3, nombre: "Administrador" },
];

const AdminUsuarios: React.FC = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioConPiloto[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] =
    useState<UsuarioConPiloto | null>(null);
  const [formulario, setFormulario] = useState<FormularioUsuario>({
    nombre_usuario: "",
    correo: "",
    password: "",
    rol_id: 1,
    sucursal_id: 1,
    piloto_sql_id: null,
    piloto_temporal_id: null,
  });

  const { confirm, isOpen, options, handleConfirm, handleCancel } =
    useConfirm();

  const noti = useNotification();

  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const [sucursales, setSucursales] = useState<
    Array<{ sucursal_id: number; nombre_sucursal: string }>
  >([]);

  const [pilotos, setPilotos] = useState<Piloto[]>([]);
  const [loadingPilotos, setLoadingPilotos] = useState(false);
  const [tipoVinculacion, setTipoVinculacion] = useState<
    "ninguno" | "sql" | "temporal"
  >("ninguno");

  useEffect(() => {
    if (user?.rol_id !== 3) {
      window.location.href = "/dashboard";
      return;
    }
    cargarUsuarios();
    cargarSucursales();
    cargarPilotos();
  }, [user]);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const response = await usuariosApi.obtenerTodos();
      if (response.data.success) {
        setUsuarios(response.data.data as UsuarioConPiloto[]);
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      alert("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const cargarSucursales = async () => {
    try {
      const token = localStorage.getItem("sivec_token");
      const response = await fetch("http://localhost:3000/api/sucursales", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setSucursales(data.data || []);
    } catch (error) {
      console.error("Error cargando sucursales:", error);
      setSucursales([{ sucursal_id: 1, nombre_sucursal: "SATUYE" }]);
    }
  };

  const cargarPilotos = async () => {
    setLoadingPilotos(true);
    try {
      const token = localStorage.getItem("sivec_token");
      const response = await fetch("http://localhost:3000/api/pilotos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setPilotos(data.data);
        console.log("✅ Pilotos cargados:", data.data.length);
      }
    } catch (error) {
      console.error("Error cargando pilotos:", error);
    } finally {
      setLoadingPilotos(false);
    }
  };

  const limpiarFormulario = () => {
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
    setUsuarioEditando(null);
    setMostrarFormulario(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formulario.nombre_usuario || !formulario.password) {
      alert("Nombre de usuario y contraseña son requeridos");
      return;
    }

    if (formulario.rol_id !== 1 && !formulario.correo) {
      alert("El correo es requerido para jefes y administradores");
      return;
    }

    const datosUsuario = {
      ...formulario,
      correo: formulario.correo || `${formulario.nombre_usuario}@temp.local`,
    };

    try {
      if (usuarioEditando) {
        await usuariosApi.actualizar(usuarioEditando.usuario_id, datosUsuario);
        alert("Usuario actualizado exitosamente");
      } else {
        await usuariosApi.crear(datosUsuario);
        alert("Usuario creado exitosamente");
      }

      limpiarFormulario();
      cargarUsuarios();
    } catch (error: any) {
      alert("Error: " + (error.response?.data?.error || error.message));
    }
  };

  const handleEditar = (usuario: UsuarioConPiloto) => {
    setUsuarioEditando(usuario);

    let tipo: "ninguno" | "sql" | "temporal" = "ninguno";
    if (usuario.piloto_sql_id) tipo = "sql";
    else if (usuario.piloto_temporal_id) tipo = "temporal";

    setTipoVinculacion(tipo);

    setFormulario({
      nombre_usuario: usuario.nombre_usuario,
      correo: usuario.correo,
      password: "",
      rol_id: usuario.rol_id,
      sucursal_id: usuario.sucursal_id || 1,
      piloto_sql_id: usuario.piloto_sql_id || null,
      piloto_temporal_id: usuario.piloto_temporal_id || null,
    });
    setMostrarFormulario(true);
  };

  const handleEliminar = async (usuario: UsuarioConPiloto) => {
    const confirmed = await confirm({
      title: "¿Eliminar usuario?",
      message: `¿Estás seguro de que deseas eliminar al usuario "${usuario.nombre_usuario}"? Esta acción no se puede deshacer.`,
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await usuariosApi.eliminar(usuario.usuario_id);

      noti.success({
        title: "Usuario eliminado",
        message: "El usuario ha sido eliminado exitosamente",
      });

      cargarUsuarios();
    } catch (error: any) {
      noti.error({
        title: "Error al eliminar",
        message:
          error.response?.data?.error ||
          error.message ||
          "No se pudo eliminar el usuario",
      });
    }
  };

  const handleReactivar = async (usuario: UsuarioConPiloto) => {
    const confirmed = await confirm({
      title: "¿Reactivar usuario?",
      message: `¿Estás seguro de que deseas reactivar al usuario "${usuario.nombre_usuario}"?`,
      confirmText: "Sí, reactivar",
      cancelText: "Cancelar",
      variant: "warning",
    });

    if (!confirmed) return;

    try {
      const datosActualizados: any = {
        nombre_usuario: usuario.nombre_usuario,
        correo: usuario.correo,
        rol_id: usuario.rol_id,
        sucursal_id: usuario.sucursal_id,
        piloto_sql_id: usuario.piloto_sql_id,
        piloto_temporal_id: usuario.piloto_temporal_id,
        activo: true,
      };

      await usuariosApi.actualizar(usuario.usuario_id, datosActualizados);

      noti.success({
        title: "Usuario reactivado",
        message: "El usuario ha sido reactivado exitosamente",
      });

      cargarUsuarios();
    } catch (error: any) {
      noti.error({
        title: "Error al reactivar",
        message:
          error.response?.data?.error ||
          error.message ||
          "No se pudo reactivar el usuario",
      });
    }
  };

  const handleTipoVinculacionChange = (
    tipo: "ninguno" | "sql" | "temporal"
  ) => {
    setTipoVinculacion(tipo);
    setFormulario({
      ...formulario,
      piloto_sql_id: null,
      piloto_temporal_id: null,
    });
  };

  const handlePilotoChange = (valor: string) => {
    if (tipoVinculacion === "sql") {
      setFormulario({
        ...formulario,
        piloto_sql_id: parseInt(valor) || null,
        piloto_temporal_id: null,
      });
    } else if (tipoVinculacion === "temporal") {
      setFormulario({
        ...formulario,
        piloto_sql_id: null,
        piloto_temporal_id: parseInt(valor) || null,
      });
    }
  };

  const getRolNombre = (rol_id: number) => {
    const rol = ROLES.find((r) => r.id === rol_id);
    return rol ? rol.nombre : `Rol ${rol_id}`;
  };

  const getRolBadge = (rol_id: number) => {
    const colors = {
      1: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      2: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      3: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[rol_id as keyof typeof colors] ||
          "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
        }`}
      >
        {getRolNombre(rol_id)}
      </span>
    );
  };

  const getPilotoBadge = (usuario: UsuarioConPiloto) => {
    if (!usuario.piloto_vinculado) {
      return (
        <span className="text-xs text-gray-400 dark:text-slate-500">
          Sin vincular
        </span>
      );
    }

    const { tipo, nombre } = usuario.piloto_vinculado;
    const color =
      tipo === "sql"
        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    const icono = tipo === "sql" ? "🔵" : "🟡";

    return (
      <span className={`px-2 py-1 rounded text-xs ${color}`}>
        {icono} {nombre}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Icons.refresh className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-slate-400">
            Cargando usuarios...
          </p>
        </div>
      </div>
    );
  }

  const pilotosSQL = pilotos.filter((p) => !p.es_temporal);
  const pilotosTemporales = pilotos.filter((p) => p.es_temporal);

  const usuariosFiltrados = mostrarInactivos
    ? usuarios
    : usuarios.filter((u) => u.activo !== false);

  const usuariosInactivos = usuarios.filter((u) => u.activo === false).length;

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
              <Icons.users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                Administración de Usuarios
              </h1>
            </div>
            <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-lg font-semibold text-sm">
              {usuarios.length} usuarios
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => {
              limpiarFormulario();
              setMostrarFormulario(true);
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
          >
            <Icons.plus className="w-5 h-5" />
            Crear Usuario
          </button>
        </div>

        {/* Formulario */}
        {mostrarFormulario && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 p-6 mb-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Icons.user className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                {usuarioEditando ? "Editar Usuario" : "Crear Nuevo Usuario"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <Icons.user className="w-4 h-4" />
                    Nombre de Usuario <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                    value={formulario.nombre_usuario}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        nombre_usuario: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <Icons.mail className="w-4 h-4" />
                    Correo{" "}
                    {formulario.rol_id !== 1 && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                    placeholder={
                      formulario.rol_id === 1
                        ? "Opcional para pilotos"
                        : "Requerido para jefes/admins"
                    }
                    value={formulario.correo}
                    onChange={(e) =>
                      setFormulario({ ...formulario, correo: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <Icons.lock className="w-4 h-4" />
                    Contraseña <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                    placeholder={
                      usuarioEditando
                        ? "Dejar vacío para mantener actual"
                        : "Contraseña"
                    }
                    value={formulario.password}
                    onChange={(e) =>
                      setFormulario({ ...formulario, password: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <Icons.settings className="w-4 h-4" />
                    Rol <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                    value={formulario.rol_id}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        rol_id: parseInt(e.target.value),
                      })
                    }
                  >
                    {ROLES.map((rol) => (
                      <option key={rol.id} value={rol.id}>
                        {rol.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <Icons.building className="w-4 h-4" />
                    Sucursal <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                    value={formulario.sucursal_id}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        sucursal_id: parseInt(e.target.value),
                      })
                    }
                  >
                    {sucursales.length === 0 ? (
                      <option>Cargando sucursales...</option>
                    ) : (
                      sucursales.map(
                        (sucursal: {
                          sucursal_id: number;
                          nombre_sucursal: string;
                        }) => (
                          <option
                            key={sucursal.sucursal_id}
                            value={sucursal.sucursal_id}
                          >
                            {sucursal.nombre_sucursal}
                          </option>
                        )
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* Vinculación de Piloto (solo si rol es Piloto) */}
              {formulario.rol_id === 1 && (
                <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
                  <h4 className="font-medium text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <Icons.navigation className="w-5 h-5" />
                    Vincular con Piloto (Opcional)
                  </h4>

                  <div className="space-y-3">
                    {/* Tipo de vinculación */}
                    <div className="flex gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="tipoVinculacion"
                          checked={tipoVinculacion === "ninguno"}
                          onChange={() =>
                            handleTipoVinculacionChange("ninguno")
                          }
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-slate-300">
                          ⚪ No vincular
                        </span>
                      </label>

                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="tipoVinculacion"
                          checked={tipoVinculacion === "sql"}
                          onChange={() => handleTipoVinculacionChange("sql")}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-slate-300">
                          🔵 Piloto SQL Server
                        </span>
                      </label>

                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="tipoVinculacion"
                          checked={tipoVinculacion === "temporal"}
                          onChange={() =>
                            handleTipoVinculacionChange("temporal")
                          }
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-slate-300">
                          🟡 Piloto Temporal
                        </span>
                      </label>
                    </div>

                    {/* Select de piloto según tipo */}
                    {tipoVinculacion === "sql" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Seleccionar Piloto SQL ({pilotosSQL.length}{" "}
                          disponibles)
                        </label>
                        <select
                          className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                          value={formulario.piloto_sql_id || ""}
                          onChange={(e) => handlePilotoChange(e.target.value)}
                        >
                          <option value="">-- Seleccionar --</option>
                          {loadingPilotos ? (
                            <option>Cargando...</option>
                          ) : (
                            pilotosSQL.map((piloto) => (
                              <option
                                key={piloto.piloto_id}
                                value={piloto.piloto_id}
                              >
                                {piloto.nombre_piloto}
                              </option>
                            ))
                          )}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                          Pilotos de SQL Server
                        </p>
                      </div>
                    )}

                    {tipoVinculacion === "temporal" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Seleccionar Piloto Temporal (
                          {pilotosTemporales.length} disponibles)
                        </label>
                        <select
                          className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                          value={formulario.piloto_temporal_id || ""}
                          onChange={(e) => handlePilotoChange(e.target.value)}
                        >
                          <option value="">-- Seleccionar --</option>
                          {loadingPilotos ? (
                            <option>Cargando...</option>
                          ) : (
                            pilotosTemporales.map((piloto) => (
                              <option
                                key={piloto.piloto_temporal_id}
                                value={piloto.piloto_temporal_id}
                              >
                                {piloto.nombre_piloto}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-3">
                    <div className="flex items-start gap-3">
                      <Icons.info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>Nota:</strong> La vinculación permite
                        identificar qué usuario corresponde a cada piloto. Un
                        piloto solo puede tener un usuario asignado.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <Icons.save className="w-4 h-4" />
                  {usuarioEditando ? "Actualizar" : "Crear"} Usuario
                </button>
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="px-6 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-all flex items-center gap-2"
                >
                  <Icons.x className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabla de usuarios */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <Icons.users className="w-5 h-5" />
                Usuarios del Sistema
              </h3>

              {/* Toggle para mostrar inactivos */}
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={mostrarInactivos}
                    onChange={(e) => setMostrarInactivos(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-900/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </div>
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-slate-100">
                  Mostrar inactivos
                  {usuariosInactivos > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 rounded-full text-xs">
                      {usuariosInactivos}
                    </span>
                  )}
                </span>
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                    Correo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                    Piloto Vinculado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500 dark:text-slate-400"
                    >
                      {mostrarInactivos
                        ? "No hay usuarios inactivos"
                        : "No hay usuarios activos"}
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((usuario) => (
                    <tr
                      key={usuario.usuario_id}
                      className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                        usuario.activo === false
                          ? "bg-gray-50 dark:bg-slate-700/30 opacity-60"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Icons.user className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-slate-100">
                              {usuario.nombre_usuario}
                              {usuario.activo === false && (
                                <span className="ml-2 text-xs text-gray-500 dark:text-slate-400">
                                  (Inactivo)
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-slate-400">
                              ID: {usuario.usuario_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-300">
                        {usuario.correo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRolBadge(usuario.rol_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPilotoBadge(usuario)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {usuario.activo === false ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            <Icons.xCircle className="w-3 h-3" />
                            Inactivo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <Icons.checkCircle className="w-3 h-3" />
                            Activo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {usuario.activo !== false ? (
                          <>
                            <button
                              onClick={() => handleEditar(usuario)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                            >
                              <Icons.edit className="w-4 h-4" />
                              Editar
                            </button>
                            {usuario.usuario_id !== user?.usuario_id && (
                              <button
                                onClick={() => handleEliminar(usuario)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors inline-flex items-center gap-1"
                              >
                                <Icons.trash className="w-4 h-4" />
                                Eliminar
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => handleReactivar(usuario)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 transition-colors inline-flex items-center gap-1"
                          >
                            <Icons.checkCircle className="w-4 h-4" />
                            Reactivar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={isOpen}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default AdminUsuarios;
