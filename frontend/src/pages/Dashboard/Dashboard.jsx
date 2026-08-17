import { useEffect, useState } from 'react';
import { obtenerResumen, obtenerRentabilidad } from '../../api/dashboard';
import { rangoHoy, rangoAyer, rangoSemanaActual, rangoSemanaAnterior, rangoMesActual, rangoMesAnterior } from '../../utils/fechas';
import './Dashboard.scss';

const PERIODOS = {
  hoy: { actual: rangoHoy, anterior: rangoAyer, etiqueta: 'Hoy', comparaCon: 'ayer' },
  semana: { actual: rangoSemanaActual, anterior: rangoSemanaAnterior, etiqueta: 'Esta semana', comparaCon: 'semana pasada' },
  mes: { actual: rangoMesActual, anterior: rangoMesAnterior, etiqueta: 'Este mes', comparaCon: 'mes pasado' },
};

function delta(actual, anterior) {
  if (!anterior) return null;
  return (((actual - anterior) / Math.abs(anterior)) * 100).toFixed(1);
}

export default function Dashboard() {
  const [periodo, setPeriodo] = useState('hoy');
  const [actual, setActual] = useState(null);
  const [anterior, setAnterior] = useState(null);
  const [rentabilidad, setRentabilidad] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, [periodo]);

  async function cargar() {
    setCargando(true);
    const { actual: rangoActualFn, anterior: rangoAnteriorFn } = PERIODOS[periodo];
    const rActual = rangoActualFn();
    const rAnterior = rangoAnteriorFn();

    try {
      const [resumenActual, resumenAnterior, rentabilidadData] = await Promise.all([
        obtenerResumen(rActual.desde, rActual.hasta),
        obtenerResumen(rAnterior.desde, rAnterior.hasta),
        obtenerRentabilidad(rActual.desde, rActual.hasta),
      ]);
      setActual(resumenActual);
      setAnterior(resumenAnterior);
      setRentabilidad(rentabilidadData.productos);
    } finally {
      setCargando(false);
    }
  }

  if (cargando || !actual) {
    return <div className="admin-page"><p className="admin-page__cargando">Cargando dashboard...</p></div>;
  }

  const deltaIngresos = delta(actual.ingresos, anterior.ingresos);
  const deltaGanancia = delta(actual.gananciaNeta, anterior.gananciaNeta);

  return (
    <div className="dashboard admin-page">
      <div className="admin-page__header">
        <h1>Dashboard financiero</h1>
        <div className="dashboard__selector">
          {Object.entries(PERIODOS).map(([key, p]) => (
            <button
              key={key}
              className={periodo === key ? 'activo' : ''}
              onClick={() => setPeriodo(key)}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard__cards">
        <div className="dashboard__card">
          <span className="dashboard__label">Ingresos</span>
          <span className="dashboard__valor">${actual.ingresos.toFixed(2)}</span>
          {deltaIngresos !== null && (
            <span className={`dashboard__delta ${deltaIngresos >= 0 ? 'positivo' : 'negativo'}`}>
              {deltaIngresos >= 0 ? '▲' : '▼'} {Math.abs(deltaIngresos)}% vs {PERIODOS[periodo].comparaCon}
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

        <div className={`dashboard__card ${actual.gananciaNeta >= 0 ? 'positivo' : 'negativo'}`}>
          <span className="dashboard__label">Ganancia neta</span>
          <span className="dashboard__valor">${actual.gananciaNeta.toFixed(2)}</span>
          {deltaGanancia !== null && (
            <span className={`dashboard__delta ${deltaGanancia >= 0 ? 'positivo' : 'negativo'}`}>
              {deltaGanancia >= 0 ? '▲' : '▼'} {Math.abs(deltaGanancia)}% vs {PERIODOS[periodo].comparaCon}
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

      <div className="dashboard__seccion">
        <h2>Top platos vendidos</h2>
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