import { useState } from "react";
import { crearGasto, editarGasto } from "../../api/gastos";
import { fechaLocalISO } from "../../utils/fechas";

export default function FormularioGasto({ gastoExistente, onGuardado }) {
  const esEdicion = Boolean(gastoExistente);
  const [descripcion, setDescripcion] = useState(gastoExistente?.descripcion || "");
  const [monto, setMonto] = useState(gastoExistente?.monto || "");
  const [fecha, setFecha] = useState(gastoExistente ? fechaLocalISO(gastoExistente.fecha) : "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      if (esEdicion) {
        await editarGasto(gastoExistente.id, { descripcion, monto: Number(monto), fecha });
      } else {
        await crearGasto({ descripcion, monto: Number(monto) });
      }
      onGuardado();
    } catch (err) {
      setError(esEdicion ? "No se pudo actualizar el gasto" : "No se pudo registrar el gasto");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="form-producto" onSubmit={handleSubmit}>
      {error && <div className="form-producto__error">{error}</div>}
      <label>Descripción</label>
      <input
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        required
        autoFocus
        placeholder="Ej. Compra de ingredientes"
      />
      <label>Monto ($)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        required
      />
      {esEdicion && (
        <>
          <label>Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </>
      )}
      <button type="submit" disabled={guardando}>
        {guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Registrar gasto"}
      </button>
    </form>
  );
}
