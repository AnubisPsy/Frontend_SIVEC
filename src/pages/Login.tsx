// src/pages/Login.tsx - Método EXPLÍCITO con grecaptcha.render()
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Icons } from "../components/icons/IconMap";
import { useNotification } from "../hooks/useNotification";
import sivecLogoPng from "../assets/logos/sivec-logo.png";

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || "";

declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoad?: () => void;
  }
}

const Login = () => {
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requiereCaptcha, setRequiereCaptcha] = useState(false);

  // ✅ Referencia al contenedor del captcha
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  // ✅ ID del widget renderizado
  const widgetIdRef = useRef<number | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();
  const noti = useNotification();

  // ✅ Cargar script de reCAPTCHA
  useEffect(() => {
    if (document.getElementById("recaptcha-script")) {
      return;
    }

    const script = document.createElement("script");
    script.id = "recaptcha-script";
    script.src =
      "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
    script.async = true;
    script.defer = true;

    // ✅ Callback global que Google llamará cuando el script esté listo
    window.onRecaptchaLoad = () => {};

    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById("recaptcha-script");
      if (existingScript) {
        existingScript.remove();
      }
      delete window.onRecaptchaLoad;
    };
  }, []);

  // ✅ Renderizar el captcha cuando sea necesario
  useEffect(() => {
    if (!requiereCaptcha) return;
    if (!recaptchaContainerRef.current) return;

    // Esperar a que grecaptcha esté disponible
    const renderCaptcha = () => {
      if (!window.grecaptcha || !window.grecaptcha.render) {
        setTimeout(renderCaptcha, 100);
        return;
      }

      // Si ya existe un widget, resetearlo en lugar de crear uno nuevo
      if (widgetIdRef.current !== null) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
          return;
        } catch (err) {
          console.warn("No se pudo resetear, renderizando de nuevo:", err);
          widgetIdRef.current = null;
        }
      }

      try {
        widgetIdRef.current = window.grecaptcha.render(
          recaptchaContainerRef.current,
          {
            sitekey: RECAPTCHA_SITE_KEY,
            theme: "light",
            size: "normal",
          }
        );
      } catch (err) {
        console.error("❌ Error al renderizar captcha:", err);
        setError("Error al cargar el captcha. Recarga la página.");
      }
    };

    renderCaptcha();
  }, [requiereCaptcha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    let recaptchaToken: string | null = null;

    if (requiereCaptcha) {
      if (!window.grecaptcha || widgetIdRef.current === null) {
        setError("El captcha aún no está listo. Intenta de nuevo.");
        return;
      }

      try {
        recaptchaToken = window.grecaptcha.getResponse(widgetIdRef.current);

        if (!recaptchaToken) {
          setError("Por favor completa el captcha para continuar");
          return;
        }
      } catch (err) {
        console.error("Error al obtener token:", err);
        setError("Error al validar captcha. Recarga la página.");
        return;
      }
    }

    setLoading(true);

    try {
      const result = await login(loginInput, password, recaptchaToken);

      if (result.success) {
        noti.success({
          title: "Bienvenido de nuevo",
          message: "Tu acceso ha sido verificado correctamente.",
        });

        setTimeout(() => {
          navigate("/home");
        }, 200);
      } else {
        // Si el servidor dice que requiere captcha
        if (result.requiereCaptcha && !requiereCaptcha) {
          setRequiereCaptcha(true);
          setError(
            "Demasiados intentos fallidos. Por favor completa el captcha."
          );
        } else {
          // Resetear captcha si existe
          if (
            requiereCaptcha &&
            window.grecaptcha &&
            widgetIdRef.current !== null
          ) {
            try {
              window.grecaptcha.reset(widgetIdRef.current);
            } catch (err) {
              console.warn("No se pudo resetear el captcha:", err);
            }
          }

          // Mostrar error específico
          switch (result.error) {
            case "PILOTO_BLOQUEADO":
              setError("Acceso denegado para pilotos");
              break;
            case "CREDENCIALES_INVALIDAS":
              setError("Credenciales inválidas");
              break;
            case "CAPTCHA_REQUERIDO":
              setRequiereCaptcha(true);
              setError("Debes completar el captcha para continuar");
              break;
            case "CAPTCHA_INVALIDO":
              setError("Captcha inválido o expirado. Intenta de nuevo.");
              break;
            case "USUARIO_INACTIVO":
              setError(
                result.message ||
                  "Tu cuenta está desactivada. Contacta al administrador."
              );
              break;
            case "ERROR_SERVIDOR":
              setError(
                result.message || "Error del servidor. Intenta nuevamente."
              );
              break;
            default:
              setError(result.message || "Ocurrió un error inesperado");
          }
        }
      }
    } catch (err: any) {
      console.error("💥 Error inesperado:", err);
      setError("Error crítico al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 dark:bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 dark:bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-400 dark:bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-10 border border-white/20 dark:border-slate-700">
        {/* Logo y título */}
        <div className="text-center mb-8">
          {/* Logo completo (reemplaza el ícono y texto) */}
          <div className="flex justify-center mb-4">
            <img
              src={sivecLogoPng}
              alt="SIVEC - Sistema de Control de Vehículos"
              className="h-16 w-auto object-contain"
            />
          </div>

          {/* Solo mantener el subtítulo */}
          <p className="text-gray-600 dark:text-slate-400">
            Sistema de Verificación de Entregas de Camiones
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-fadeIn">
              <Icons.alertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Usuario o Correo */}
          <div>
            <label
              htmlFor="loginInput"
              className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2"
            >
              <Icons.user className="w-4 h-4" />
              Usuario o Correo Electrónico
            </label>
            <input
              id="loginInput"
              type="text"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent outline-none transition"
              placeholder="usuario123 o correo@ejemplo.com"
              required
              disabled={loading}
            />
          </div>

          {/* Contraseña */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2"
            >
              <Icons.lock className="w-4 h-4" />
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent outline-none transition"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {/* reCAPTCHA Container - Método explícito */}
          {requiereCaptcha && (
            <div className="flex justify-center animate-fadeIn">
              <div ref={recaptchaContainerRef}></div>
            </div>
          )}

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Icons.refresh className="w-5 h-5 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <Icons.logIn className="w-5 h-5" />
                Iniciar Sesión
              </>
            )}
          </button>

          {/* Mensaje informativo si requiere captcha */}
          {requiereCaptcha && (
            <p className="text-center text-sm text-orange-600 dark:text-orange-400 animate-fadeIn">
              🔒 Por seguridad, debes completar la verificación
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-slate-400">
          <p>Sistema MADEYSO © 2025</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
