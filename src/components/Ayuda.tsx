// src/components/ayuda/Ayuda.tsx
import React, { useState } from "react";
import {
  HelpCircle,
  Send,
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

interface ImagenAdjunta {
  file: File;
  preview: string;
  nombre: string;
}

const Ayuda: React.FC = () => {
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [categoria, setCategoria] = useState("");
  const [imagenes, setImagenes] = useState<ImagenAdjunta[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const { user } = useAuth();
  const token = localStorage.getItem("sivec_token");

  const getRolNombre = (rolId: number) => {
    switch (rolId) {
      case 1:
        return "Piloto";
      case 2:
        return "Jefe";
      case 3:
        return "Administrador";
      default:
        return "Usuario";
    }
  };

  // Obtener datos del usuario desde AuthContext
  const getRolDesdeUser = (user: any) => {
    // Si viene rol como número
    if (typeof user?.rol === "number") {
      return getRolNombre(user.rol);
    }

    // Si viene rol como objeto { id, nombre_rol }
    if (typeof user?.rol === "object" && user?.rol?.nombre_rol) {
      return user.rol.nombre_rol;
    }

    // Si viene rol como string directo
    if (typeof user?.rol === "string") {
      return user.rol;
    }

    return "No especificado";
  };

  const usuario = {
    nombre_usuario: user?.nombre_usuario || "Usuario",
    correo: user?.correo || "",
    usuario_id: user?.usuario_id || "",
    rol: getRolDesdeUser(user),
  };

  const categorias = [
    "Problema técnico",
    "Error en el sistema",
    "Sugerencia de mejora",
    "Consulta general",
    "Problema con GPS",
    "Problema con guías",
    "Otro",
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const nuevasImagenes: ImagenAdjunta[] = [];

    Array.from(files).forEach((file) => {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten archivos de imagen");
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Las imágenes no deben superar los 5MB");
        return;
      }

      // Crear preview
      const preview = URL.createObjectURL(file);
      nuevasImagenes.push({
        file,
        preview,
        nombre: file.name,
      });
    });

    // Limitar a 5 imágenes
    if (imagenes.length + nuevasImagenes.length > 5) {
      toast.error("Máximo 5 imágenes permitidas");
      return;
    }

    setImagenes([...imagenes, ...nuevasImagenes]);
  };

  const eliminarImagen = (index: number) => {
    URL.revokeObjectURL(imagenes[index].preview);
    setImagenes(imagenes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!asunto.trim() || !mensaje.trim() || !categoria) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setEnviando(true);

    try {
      const formData = new FormData();
      formData.append("asunto", asunto);
      formData.append("mensaje", mensaje);
      formData.append("categoria", categoria);
      formData.append("usuario_nombre", usuario.nombre_usuario);
      formData.append("usuario_correo", usuario.correo);
      formData.append("usuario_id", String(usuario.usuario_id));
      formData.append("usuario_rol", usuario.rol);

      // Agregar imágenes
      imagenes.forEach((imagen) => {
        formData.append(`imagenes`, imagen.file);
      });

      const response = await axios.post(`${API_URL}/ayuda/reportar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setEnviado(true);
        toast.success("Reporte enviado exitosamente. Te contactaremos pronto.");

        // Limpiar formulario después de 3 segundos
        setTimeout(() => {
          setAsunto("");
          setMensaje("");
          setCategoria("");
          setImagenes([]);
          setEnviado(false);
        }, 3000);
      }
    } catch (error: any) {
      console.error("Error al enviar reporte:", error);
      toast.error(
        error.response?.data?.message ||
          "Error al enviar el reporte. Intenta nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            ¡Reporte Enviado!
          </h2>
          <p className="text-gray-600 dark:text-slate-400">
            Hemos recibido tu reporte. Nuestro equipo lo revisará y te
            contactará pronto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                Centro de Ayuda
              </h1>
              <p className="text-gray-600 dark:text-slate-400">
                Reporta problemas o envía sugerencias al equipo de soporte
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-6">
          <form onSubmit={handleSubmit}>
            {/* Categoría */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Asunto */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                Asunto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                required
                placeholder="Describe brevemente el problema o sugerencia"
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              />
            </div>

            {/* Mensaje */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                Descripción detallada <span className="text-red-500">*</span>
              </label>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                required
                rows={6}
                placeholder="Proporciona todos los detalles que puedan ayudarnos a entender y resolver el problema..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 resize-none"
              />
            </div>

            {/* Adjuntar imágenes */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                Capturas de pantalla (Opcional)
              </label>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
                Puedes adjuntar hasta 5 imágenes (máx. 5MB cada una)
              </p>

              {/* Botón para subir */}
              <label className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg cursor-pointer transition-colors border-2 border-dashed border-gray-300 dark:border-slate-600">
                <Upload className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Seleccionar imágenes
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {/* Preview de imágenes */}
              {imagenes.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-4">
                  {imagenes.map((imagen, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imagen.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 dark:border-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => eliminarImagen(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                        {imagen.nombre}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Información del usuario */}
            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                Tu información de contacto:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <p className="text-gray-700 dark:text-slate-300">
                  <span className="font-semibold">Usuario:</span>{" "}
                  {usuario.nombre_usuario}
                </p>
                <p className="text-gray-700 dark:text-slate-300">
                  <span className="font-semibold">Correo:</span>{" "}
                  {usuario.correo || "No proporcionado"}
                </p>
                <p className="text-gray-700 dark:text-slate-300">
                  <span className="font-semibold">Rol:</span> {usuario.rol}
                </p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={enviando}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {enviando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar Reporte
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Información adicional */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Consejos para reportar problemas
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• Incluye capturas de pantalla cuando sea posible</li>
              <li>• Describe los pasos para reproducir el problema</li>
              <li>• Menciona el navegador y dispositivo que usas</li>
              <li>• Indica el momento exacto en que ocurrió el problema</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <h3 className="font-bold text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Tiempo de respuesta
            </h3>
            <ul className="text-sm text-green-800 dark:text-green-300 space-y-1">
              <li>• Problemas críticos: 2-4 horas</li>
              <li>• Problemas normales: 24-48 horas</li>
              <li>• Sugerencias: 3-5 días hábiles</li>
              <li>• Recibirás una respuesta por correo electrónico</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ayuda;
