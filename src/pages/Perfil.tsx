// src/pages/Perfil.tsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Icons } from "../components/icons/IconMap";
import { useNotification } from "../hooks/useNotification";
import { usuariosApi } from "../services/api";

interface ValidacionPassword {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

const Perfil = () => {
  const { user } = useAuth();
  const noti = useNotification();

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNuevo, setPasswordNuevo] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [mostrarPasswordActual, setMostrarPasswordActual] = useState(false);
  const [mostrarPasswordNuevo, setMostrarPasswordNuevo] = useState(false);
  const [mostrarPasswordConfirmar, setMostrarPasswordConfirmar] =
    useState(false);
  const [loading, setLoading] = useState(false);

  // Validación en tiempo real
  const validarPassword = (password: string): ValidacionPassword => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    };
  };

  const validacion = validarPassword(passwordNuevo);
  const todasValidas = Object.values(validacion).every((v) => v === true);
  const passwordsCoinciden =
    passwordNuevo === passwordConfirmar && passwordConfirmar !== "";

  // Calcular fortaleza
  const calcularFortaleza = (): {
    nivel: number;
    texto: string;
    color: string;
  } => {
    if (!passwordNuevo) return { nivel: 0, texto: "", color: "" };

    const cumplidas = Object.values(validacion).filter((v) => v).length;

    if (cumplidas <= 2) {
      return {
        nivel: 1,
        texto: "Débil",
        color: "text-red-600 dark:text-red-400",
      };
    } else if (cumplidas <= 4) {
      return {
        nivel: 2,
        texto: "Media",
        color: "text-yellow-600 dark:text-yellow-400",
      };
    } else {
      return {
        nivel: 3,
        texto: "Fuerte",
        color: "text-green-600 dark:text-green-400",
      };
    }
  };

  const fortaleza = calcularFortaleza();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!passwordActual || !passwordNuevo || !passwordConfirmar) {
      noti.error({
        title: "Error",
        message: "Por favor completa todos los campos",
      });
      return;
    }

    if (!todasValidas) {
      noti.error({
        title: "Contraseña débil",
        message: "La contraseña no cumple con los requisitos de seguridad",
      });
      return;
    }

    if (!passwordsCoinciden) {
      noti.error({
        title: "Error",
        message: "Las contraseñas nuevas no coinciden",
      });
      return;
    }

    setLoading(true);

    try {
      // ✅ Usar el servicio API
      const response = await usuariosApi.cambiarContrasena(
        passwordActual,
        passwordNuevo
      );

      if (response.data.success) {
        noti.success({
          title: "¡Contraseña actualizada!",
          message: "Tu contraseña ha sido cambiada exitosamente",
        });

        // Limpiar campos
        setPasswordActual("");
        setPasswordNuevo("");
        setPasswordConfirmar("");
      }
    } catch (error: any) {
      console.error("Error al cambiar contraseña:", error);

      const errorMsg =
        error.response?.data?.message || "Error al cambiar la contraseña";

      noti.error({
        title: "Error",
        message: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const getRolNombre = (rolId: number) => {
    switch (rolId) {
      case 1:
        return "Piloto";
      case 2:
        return "Jefe de Yarda";
      case 3:
        return "Administrador";
      default:
        return "Usuario";
    }
  };

  const getRolColor = (rolId: number) => {
    switch (rolId) {
      case 1:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case 2:
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case 3:
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
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
              <Icons.user className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                Mi Perfil
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300 rounded-lg font-medium">
                {user?.nombre_usuario}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información Personal */}

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Icons.user className="w-5 h-5 text-gray-400 dark:text-slate-500" />
            Información Personal
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre de usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Nombre de Usuario
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100">
                {user?.nombre_usuario}
              </div>
            </div>

            {/* Correo electrónico */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Correo Electrónico
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100">
                {user?.correo}
              </div>
            </div>

            {/* Rol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Rol
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRolColor(
                    user?.rol_id || 0
                  )}`}
                >
                  {getRolNombre(user?.rol_id || 0)}
                </span>
              </div>
            </div>

            {/* Sucursal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Sucursal
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100">
                {user?.sucursal?.nombre_sucursal || "No asignada"}
              </div>
            </div>
          </div>
        </div>

        {/* Cambiar Contraseña */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Icons.lock className="w-5 h-5 text-gray-400 dark:text-slate-500" />
            Seguridad
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contraseña Actual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Contraseña Actual
              </label>
              <div className="relative">
                <input
                  type={mostrarPasswordActual ? "text" : "password"}
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent outline-none transition"
                  placeholder="Ingresa tu contraseña actual"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() =>
                    setMostrarPasswordActual(!mostrarPasswordActual)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                >
                  {mostrarPasswordActual ? (
                    <Icons.eyeOff className="w-5 h-5" />
                  ) : (
                    <Icons.eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Nueva Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={mostrarPasswordNuevo ? "text" : "password"}
                  value={passwordNuevo}
                  onChange={(e) => setPasswordNuevo(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent outline-none transition"
                  placeholder="Ingresa tu nueva contraseña"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPasswordNuevo(!mostrarPasswordNuevo)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                >
                  {mostrarPasswordNuevo ? (
                    <Icons.eyeOff className="w-5 h-5" />
                  ) : (
                    <Icons.eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Indicador de Fortaleza */}
              {passwordNuevo && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          fortaleza.nivel === 1
                            ? "w-1/3 bg-red-500"
                            : fortaleza.nivel === 2
                            ? "w-2/3 bg-yellow-500"
                            : "w-full bg-green-500"
                        }`}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${fortaleza.color}`}>
                      {fortaleza.texto}
                    </span>
                  </div>

                  {/* Requisitos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      {validacion.minLength ? (
                        <Icons.checkCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Icons.xCircle className="w-4 h-4 text-gray-300 dark:text-slate-600" />
                      )}
                      <span
                        className={
                          validacion.minLength
                            ? "text-gray-700 dark:text-slate-300"
                            : "text-gray-500 dark:text-slate-500"
                        }
                      >
                        Mínimo 8 caracteres
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {validacion.hasUpperCase ? (
                        <Icons.checkCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Icons.xCircle className="w-4 h-4 text-gray-300 dark:text-slate-600" />
                      )}
                      <span
                        className={
                          validacion.hasUpperCase
                            ? "text-gray-700 dark:text-slate-300"
                            : "text-gray-500 dark:text-slate-500"
                        }
                      >
                        1 mayúscula (A-Z)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {validacion.hasLowerCase ? (
                        <Icons.checkCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Icons.xCircle className="w-4 h-4 text-gray-300 dark:text-slate-600" />
                      )}
                      <span
                        className={
                          validacion.hasLowerCase
                            ? "text-gray-700 dark:text-slate-300"
                            : "text-gray-500 dark:text-slate-500"
                        }
                      >
                        1 minúscula (a-z)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {validacion.hasNumber ? (
                        <Icons.checkCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Icons.xCircle className="w-4 h-4 text-gray-300 dark:text-slate-600" />
                      )}
                      <span
                        className={
                          validacion.hasNumber
                            ? "text-gray-700 dark:text-slate-300"
                            : "text-gray-500 dark:text-slate-500"
                        }
                      >
                        1 número (0-9)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {validacion.hasSpecialChar ? (
                        <Icons.checkCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Icons.xCircle className="w-4 h-4 text-gray-300 dark:text-slate-600" />
                      )}
                      <span
                        className={
                          validacion.hasSpecialChar
                            ? "text-gray-700 dark:text-slate-300"
                            : "text-gray-500 dark:text-slate-500"
                        }
                      >
                        1 símbolo (!@#$...)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={mostrarPasswordConfirmar ? "text" : "password"}
                  value={passwordConfirmar}
                  onChange={(e) => setPasswordConfirmar(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent outline-none transition"
                  placeholder="Confirma tu nueva contraseña"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() =>
                    setMostrarPasswordConfirmar(!mostrarPasswordConfirmar)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                >
                  {mostrarPasswordConfirmar ? (
                    <Icons.eyeOff className="w-5 h-5" />
                  ) : (
                    <Icons.eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Indicador de coincidencia */}
              {passwordConfirmar && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  {passwordsCoinciden ? (
                    <>
                      <Icons.checkCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">
                        Las contraseñas coinciden
                      </span>
                    </>
                  ) : (
                    <>
                      <Icons.alertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">
                        Las contraseñas no coinciden
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Botón */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading || !todasValidas || !passwordsCoinciden}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Icons.refresh className="w-5 h-5 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Icons.lock className="w-5 h-5" />
                    Cambiar Contraseña
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
