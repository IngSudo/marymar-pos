import { useState } from 'react';
import { crearCostoRecurrente, editarCostoRecurrente } from '../../api/costosRecurrentes';

export default function FormularioCostoRecurrente({ costoExistente, onGuardado }) {
  const esEdicion = Boolean(costoExistente);
  const [descripcion, setDescripcion] = useState(costoExistente?.descripcion || '');
  const [monto, setMonto] = useState(costoExistente?.monto || '');
  const [frecuencia, setFrecuencia] = useState(costoExistente?.frecuencia || 'DIARIO');
  const [tipo, setTipo] = useState(costoExistente?.tipo || 'SUELDO');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const payload = { descripcion, monto: Number(monto), frecuencia, tipo };
      if (esEdicion) {
        await editarCostoRecurrente(costoExistente.id, payload);
      } else {
        await crearCostoRecurrente(payload);
      }
      onGuardado();
    } catch (err) {
      setError('No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="form-producto" onSubmit={handleSubmit}>
      {error && <div className="form-producto__error">{error}</div>}

      <label>Descripción</label>
      <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required autoFocus placeholder="Ej. Sueldo Juan" />

      <label>Monto ($)</label>
      <input type="number" step="0.01" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} required />

      <label>Tipo</label>
      <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
        <option value="SUELDO">Sueldo</option>
        <option value="OPERATIVO">Operativo (alquiler, internet, etc.)</option>
      </select>

      <label>Frecuencia</label>
      <select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)}>
        <option value="DIARIO">Diario</option>
        <option value="MENSUAL">Mensual</option>
      </select>

      <button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Agregar'}</button>
    </form>
  );
}