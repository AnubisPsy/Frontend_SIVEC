// src/pages/AdminUsuarios.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usuariosApi, Usuario } from "../services/api";
import { Icons } from "../components/icons/IconMap";
import { useConfirm } from "../hooks/useConfirm";
import { ConfirmDialog } from "../hooks/ConfirmDialog";
import { useNotification } from "../hooks/useNotification";
import FormularioUsuario from "../components/FormularioUsuario";

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

  const { confirm, isOpen, options, handleConfirm, handleCancel } =
    useConfirm();

  const noti = useNotification();

  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const [sucursales, setSucursales] = useState<
    Array<{ sucursal_id: number; nombre_sucursal: string }>
  >([]);

  const [pilotos, setPilotos] = useState<Piloto[]>([]);
  const [loadingPilotos, setLoadingPilotos] = useState(false);

  useEffect(() => {
    if (user?.rol_id !== 3) {
      window.location.href = "/home";
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
      // ✅ DESPUÉS:
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      noti.error({
        title: "Error",
        message: "No se pudieron cargar los usuarios",
      });
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
    setUsuarioEditando(null);
    setMostrarFormulario(false);
  };

  const handleSubmit = async (formulario: FormularioUsuario) => {
    // Validaciones se manejan en el formulario, pero por si acaso:
    if (!formulario.nombre_usuario || !formulario.password) {
      noti.warning({
        title: "Campos requeridos",
        message: "Nombre de usuario y contraseña son obligatorios",
      });
      throw new Error("Campos requeridos");
    }

    if (formulario.rol_id !== 1 && !formulario.correo) {
      noti.warning({
        title: "Campo requerido",
        message: "El correo es obligatorio para jefes y administradores",
      });
      throw new Error("Campo requerido");
    }

    const datosUsuario = {
      ...formulario,
      correo: formulario.correo || `${formulario.nombre_usuario}@temp.local`,
    };

    try {
      if (usuarioEditando) {
        await usuariosApi.actualizar(usuarioEditando.usuario_id, datosUsuario);
        noti.success({
          title: "Usuario actualizado",
          message: "El usuario ha sido actualizado exitosamente",
        });
      } else {
        await usuariosApi.crear(datosUsuario);
        noti.success({
          title: "Usuario creado",
          message: "El usuario ha sido creado exitosamente",
        });
      }

      limpiarFormulario();
      cargarUsuarios();
    } catch (error: any) {
      noti.error({
        title: "Error",
        message: error.response?.data?.error || "Error al guardar el usuario",
      });
      throw error; // Re-lanzar para que el modal pueda manejar el loading
    }
  };

  const handleEditar = (usuario: UsuarioConPiloto) => {
    setUsuarioEditando(usuario);
    setMostrarFormulario(true);
  };

  const handleEliminar = async (usuario: UsuarioConPiloto) => {
    const confirmed = await confirm({
      title: "¿Deshabilitar usuario?",
      message: `¿Estás seguro de que deseas deshabilitar al usuario "${usuario.nombre_usuario}"? El usuario no podrá iniciar sesión pero sus datos se conservarán.`,
      confirmText: "Sí, deshabilitar",
      cancelText: "Cancelar",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      // Deshabilitar en lugar de eliminar
      await usuariosApi.actualizar(usuario.usuario_id, {
        activo: false,
      } as Partial<Usuario>);

      noti.success({
        title: "Usuario deshabilitado",
        message: "El usuario ha sido deshabilitado exitosamente",
      });

      cargarUsuarios();
    } catch (error: any) {
      noti.error({
        title: "Error al deshabilitar",
        message:
          error.response?.data?.error ||
          error.message ||
          "No se pudo deshabilitar el usuario",
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
        <FormularioUsuario
          isOpen={mostrarFormulario}
          onClose={limpiarFormulario}
          usuarioEditando={usuarioEditando}
          onSubmit={handleSubmit}
          sucursales={sucursales}
          pilotos={pilotos}
          loadingPilotos={loadingPilotos}
        />

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
                                <Icons.power className="w-4 h-4" />
                                Deshabilitar
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
