import { useEffect, useState } from 'react';
import { Plus, Wallet, Receipt, Calendar, CalendarRange } from 'lucide-react';
import { obtenerGastos } from '../../api/gastos';
import { rangoDeMes, mesActualISO, hoyISO } from '../../utils/fechas';
import Modal from '../../components/modal/Modal';
import FormularioGasto from '../../components/FormularioGasto/FormularioGasto';
import '../../styles/_admin.scss';
import './Gastos.scss';

export default function Gastos() {
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierta, setModalAbierta] = useState(false);

  const [modoFiltro, setModoFiltro] = useState('mes');
  const [mes, setMes] = useState(mesActualISO());
  const [desde, setDesde] = useState(rangoDeMes(mesActualISO()).desde);
  const [hasta, setHasta] = useState(hoyISO());

  const rango = modoFiltro === 'mes' ? rangoDeMes(mes) : { desde, hasta };
  const esMesActual = modoFiltro === 'mes' && mes === mesActualISO();

  function irAMesActual() {
    setModoFiltro('mes');
    setMes(mesActualISO());
  }

  useEffect(() => {
    cargar();
  }, [modoFiltro, mes, desde, hasta]);

  async function cargar() {
    setCargando(true);
    try {
      setGastos(await obtenerGastos(rango.desde, rango.hasta));
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
        <h1>Gastos</h1>
        <button className="admin-page__agregar" onClick={() => setModalAbierta(true)}>
          <Plus size={16} strokeWidth={2.5} />
          Registrar gasto
        </button>
      </div>

      <div className="gastos__filtros">
        <div className="gastos__filtro-tipo">
          <button className={esMesActual ? 'activo' : ''} onClick={irAMesActual}>Este mes</button>
          <button className={modoFiltro === 'mes' && !esMesActual ? 'activo' : ''} onClick={() => setModoFiltro('mes')}>Otro mes</button>
          <button className={modoFiltro === 'rango' ? 'activo' : ''} onClick={() => setModoFiltro('rango')}>Rango de fechas</button>
        </div>

        {modoFiltro === 'mes' ? (
          <label className="gastos__filtro-extra">
            <Calendar size={14} strokeWidth={2} />
            <input type="month" value={mes} max={mesActualISO()} onChange={(e) => setMes(e.target.value)} />
          </label>
        ) : (
          <label className="gastos__filtro-extra">
            <CalendarRange size={14} strokeWidth={2} />
            <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} />
            <span>→</span>
            <input type="date" value={hasta} min={desde} max={hoyISO()} onChange={(e) => setHasta(e.target.value)} />
          </label>
        )}
      </div>

      <div className="gastos__total">
        <span className="gastos__total-icono"><Wallet size={20} strokeWidth={2} /></span>
        <div>
          <span className="gastos__total-label">Total del periodo</span>
          <span className="gastos__total-valor">${totalMes.toFixed(2)}</span>
        </div>
      </div>

      {cargando && <p className="admin-page__cargando">Cargando...</p>}

      {!cargando && (
        <div className="admin-page__tabla">
          <table>
            <thead><tr><th>Fecha</th><th>Descripción</th><th>Monto</th></tr></thead>
            <tbody>
              {gastos.length === 0 && (
                <tr>
                  <td colSpan={3} className="admin-page__vacio">
                    <Receipt size={22} strokeWidth={1.5} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.5 }} />
                    Sin gastos en este periodo
                  </td>
                </tr>
              )}
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
