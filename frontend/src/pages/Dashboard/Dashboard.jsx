import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Trophy, Calendar, CalendarRange, Wallet, Clock, CheckCircle2 } from 'lucide-react';
import { obtenerResumen, obtenerRentabilidad } from '../../api/dashboard';
import { obtenerPendientes } from '../../api/costosRecurrentes';
import { obtenerPagos } from '../../api/pagosCostosRecurrentes';
import {
  rangoHoy, rangoAyer, rangoSemanaActual, rangoSemanaAnterior, rangoMesActual, rangoMesAnterior,
  rangoDeMes, mesAnteriorA, nombreDeMes, mesActualISO, rangoAnteriorEquivalente, hoyISO,
} from '../../utils/fechas';
import BarChart from '../../components/BarChart/BarChart';
import { chartColors } from '../../styles/chartColors';
import './Dashboard.scss';

const PERIODOS_FIJOS = {
  hoy: { actual: rangoHoy, anterior: rangoAyer, etiqueta: 'Hoy', comparaCon: 'ayer' },
  semana: { actual: rangoSemanaActual, anterior: rangoSemanaAnterior, etiqueta: 'Esta semana', comparaCon: 'semana pasada' },
  mes: { actual: rangoMesActual, anterior: rangoMesAnterior, etiqueta: 'Este mes', comparaCon: 'mes pasado' },
};

function delta(actual, anterior) {
  if (!anterior) return null;
  const bruto = ((actual - anterior) / Math.abs(anterior)) * 100;
  const magnitud = Math.abs(bruto);
  const positivo = bruto >= 0;
  if (magnitud > 100) return { texto: '>100%', positivo };
  return { texto: `${magnitud.toFixed(1)}%`, positivo };
}

