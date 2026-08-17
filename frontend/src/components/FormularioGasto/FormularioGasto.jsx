import { useState } from "react";
import { crearGasto } from "../../api/gastos";

export default function FormularioGasto({ onGuardado }) {
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      await crearGasto({ descripcion, monto: Number(monto) });
      onGuardado();
    } catch (err) {
      setError("No se pudo registrar el gasto");
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
      <button type="submit" disabled={guardando}>
        {guardando ? "Guardando..." : "Registrar gasto"}
      </button>
    </form>
  );
}
