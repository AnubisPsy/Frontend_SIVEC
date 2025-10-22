// src/pages/AdminUsuarios.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usuariosApi, Usuario } from "../services/api";

interface FormularioUsuario {
  nombre_usuario: string;
  correo: string;
  password: string;
  rol_id: number;
  sucursal_id: number;
  piloto_sql_id: number | null;
  piloto_temporal_id: number | null;
}

interface Piloto {
  nombre_piloto: string;
  es_temporal: boolean;
  piloto_temporal_id?: number;
  fuente: string;
}

interface UsuarioConPiloto extends Usuario {
  sucursal_id: number;
  piloto_sql_id: number | null;
  piloto_temporal_id: number | null;
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

  type Sucursal = { sucursal_id: number; nombre_sucursal: string };
  const [sucursales, setSucursales] = useState<
    Array<{ sucursal_id: number; nombre_sucursal: string }>
  >([]);

  const [pilotos, setPilotos] = useState<Piloto[]>([]);
  const [loadingPilotos, setLoadingPilotos] = useState(false);
  const [tipoVinculacion, setTipoVinculacion] = useState<
    "ninguno" | "sql" | "temporal"
  >("ninguno");

  // Verificar que el usuario sea admin
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
        setUsuarios(response.data.data as UsuarioConPiloto[]); // ← Agregar "as UsuarioConPiloto[]"
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

    // Determinar tipo de vinculación
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
    if (
      !window.confirm(
        `¿Estás seguro de eliminar al usuario ${usuario.nombre_usuario}?`
      )
    ) {
      return;
    }

    try {
      await usuariosApi.eliminar(usuario.usuario_id);
      alert("Usuario eliminado exitosamente");
      cargarUsuarios();
    } catch (error: any) {
      alert(
        "Error al eliminar usuario: " +
          (error.response?.data?.error || error.message)
      );
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
      // Para SQL, guardamos el nombre del piloto como ID temporal
      // En un caso real, deberías tener el ID real del piloto en SQL
      setFormulario({
        ...formulario,
        piloto_sql_id: parseInt(valor) || null,
      });
    } else if (tipoVinculacion === "temporal") {
      setFormulario({
        ...formulario,
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
      1: "bg-blue-100 text-blue-800",
      2: "bg-yellow-100 text-yellow-800",
      3: "bg-purple-100 text-purple-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[rol_id as keyof typeof colors] || "bg-gray-100 text-gray-800"
        }`}
      >
        {getRolNombre(rol_id)}
      </span>
    );
  };

  const getPilotoBadge = (usuario: UsuarioConPiloto) => {
    if (!usuario.piloto_vinculado) {
      return <span className="text-xs text-gray-400">Sin vincular</span>;
    }

    const { tipo, nombre } = usuario.piloto_vinculado;
    const color =
      tipo === "sql"
        ? "bg-blue-100 text-blue-800"
        : "bg-yellow-100 text-yellow-800";
    const icono = tipo === "sql" ? "🔵" : "🟡";

    return (
      <span className={`px-2 py-1 rounded text-xs ${color}`}>
        {icono} {nombre}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  const pilotosSQL = pilotos.filter((p) => !p.es_temporal);
  const pilotosTemporales = pilotos.filter((p) => p.es_temporal);

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
                Administración de Usuarios
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              {usuarios.length} usuarios registrados
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
            className="btn-primary"
          >
            + Crear Usuario
          </button>
        </div>

        {/* Formulario */}
        {mostrarFormulario && (
          <div className="card p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {usuarioEditando ? "Editar Usuario" : "Crear Nuevo Usuario"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de Usuario *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo {formulario.rol_id !== 1 && "*"}
                  </label>
                  <input
                    type="email"
                    className="input-field"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    className="input-field"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol *
                  </label>
                  <select
                    required
                    className="input-field"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sucursal *
                  </label>
                  <select
                    required
                    className="input-field"
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
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    🔗 Vincular con Piloto (Opcional)
                  </h4>

                  <div className="space-y-3">
                    {/* Tipo de vinculación */}
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="tipoVinculacion"
                          checked={tipoVinculacion === "ninguno"}
                          onChange={() =>
                            handleTipoVinculacionChange("ninguno")
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">⚪ No vincular</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="tipoVinculacion"
                          checked={tipoVinculacion === "sql"}
                          onChange={() => handleTipoVinculacionChange("sql")}
                          className="mr-2"
                        />
                        <span className="text-sm">🔵 Piloto SQL Server</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="tipoVinculacion"
                          checked={tipoVinculacion === "temporal"}
                          onChange={() =>
                            handleTipoVinculacionChange("temporal")
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">🟡 Piloto Temporal</span>
                      </label>
                    </div>

                    {/* Select de piloto según tipo */}
                    {tipoVinculacion === "sql" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Seleccionar Piloto SQL ({pilotosSQL.length}{" "}
                          disponibles)
                        </label>
                        <select
                          className="input-field"
                          value={formulario.piloto_sql_id || ""}
                          onChange={(e) => handlePilotoChange(e.target.value)}
                        >
                          <option value="">-- Seleccionar --</option>
                          {loadingPilotos ? (
                            <option>Cargando...</option>
                          ) : (
                            pilotosSQL.map((piloto, index) => (
                              <option key={index} value={index + 1}>
                                {piloto.nombre_piloto}
                              </option>
                            ))
                          )}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Nota: Los IDs de SQL son temporales para este demo
                        </p>
                      </div>
                    )}

                    {tipoVinculacion === "temporal" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Seleccionar Piloto Temporal (
                          {pilotosTemporales.length} disponibles)
                        </label>
                        <select
                          className="input-field"
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

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Nota:</strong> La vinculación permite
                      identificar qué usuario corresponde a cada piloto. Un
                      piloto solo puede tener un usuario asignado.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary">
                  {usuarioEditando ? "Actualizar" : "Crear"} Usuario
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

        {/* Tabla de usuarios */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Usuarios del Sistema
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Correo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Piloto Vinculado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuarios.map((usuario) => (
                  <tr key={usuario.usuario_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {usuario.nombre_usuario}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {usuario.usuario_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {usuario.correo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRolBadge(usuario.rol_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPilotoBadge(usuario)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditar(usuario)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </button>
                      {usuario.usuario_id !== user?.usuario_id && (
                        <button
                          onClick={() => handleEliminar(usuario)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      )}
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

export default AdminUsuarios;
