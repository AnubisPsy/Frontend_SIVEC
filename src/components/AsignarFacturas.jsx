// src/components/AsignarFacturas.tsx
import React, { useState } from "react";
import { Icons } from "./icons/IconMap";
import { useNotification } from "../hooks/useNotification";
import { useConfirm } from "../hooks/useConfirm";
import { ConfirmDialog } from "../hooks/ConfirmDialog";

const AsignarFacturas = () => {
  const [vehiculo, setVehiculo] = useState("C-25");
  const [piloto, setPiloto] = useState("Denuar Hernández");
  const [facturas, setFacturas] = useState([{ numero_factura: "", notas: "" }]);
  const [loading, setLoading] = useState(false);
  const noti = useNotification();
  const { confirm, isOpen, options, handleConfirm, handleCancel } =
    useConfirm();

  const agregarFactura = () => {
    setFacturas([...facturas, { numero_factura: "", notas: "" }]);
  };

  const actualizarFactura = (index, field, value) => {
    const nuevasFacturas = [...facturas];
    nuevasFacturas[index][field] = value;
    setFacturas(nuevasFacturas);
  };

  const eliminarFactura = (index) => {
    setFacturas(facturas.filter((_, i) => i !== index));
  };

  const asignarFacturas = async () => {
    // Validaciones básicas antes de enviar
    if (!vehiculo.trim()) {
      //alert("❌ Por favor ingresa un número de vehículo");
      noti.warning("❌ Por favor ingresa un número de vehículo");
      return;
    }

    if (!piloto.trim()) {
      //alert("❌ Por favor ingresa el nombre del piloto");
      noti.warning("❌ Por favor ingresa el nombre del piloto");
      return;
    }

    const facturasValidas = facturas.filter(
      (f) => f.numero_factura.trim() !== ""
    );

    if (facturasValidas.length === 0) {
      //alert("❌ Debes agregar al menos una factura con número válido");
      noti.warning("❌ Debes agregar al menos una factura con número válido");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:3000/api/facturas/asignar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            numero_vehiculo: vehiculo,
            piloto,
            facturas: facturasValidas,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        /* alert(
          `✅ Viaje creado exitosamente (ID: ${data.viaje_id})\n${data.facturas.length} facturas asignadas`
        ); */
        await confirm({
          title: "Viaje Creado",
          message: `✅ Viaje creado exitosamente (ID: ${data.viaje_id})
          \n${data.facturas.length} facturas asignadas
          \n👤 Piloto: ${data.piloto}
          \n🚛 Vehículo: ${data.vehiculo}`,
          confirmText: "Entendido",
          hideCancel: true,
          variant: "success",
        });
        // Limpiar formulario
        setVehiculo("C-25");
        setPiloto("Denuar Hernández");
        setFacturas([{ numero_factura: "", notas: "" }]);
      } else {
        // ✅ Mostrar mensaje de error específico del backend
        const errorMsg = data.message || data.error || "Error desconocido";

        if (data.viaje_activo) {
          await confirm({
            title: "No puedes iniciar viaje",
            message:
              `❌ ${errorMsg}\n\n` +
              `📍 Viaje activo: #${data.viaje_activo.viaje_id}\n` +
              `${
                data.viaje_activo.piloto
                  ? `👤 Piloto: ${data.viaje_activo.piloto}\n`
                  : ""
              }` +
              `${
                data.viaje_activo.vehiculo
                  ? `🚛 Vehículo: ${data.viaje_activo.vehiculo}`
                  : ""
              }`,
            confirmText: "Entendido",
            hideCancel: true,
            variant: "warning",
          });
        } else {
          await confirm({
            title: "Error",
            message: `❌ ${errorMsg}`,
            confirmText: "Entendido",
            hideCancel: true,
            variant: "danger",
          });
        }
      }
    } catch (error) {
      console.error("Error asignando facturas:", error);
      //alert("❌ Error de conexión: " + error.message);
      await confirm({
        title: "Error de conexión",
        message: `❌ Error de conexión: ${error.message}`,
        confirmText: "Entendido",
        hideCancel: true,
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 p-6">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Icons.document className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          Asignar Facturas
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Crea un nuevo viaje asignando facturas a un vehículo y piloto
        </p>
      </div>

      {/* Información del Viaje */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
            <Icons.truck className="w-4 h-4" />
            Vehículo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={vehiculo}
            onChange={(e) => setVehiculo(e.target.value)}
            placeholder="Ej: C-25"
            className="px-4 py-3 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
            <Icons.user className="w-4 h-4" />
            Piloto <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={piloto}
            onChange={(e) => setPiloto(e.target.value)}
            placeholder="Nombre del piloto"
            className="px-4 py-3 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
          />
        </div>
      </div>

      {/* Lista de Facturas */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Icons.document className="w-5 h-5" />
            Facturas ({facturas.length})
          </h3>
          <button
            onClick={agregarFactura}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
          >
            <Icons.plus className="w-4 h-4" />
            Agregar Factura
          </button>
        </div>

        <div className="space-y-3">
          {facturas.map((factura, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border-2 border-gray-200 dark:border-slate-600"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                      Número de Factura *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: FACT-001"
                      value={factura.numero_factura}
                      onChange={(e) =>
                        actualizarFactura(
                          index,
                          "numero_factura",
                          e.target.value
                        )
                      }
                      className="px-3 py-2 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                      Notas (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Notas adicionales..."
                      value={factura.notas}
                      onChange={(e) =>
                        actualizarFactura(index, "notas", e.target.value)
                      }
                      className="px-3 py-2 border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                    />
                  </div>
                </div>

                {facturas.length > 1 && (
                  <button
                    onClick={() => eliminarFactura(index)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all flex-shrink-0"
                    title="Eliminar factura"
                  >
                    <Icons.trash className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
        <button
          onClick={() => {
            setVehiculo("C-25");
            setPiloto("Denuar Hernández");
            setFacturas([{ numero_factura: "", notas: "" }]);
          }}
          className="px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-all flex items-center gap-2"
        >
          <Icons.refresh className="w-4 h-4" />
          Limpiar
        </button>
        <button
          onClick={asignarFacturas}
          disabled={loading}
          className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            loading
              ? "bg-gray-300 dark:bg-slate-600 text-gray-500 dark:text-slate-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
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
              Asignar Facturas
            </>
          )}
        </button>
      </div>

      {/* Info Helper */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-600 rounded-lg">
        <div className="flex items-start gap-2">
          <Icons.info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">Información:</p>
            <ul className="text-xs space-y-1 text-blue-700 dark:text-blue-400">
              <li>• Debe agregar al menos una factura con número válido</li>
              <li>• Las notas son opcionales para cada factura</li>
              <li>• Puede agregar múltiples facturas al mismo viaje</li>
            </ul>
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
        hideCancel={options.hideCancel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default AsignarFacturas;
