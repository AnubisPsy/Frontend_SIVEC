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
}

const ROLES = [
  { id: 1, nombre: "Piloto" },
  { id: 2, nombre: "Jefe de Yarda" },
  { id: 3, nombre: "Administrador" },
];

const SUCURSALES = [
  { id: 1, nombre: "SATUYE" },
  // Puedes agregar más sucursales según tu base de datos
];

const AdminUsuarios: React.FC = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [formulario, setFormulario] = useState<FormularioUsuario>({
    nombre_usuario: "",
    correo: "",
    password: "",
    rol_id: 1,
    sucursal_id: 1,
  });

  // Verificar que el usuario sea admin
  useEffect(() => {
    if (user?.rol_id !== 3) {
      window.location.href = "/dashboard";
      return;
    }
    cargarUsuarios();
  }, [user]);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const response = await usuariosApi.obtenerTodos();
      if (response.data.success) {
        setUsuarios(response.data.data);
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      alert("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setFormulario({
      nombre_usuario: "",
      correo: "",
      password: "",
      rol_id: 1,
      sucursal_id: 1,
    });
    setUsuarioEditando(null);
    setMostrarFormulario(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formulario.nombre_usuario || !formulario.password) {
      alert("Nombre de usuario y contraseña son requeridos");
      return;
    }

    // Si es piloto (rol_id 1), el correo no es requerido
    if (formulario.rol_id !== 1 && !formulario.correo) {
      alert("El correo es requerido para jefes y administradores");
      return;
    }

    // Si es piloto y no tiene correo, usar el nombre de usuario como correo temporal
    const datosUsuario = {
      ...formulario,
      correo: formulario.correo || `${formulario.nombre_usuario}@temp.local`,
    };

    try {
      if (usuarioEditando) {
        // Actualizar usuario existente
        await usuariosApi.actualizar(usuarioEditando.usuario_id, datosUsuario);
        alert("Usuario actualizado exitosamente");
      } else {
        // Crear nuevo usuario
        await usuariosApi.crear(datosUsuario);
        alert("Usuario creado exitosamente");
      }

      limpiarFormulario();
      cargarUsuarios();
    } catch (error: any) {
      alert("Error: " + (error.response?.data?.error || error.message));
    }
  };

  const handleEditar = (usuario: Usuario) => {
    setUsuarioEditando(usuario);
    setFormulario({
      nombre_usuario: usuario.nombre_usuario,
      correo: usuario.correo,
      password: "", // No mostrar contraseña actual
      rol_id: usuario.rol_id,
      sucursal_id: 1, // Valor por defecto, podrías obtenerlo del usuario si tienes el campo
    });
    setMostrarFormulario(true);
  };

  const handleEliminar = async (usuario: Usuario) => {
    if (
      !confirm(
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

  const getRolNombre = (rol_id: number) => {
    const rol = ROLES.find((r) => r.id === rol_id);
    return rol ? rol.nombre : `Rol ${rol_id}`;
  };

  const getRolBadge = (rol_id: number) => {
    const colors = {
      1: "bg-blue-100 text-blue-800", // Piloto
      2: "bg-yellow-100 text-yellow-800", // Jefe
      3: "bg-purple-100 text-purple-800", // Admin
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
        {/* Botón para crear usuario */}
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
                    {SUCURSALES.map((sucursal) => (
                      <option key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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

        {/* Lista de usuarios */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(usuario.created_at).toLocaleDateString()}
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
