import { useEffect, useState } from 'react';
import { obtenerCostosRecurrentes, desactivarCostoRecurrente, activarCostoRecurrente } from '../../api/costosRecurrentes';
import Modal from '../../components/Modal/Modal';
import FormularioCostoRecurrente from '../../components/FormularioCostoRecurrente/FormularioCostoRecurrente';
import '../../styles/_admin.scss';

export default function CostosRecurrentes() {
  const [costos, setCostos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierta, setModalAbierta] = useState(false);
  const [editando, setEditando] = useState(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      setCostos(await obtenerCostosRecurrentes());
    } finally {
      setCargando(false);
    }
  }

  function abrirCrear() { setEditando(null); setModalAbierta(true); }
  function abrirEditar(c) { setEditando(c); setModalAbierta(true); }

  async function handleToggle(c) {
    if (c.activo) await desactivarCostoRecurrente(c.id);
    else await activarCostoRecurrente(c.id);
    cargar();
  }

  function handleGuardado() { setModalAbierta(false); cargar(); }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Costos recurrentes</h1>
        <button className="admin-page__agregar" onClick={abrirCrear}>+ Agregar</button>
      </div>

      {cargando && <p className="admin-page__cargando">Cargando...</p>}

      {!cargando && (
        <div className="admin-page__tabla">
          <table>
            <thead><tr><th>Descripción</th><th>Tipo</th><th>Monto</th><th>Frecuencia</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {costos.length === 0 && <tr><td colSpan={6} className="admin-page__vacio">Sin costos registrados</td></tr>}
              {costos.map((c) => (
                <tr key={c.id}>
                  <td>{c.descripcion}</td>
                  <td>{c.tipo === 'SUELDO' ? 'Sueldo' : 'Operativo'}</td>
                  <td>${Number(c.monto).toFixed(2)}</td>
                  <td>{c.frecuencia === 'DIARIO' ? 'Diario' : 'Mensual'}</td>
                  <td>
                    <span className={`admin-page__badge ${c.activo ? 'admin-page__badge--activo' : 'admin-page__badge--inactivo'}`}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="admin-page__acciones">
                    <button className="editar" onClick={() => abrirEditar(c)}>Editar</button>
                    <button className={c.activo ? 'desactivar' : 'activar'} onClick={() => handleToggle(c)}>
                      {c.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierta && (
        <Modal titulo={editando ? 'Editar costo' : 'Agregar costo recurrente'} onClose={() => setModalAbierta(false)}>
          <FormularioCostoRecurrente costoExistente={editando} onGuardado={handleGuardado} />
        </Modal>
      )}
    </div>
  );
}