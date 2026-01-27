// src/components/FormularioPilotoTemporal.tsx
import React, { useState, useEffect } from "react";
import { Icons } from "./icons/IconMap";
import Modal from "./Modal";

interface PilotoTemporal {
  piloto_temporal_id: number;
  nombre: string;
  activo: boolean;
  creado_por: number;
  fecha_creacion: string;
  notas: string | null;
}

interface FormularioPilotoTemporalProps {
  isOpen: boolean;
  onClose: () => void;
  pilotoEditando: PilotoTemporal | null;
  onSubmit: (formulario: { nombre: string; notas: string }) => Promise<void>;
}

const FormularioPilotoTemporal: React.FC<FormularioPilotoTemporalProps> = ({
  isOpen,
  onClose,
  pilotoEditando,
  onSubmit,
}) => {
  const [formulario, setFormulario] = useState({
    nombre: "",
    notas: "",
  });
  const [loading, setLoading] = useState(false);

  // Cargar datos cuando se abre el modal en modo edición
  useEffect(() => {
    if (isOpen && pilotoEditando) {
      setFormulario({
        nombre: pilotoEditando.nombre,
        notas: pilotoEditando.notas || "",
      });
    } else if (isOpen) {
      // Limpiar formulario en modo crear
      setFormulario({ nombre: "", notas: "" });
    }
  }, [isOpen, pilotoEditando]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formulario.nombre.trim()) {
      alert("El nombre es requerido");
      return;
    }

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        pilotoEditando ? "Editar Piloto Temporal" : "Crear Piloto Temporal"
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Icons.user className="w-4 h-4" />
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={loading}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-madeyso-primary dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Ej: Juan Pérez"
              value={formulario.nombre}
              onChange={(e) =>
                setFormulario({ ...formulario, nombre: e.target.value })
              }
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Icons.edit className="w-4 h-4" />
              Notas
            </label>
            <input
              type="text"
              disabled={loading}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-madeyso-primary dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Observaciones"
              value={formulario.notas}
              onChange={(e) =>
                setFormulario({ ...formulario, notas: e.target.value })
              }
            />
          </div>
        </div>

        {/* Información */}
        <div className="bg-madeyso-green-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icons.info className="w-5 h-5 text-madeyso-primary dark:text-madeyso-primary-light flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Nota:</strong> Los pilotos temporales aparecerán en el
              datalist cuando los jefes de yarda asignen facturas.
            </p>
          </div>
        </div>

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
                {pilotoEditando ? "Actualizando..." : "Creando..."}
              </>
            ) : (
              <>
                <Icons.save className="w-4 h-4" />
                {pilotoEditando ? "Actualizar" : "Crear"} Piloto
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

export default FormularioPilotoTemporal;
