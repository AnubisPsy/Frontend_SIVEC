// src/components/FormularioAsignarFacturaModal.tsx
import React, { useState, useEffect } from "react";
import { facturasApi } from "../services/api";
import { Icons } from "./icons/IconMap";
import { useConfirm } from "../hooks/useConfirm";
import { ConfirmDialog } from "../hooks/ConfirmDialog";
import { useNotification } from "../hooks/useNotification";
import Modal from "./Modal";

interface FormularioAsignarFacturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAsignarFactura: (factura: any) => Promise<void>;
}

const FormularioAsignarFacturaModal: React.FC<
  FormularioAsignarFacturaModalProps
> = ({ isOpen, onClose, onAsignarFactura }) => {
  const noti = useNotification();
  const {
    confirm,
    isOpen: confirmOpen,
    options,
    handleConfirm,
    handleCancel,
  } = useConfirm();

  const [nuevaFactura, setNuevaFactura] = useState({
    numero_factura: "",
    piloto: "",
    numero_vehiculo: "",
    notas_jefe: "",
  });

  const [datosFormulario, setDatosFormulario] = useState({
    pilotos: [],
    vehiculos: [],
  });

  const [loading, setLoading] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(true);

  useEffect(() => {
    if (isOpen) {
      cargarDatosFormulario();
    }
  }, [isOpen]);

  const cargarDatosFormulario = async () => {
    try {
      setLoadingDatos(true);
      const response = await facturasApi.obtenerDatosFormulario();

      if (response.data.success) {
        setDatosFormulario(response.data.data);
        console.log(
          `Datos cargados: ${response.data.data.pilotos.length} pilotos, ${response.data.data.vehiculos.length} vehiculos`
        );
      }
    } catch (error) {
      console.error("Error al cargar datos del formulario:", error);
      await confirm({
        title: "Error",
        message: `❌ Al cargar datos del formulario`,
        confirmText: "Ok",
        variant: "danger",
      } as any);
    } finally {
      setLoadingDatos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación 1: Campos obligatorios
    if (
      !nuevaFactura.numero_factura ||
      !nuevaFactura.piloto ||
      !nuevaFactura.numero_vehiculo
    ) {
      noti.warning({
        message: "Todos los campos marcados con * son obligatorios",
      });
      return;
    }

    // ✅ Validación 2: Piloto debe estar en la lista
    const pilotoValido = datosFormulario.pilotos.some(
      (p: any) =>
        p.nombre_piloto.trim().toLowerCase() ===
        nuevaFactura.piloto.trim().toLowerCase()
    );

    if (!pilotoValido) {
      noti.error({
        title: "Piloto no válido",
        message: `El piloto "${nuevaFactura.piloto}" no existe en la lista. Selecciona uno disponible.`,
      });
      return;
    }

    // ✅ Validación 3: Vehículo debe estar en la lista
    const vehiculoValido = datosFormulario.vehiculos.some(
      (v: any) =>
        v.numero_vehiculo.trim().toLowerCase() ===
        nuevaFactura.numero_vehiculo.trim().toLowerCase()
    );

    if (!vehiculoValido) {
      noti.error({
        title: "Vehículo no válido",
        message: `El vehículo "${nuevaFactura.numero_vehiculo}" no existe en tu sucursal. Selecciona uno de la lista.`,
      });
      return;
    }

    // Si llegamos aquí, todo está válido
    setLoading(true);
    try {
      await onAsignarFactura(nuevaFactura);

      // Limpiar y cerrar
      setNuevaFactura({
        numero_factura: "",
        piloto: "",
        numero_vehiculo: "",
        notas_jefe: "",
      });
      onClose();
    } catch (error) {
      // El error se maneja en el componente padre
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setNuevaFactura((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loadingDatos) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Asignar Nueva Factura"
        size="lg"
      >
        <div className="flex items-center justify-center py-8">
          <Icons.refresh className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          <span className="ml-3 text-gray-700 dark:text-slate-300">
            Cargando datos del formulario...
          </span>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Asignar Nueva Factura"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Número de Factura */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Icons.document className="w-4 h-4" />
                Número de Factura <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                placeholder="Ej: FACT-2501"
                value={nuevaFactura.numero_factura}
                onChange={(e) => handleChange("numero_factura", e.target.value)}
              />
            </div>

            {/* Piloto con datalist */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Icons.user className="w-4 h-4" />
                Piloto <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  ({datosFormulario.pilotos.length} disponibles)
                </span>
              </label>
              <input
                list="pilotos-list"
                type="text"
                required
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                placeholder="Seleccionar o escribir nombre del piloto"
                value={nuevaFactura.piloto}
                onChange={(e) => handleChange("piloto", e.target.value)}
              />
              <datalist id="pilotos-list">
                {datosFormulario.pilotos.map((piloto: any, index: number) => (
                  <option key={index} value={piloto.nombre_piloto}>
                    {piloto.nombre_piloto}{" "}
                    {piloto.es_temporal ? "(Temporal)" : ""}
                  </option>
                ))}
              </datalist>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Pilotos regulares
                <span className="w-2 h-2 bg-yellow-500 rounded-full ml-2"></span>
                Pilotos temporales
              </p>
            </div>

            {/* Vehículo con datalist */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Icons.truck className="w-4 h-4" />
                Vehículo <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  ({datosFormulario.vehiculos.length} de tu sucursal)
                </span>
              </label>
              <input
                list="vehiculos-list"
                type="text"
                required
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                placeholder="Seleccionar número de vehículo"
                value={nuevaFactura.numero_vehiculo}
                onChange={(e) =>
                  handleChange("numero_vehiculo", e.target.value)
                }
              />
              <datalist id="vehiculos-list">
                {datosFormulario.vehiculos.map((vehiculo: any) => (
                  <option
                    key={vehiculo.vehiculo_id}
                    value={vehiculo.numero_vehiculo}
                  >
                    {vehiculo.numero_vehiculo} - {vehiculo.placa}
                    {vehiculo.agrupacion && ` (${vehiculo.agrupacion})`}
                  </option>
                ))}
              </datalist>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Icons.edit className="w-4 h-4" />
                Notas del Jefe
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                placeholder="Observaciones adicionales"
                value={nuevaFactura.notas_jefe}
                onChange={(e) => handleChange("notas_jefe", e.target.value)}
              />
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icons.info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-2">Información:</p>
                <ul className="space-y-1 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                      •
                    </span>
                    <span>
                      Pilotos obtenidos del sistema externo (SQL Server)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                      •
                    </span>
                    <span>
                      Vehículos filtrados por tu sucursal (ID:{" "}
                      {datosFormulario.vehiculos.length})
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                      •
                    </span>
                    <span>
                      Puedes escribir el nombre del piloto manualmente si no
                      aparece en la lista
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <Icons.refresh className="w-4 h-4 animate-spin" />
                  Asignando...
                </>
              ) : (
                <>
                  <Icons.send className="w-4 h-4" />
                  Asignar Factura
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
            >
              <Icons.x className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
};

export default FormularioAsignarFacturaModal;
