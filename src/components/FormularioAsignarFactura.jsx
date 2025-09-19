import React, { useState, useEffect } from "react";
import { facturasApi } from "../services/api";

const FormularioAsignarFactura = ({ onAsignarFactura, onCancelar }) => {
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

  // Cargar datos del formulario al montar el componente
  useEffect(() => {
    cargarDatosFormulario();
  }, []);

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
      alert("Error al cargar datos del formulario");
    } finally {
      setLoadingDatos(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (
      !nuevaFactura.numero_factura ||
      !nuevaFactura.piloto ||
      !nuevaFactura.numero_vehiculo
    ) {
      alert("Todos los campos marcados con * son obligatorios");
      return;
    }

    setLoading(true);
    try {
      await onAsignarFactura(nuevaFactura);

      // Limpiar formulario después del éxito
      setNuevaFactura({
        numero_factura: "",
        piloto: "",
        numero_vehiculo: "",
        notas_jefe: "",
      });
    } catch (error) {
      // El error se maneja en el componente padre
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setNuevaFactura((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loadingDatos) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Cargando datos del formulario...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Asignar Nueva Factura
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Número de Factura */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Factura *
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="Ej: FACT-2501"
              value={nuevaFactura.numero_factura}
              onChange={(e) => handleChange("numero_factura", e.target.value)}
            />
          </div>

          {/* Piloto con datalist */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Piloto * ({datosFormulario.pilotos.length} disponibles)
            </label>
            <input
              list="pilotos-list"
              type="text"
              required
              className="input-field"
              placeholder="Seleccionar o escribir nombre del piloto"
              value={nuevaFactura.piloto}
              onChange={(e) => handleChange("piloto", e.target.value)}
            />
            <datalist id="pilotos-list">
              {datosFormulario.pilotos.map((piloto, index) => (
                <option key={index} value={piloto.nombre_piloto}>
                  {piloto.nombre_piloto}
                </option>
              ))}
            </datalist>
          </div>

          {/* Vehículo con datalist */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehículo * ({datosFormulario.vehiculos.length} de tu sucursal)
            </label>
            <input
              list="vehiculos-list"
              type="text"
              required
              className="input-field"
              placeholder="Seleccionar número de vehículo"
              value={nuevaFactura.numero_vehiculo}
              onChange={(e) => handleChange("numero_vehiculo", e.target.value)}
            />
            <datalist id="vehiculos-list">
              {datosFormulario.vehiculos.map((vehiculo) => (
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas del Jefe
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Observaciones adicionales"
              value={nuevaFactura.notas_jefe}
              onChange={(e) => handleChange("notas_jefe", e.target.value)}
            />
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-800">
            <p>
              <strong>Información:</strong>
            </p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Pilotos obtenidos del sistema externo (SQL Server)</li>
              <li>
                Vehículos filtrados por tu sucursal (ID:{" "}
                {datosFormulario.sucursal_usuario})
              </li>
              <li>
                Puedes escribir el nombre del piloto manualmente si no aparece
                en la lista
              </li>
            </ul>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`btn-primary ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Asignando...
              </span>
            ) : (
              "Asignar Factura"
            )}
          </button>

          <button
            type="button"
            onClick={onCancelar}
            disabled={loading}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioAsignarFactura;