export default function Dashboard() {
  const [periodo, setPeriodo] = useState('hoy');
  const [mesElegido, setMesElegido] = useState(mesActualISO());
  const [rangoDesde, setRangoDesde] = useState(hoyISO());
  const [rangoHasta, setRangoHasta] = useState(hoyISO());

  const [actual, setActual] = useState(null);
  const [anterior, setAnterior] = useState(null);
  const [rentabilidad, setRentabilidad] = useState([]);
  const [pagosPeriodo, setPagosPeriodo] = useState([]);
  const [pagadoAnterior, setPagadoAnterior] = useState(0);
  const [pendienteTotal, setPendienteTotal] = useState(0);
  const [cargando, setCargando] = useState(true);

  function infoPeriodo() {
    if (periodo === 'mesElegido') {
      return {
        actual: rangoDeMes(mesElegido),
        anterior: rangoDeMes(mesAnteriorA(mesElegido)),
        etiqueta: nombreDeMes(mesElegido),
        comparaCon: 'el mes anterior',
      };
    }
    if (periodo === 'personalizado') {
      const rActual = { desde: rangoDesde, hasta: rangoHasta };
      return {
        actual: rActual,
        anterior: rangoAnteriorEquivalente(rangoDesde, rangoHasta),
        etiqueta: rangoDesde === rangoHasta ? rangoDesde : `${rangoDesde} → ${rangoHasta}`,
        comparaCon: 'el periodo equivalente anterior',
      };
    }
    const p = PERIODOS_FIJOS[periodo];
    return { actual: p.actual(), anterior: p.anterior(), etiqueta: p.etiqueta, comparaCon: p.comparaCon };
  }

  useEffect(() => {
    cargar();
  }, [periodo, mesElegido, rangoDesde, rangoHasta]);

  async function cargar() {
    setCargando(true);
    const { actual: rActual, anterior: rAnterior } = infoPeriodo();

    try {
      const [resumenActual, resumenAnterior, rentabilidadData, pagosActuales, pagosAnteriores, pendientes] = await Promise.all([
        obtenerResumen(rActual.desde, rActual.hasta),
        obtenerResumen(rAnterior.desde, rAnterior.hasta),
        obtenerRentabilidad(rActual.desde, rActual.hasta),
        obtenerPagos(rActual.desde, rActual.hasta),
        obtenerPagos(rAnterior.desde, rAnterior.hasta),
        obtenerPendientes(),
      ]);
      setActual(resumenActual);
      setAnterior(resumenAnterior);
      setRentabilidad(rentabilidadData.productos);
      setPagosPeriodo(pagosActuales);
      setPagadoAnterior(pagosAnteriores.reduce((s, p) => s + Number(p.monto), 0));
      setPendienteTotal(pendientes.reduce((s, p) => s + p.pendiente, 0));
    } finally {
      setCargando(false);
    }
  }

  if (cargando || !actual) {
    return <div className="admin-page"><p className="admin-page__cargando">Cargando dashboard...</p></div>;
  }

  const { etiqueta, comparaCon } = infoPeriodo();
  const deltaIngresos = delta(actual.ingresos, anterior.ingresos);
  const deltaGanancia = delta(actual.gananciaNeta, anterior.gananciaNeta);
  const pagadoPeriodo = pagosPeriodo.reduce((s, p) => s + Number(p.monto), 0);

  const seriesComparativa = [
    { key: 'actual', label: etiqueta, color: chartColors.primary },
    { key: 'anterior', label: `Periodo anterior (${comparaCon})`, color: chartColors.compare },
  ];
  const datosComparativa = [
    { label: 'Ingresos', valores: { actual: actual.ingresos, anterior: anterior.ingresos } },
    { label: 'Costos', valores: { actual: actual.costos, anterior: anterior.costos } },
    { label: 'Pagado', valores: { actual: pagadoPeriodo, anterior: pagadoAnterior } },
    { label: 'Ganancia neta', valores: { actual: actual.gananciaNeta, anterior: anterior.gananciaNeta } },
  ];
  const datosVentas = [
    { label: 'N.º de ventas', valores: { actual: actual.numeroVentas, anterior: anterior.numeroVentas } },
  ];
  const formatoEntero = (v) => Number(v).toFixed(0);

  return (
    <div className="dashboard admin-page">
      <div className="admin-page__header">
        <h1>Dashboard financiero</h1>
      </div>

      <div className="dashboard__filtros">
        <div className="dashboard__selector">
          {Object.entries(PERIODOS_FIJOS).map(([key, p]) => (
            <button
              key={key}
              className={periodo === key ? 'activo' : ''}
              onClick={() => setPeriodo(key)}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>

        <label className={`dashboard__filtro-extra ${periodo === 'mesElegido' ? 'dashboard__filtro-extra--activo' : ''}`}>
          <Calendar size={14} strokeWidth={2} />
          <input
            type="month"
            value={mesElegido}
            max={mesActualISO()}
            onChange={(e) => { setMesElegido(e.target.value); setPeriodo('mesElegido'); }}
          />
        </label>

        <label className={`dashboard__filtro-extra ${periodo === 'personalizado' ? 'dashboard__filtro-extra--activo' : ''}`}>
          <CalendarRange size={14} strokeWidth={2} />
          <input
            type="date"
            value={rangoDesde}
            max={rangoHasta}
            onChange={(e) => { setRangoDesde(e.target.value); setPeriodo('personalizado'); }}
          />
          <span>→</span>
          <input
            type="date"
            value={rangoHasta}
            min={rangoDesde}
            max={hoyISO()}
            onChange={(e) => { setRangoHasta(e.target.value); setPeriodo('personalizado'); }}
          />
        </label>
      </div>

      <div className="dashboard__cards">
        <div className="dashboard__card">
          <span className="dashboard__label">Ingresos</span>
          <span className="dashboard__valor">${actual.ingresos.toFixed(2)}</span>
          {deltaIngresos !== null && (
            <span className={`dashboard__delta ${deltaIngresos.positivo ? 'positivo' : 'negativo'}`}>
              {deltaIngresos.positivo ? <TrendingUp size={13} strokeWidth={2.5} /> : <TrendingDown size={13} strokeWidth={2.5} />}
              {deltaIngresos.texto} vs {comparaCon}
            </span>
          )}
        </div>

        <div className="dashboard__card">
          <span className="dashboard__label">Costos totales</span>
          <span className="dashboard__valor">${actual.costos.toFixed(2)}</span>
          <span className="dashboard__detalle">
            Sueldos ${actual.sueldos.toFixed(2)} · Operativos ${actual.costosOperativos.toFixed(2)} · Variables ${actual.gastosVariables.toFixed(2)}
          </span>
        </div>

        <div className="dashboard__card">
          <span className="dashboard__label">Costos pagados (periodo)</span>
          <span className="dashboard__valor">
            <CheckCircle2 size={16} strokeWidth={2.5} />
            ${pagadoPeriodo.toFixed(2)}
          </span>
          <span className="dashboard__detalle">{pagosPeriodo.length} pago(s) registrado(s)</span>
        </div>

        <div className={`dashboard__card ${pendienteTotal > 0 ? 'negativo' : 'positivo'}`}>
          <span className="dashboard__label">Pendiente por pagar</span>
          <span className="dashboard__valor">
            <Clock size={16} strokeWidth={2.5} />
            ${pendienteTotal.toFixed(2)}
          </span>
          <span className="dashboard__detalle">Suma de costos recurrentes activos con valores pendientes</span>
        </div>

        <div className={`dashboard__card ${actual.gananciaNeta >= 0 ? 'positivo' : 'negativo'}`}>
          <span className="dashboard__label">Ganancia neta</span>
          <span className="dashboard__valor">${actual.gananciaNeta.toFixed(2)}</span>
          {deltaGanancia !== null && (
            <span className={`dashboard__delta ${deltaGanancia.positivo ? 'positivo' : 'negativo'}`}>
              {deltaGanancia.positivo ? <TrendingUp size={13} strokeWidth={2.5} /> : <TrendingDown size={13} strokeWidth={2.5} />}
              {deltaGanancia.texto} vs {comparaCon}
            </span>
          )}
        </div>

        <div className="dashboard__card">
          <span className="dashboard__label">Margen</span>
          <span className="dashboard__valor">{actual.margen.toFixed(1)}%</span>
        </div>

        <div className="dashboard__card">
          <span className="dashboard__label">Ticket promedio</span>
          <span className="dashboard__valor">${actual.ticketPromedio.toFixed(2)}</span>
        </div>

        <div className="dashboard__card">
          <span className="dashboard__label">Número de ventas</span>
          <span className="dashboard__valor">{actual.numeroVentas}</span>
        </div>
      </div>

      <div className="dashboard__seccion dashboard__comparativas">
        <div className="dashboard__comparativa">
          <h2>Comparativa financiera — {etiqueta.toLowerCase()} vs {comparaCon}</h2>
          <BarChart data={datosComparativa} series={seriesComparativa} />
        </div>
        <div className="dashboard__comparativa dashboard__comparativa--ventas">
          <h2>Número de ventas</h2>
          <BarChart data={datosVentas} series={seriesComparativa} format={formatoEntero} />
        </div>
      </div>

      <div className="dashboard__seccion">
        <h2><Wallet size={16} strokeWidth={2} /> Costos pagados — {etiqueta.toLowerCase()}</h2>
        <div className="admin-page__tabla">
          <table>
            <thead><tr><th>Costo</th><th>Periodo cubierto</th><th>Monto</th><th>Registrado por</th><th>Fecha de pago</th></tr></thead>
            <tbody>
              {pagosPeriodo.length === 0 && (
                <tr><td colSpan={5} className="admin-page__vacio">Sin pagos registrados en este periodo</td></tr>
              )}
              {pagosPeriodo.map((p) => (
                <tr key={p.id}>
                  <td>{p.costoRecurrente?.descripcion}</td>
                  <td>{new Date(p.periodoDesde).toLocaleDateString('es-EC')} → {new Date(p.periodoHasta).toLocaleDateString('es-EC')}</td>
                  <td>${Number(p.monto).toFixed(2)}</td>
                  <td>{p.registradoPor?.nombre}</td>
                  <td>{new Date(p.fechaPago).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard__seccion">
        <h2><Trophy size={16} strokeWidth={2} /> Top platos vendidos</h2>
        <div className="admin-page__tabla">
          <table>
            <thead><tr><th>Plato</th><th>Cantidad</th></tr></thead>
            <tbody>
              {actual.topPlatos.length === 0 && (
                <tr><td colSpan={2} className="admin-page__vacio">Sin ventas en este periodo</td></tr>
              )}
              {actual.topPlatos.map((p) => (
                <tr key={p.nombre}><td>{p.nombre}</td><td>{p.cantidad}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard__seccion">
        <h2>Rentabilidad por plato</h2>
        <div className="admin-page__tabla">
          <table>
            <thead>
              <tr>
                <th>Plato</th><th>Precio</th><th>Costo</th><th>Margen</th><th>Vendidos</th><th>Ganancia generada</th>
              </tr>
            </thead>
            <tbody>
              {rentabilidad.map((r) => (
                <tr key={r.productoId}>
                  <td>{r.nombre}</td>
                  <td>${r.precio.toFixed(2)}</td>
                  <td>{r.costoEstimado !== null ? `$${r.costoEstimado.toFixed(2)}` : '—'}</td>
                  <td>{r.margenPorcentual !== null ? `${r.margenPorcentual}%` : '—'}</td>
                  <td>{r.unidadesVendidas}</td>
                  <td>{r.gananciaGenerada !== null ? `$${r.gananciaGenerada.toFixed(2)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
