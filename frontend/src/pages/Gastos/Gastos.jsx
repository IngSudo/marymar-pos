import { useEffect, useState } from 'react';
import { obtenerGastos } from '../../api/gastos';
import { rangoMesActual } from '../../utils/fechas';
import Modal from '../../components/Modal/Modal';
import FormularioGasto from '../../components/FormularioGasto/FormularioGasto';
import '../../styles/_admin.scss';

export default function Gastos() {
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierta, setModalAbierta] = useState(false);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const { desde, hasta } = rangoMesActual();
      setGastos(await obtenerGastos(desde, hasta));
    } finally {
      setCargando(false);
    }
  }

  function handleGuardado() {
    setModalAbierta(false);
    cargar();
  }

  const totalMes = gastos.reduce((sum, g) => sum + Number(g.monto), 0);

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Gastos (mes actual)</h1>
        <button className="admin-page__agregar" onClick={() => setModalAbierta(true)}>+ Registrar gasto</button>
      </div>

      <p>Total del mes: <strong>${totalMes.toFixed(2)}</strong></p>

      {cargando && <p className="admin-page__cargando">Cargando...</p>}

      {!cargando && (
        <div className="admin-page__tabla">
          <table>
            <thead><tr><th>Fecha</th><th>Descripción</th><th>Monto</th></tr></thead>
            <tbody>
              {gastos.length === 0 && <tr><td colSpan={3} className="admin-page__vacio">Sin gastos este mes</td></tr>}
              {gastos.map((g) => (
                <tr key={g.id}>
                  <td>{new Date(g.fecha).toLocaleDateString('es-EC')}</td>
                  <td>{g.descripcion}</td>
                  <td>${Number(g.monto).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierta && (
        <Modal titulo="Registrar gasto" onClose={() => setModalAbierta(false)}>
          <FormularioGasto onGuardado={handleGuardado} />
        </Modal>
      )}
    </div>
  );
}