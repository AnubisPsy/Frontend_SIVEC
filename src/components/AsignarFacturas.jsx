import React, { useState } from "react";

const AsignarFacturas = () => {
  const [vehiculo, setVehiculo] = useState("C-25");
  const [piloto, setPiloto] = useState("Denuar Hernández");
  const [facturas, setFacturas] = useState([{ numero_factura: "", notas: "" }]);
  const [loading, setLoading] = useState(false);

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
            facturas: facturas.filter((f) => f.numero_factura.trim() !== ""),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(
          `✅ Viaje creado exitosamente (ID: ${data.viaje_id})\n${data.facturas.length} facturas asignadas`
        );
        // Limpiar formulario
        setFacturas([{ numero_factura: "", notas: "" }]);
      } else {
        alert("❌ Error: " + data.error);
      }
    } catch (error) {
      alert("❌ Error de conexión: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="asignar-facturas">
      <h2>Asignar Facturas</h2>

      <div className="form-group">
        <label>Vehículo:</label>
        <input
          type="text"
          value={vehiculo}
          onChange={(e) => setVehiculo(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Piloto:</label>
        <input
          type="text"
          value={piloto}
          onChange={(e) => setPiloto(e.target.value)}
        />
      </div>

      <h3>Facturas</h3>
      {facturas.map((factura, index) => (
        <div key={index} className="factura-item">
          <input
            type="text"
            placeholder="Número de factura"
            value={factura.numero_factura}
            onChange={(e) =>
              actualizarFactura(index, "numero_factura", e.target.value)
            }
          />
          <input
            type="text"
            placeholder="Notas (opcional)"
            value={factura.notas}
            onChange={(e) => actualizarFactura(index, "notas", e.target.value)}
          />
          {facturas.length > 1 && (
            <button onClick={() => eliminarFactura(index)}>Eliminar</button>
          )}
        </div>
      ))}

      <button onClick={agregarFactura}>+ Agregar Factura</button>
      <button onClick={asignarFacturas} disabled={loading}>
        {loading ? "Asignando..." : "Asignar Facturas"}
      </button>
    </div>
  );
};

export default AsignarFacturas;