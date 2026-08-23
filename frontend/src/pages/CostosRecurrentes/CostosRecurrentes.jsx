import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Pencil, Power, PowerOff, Repeat, Wallet, CheckCircle2,
  Clock, CalendarRange, CreditCard, Receipt, ArrowUp, ArrowDown, ArrowUpDown, Trash2,
} from 'lucide-react';
import {
  obtenerCostosRecurrentes, desactivarCostoRecurrente, activarCostoRecurrente, obtenerPendientes, eliminarCostoRecurrente,
} from '../../api/costosRecurrentes';
import { obtenerPagos, registrarPago, registrarPagoPorDias, registrarPagoCompleto, eliminarPago } from '../../api/pagosCostosRecurrentes';
import { obtenerDias, invalidarDia, agregarDiaExtra, quitarExcepcionDia } from '../../api/diasCostoRecurrente';
import { rangoSemanaActual, rangoMesActual, hoyISO, diasEntre } from '../../utils/fechas';
import Modal from '../../components/modal/Modal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import FormularioCostoRecurrente from '../../components/FormularioCostoRecurrente/FormularioCostoRecurrente';
import '../../styles/_admin.scss';
import './CostosRecurrentes.scss';

const TITULO_ESTADO = {
  PENDIENTE: 'Pendiente de pago — clic para descontar (falta/permiso)',
  NO_APLICA: 'Fin de semana — clic para agregarlo como día extra trabajado',
  EXTRA_PENDIENTE: 'Día extra agregado, pendiente de pago — clic para quitarlo',
  INVALIDO: 'Descontado — clic para reactivarlo',
  PAGADO: 'Ya pagado — bloqueado, no se puede modificar',
};

function claseEstado(estado) {
  return estado.toLowerCase().replace(/_/g, '-');
}

export default function CostosRecurrentes() {
  const [costos, setCostos] = useState([]);
  const [pendientes, setPendientes] = useState({});
  const [cargando, setCargando] = useState(true);
  const [modalAbierta, setModalAbierta] = useState(false);
  const [editando, setEditando] = useState(null);
  const [ordenEstado, setOrdenEstado] = useState('ninguno');

  const [costoPagoId, setCostoPagoId] = useState('');
  const [modoPeriodo, setModoPeriodo] = useState('semana');
  const [pagoDesde, setPagoDesde] = useState(rangoSemanaActual().desde);
  const [pagoHasta, setPagoHasta] = useState(rangoSemanaActual().hasta);
  const [registrando, setRegistrando] = useState(false);
  const [mensajePago, setMensajePago] = useState(null);

  const [dias, setDias] = useState([]);
  const [cargandoDias, setCargandoDias] = useState(false);
  const [accionEnCurso, setAccionEnCurso] = useState(null);
  const [notaModal, setNotaModal] = useState(null);
  const [notaTexto, setNotaTexto] = useState('');

  const [pagos, setPagos] = useState([]);
  const [filtroDesde, setFiltroDesde] = useState(hoyISO());
  const [filtroHasta, setFiltroHasta] = useState(hoyISO());
  const [pagoDetalle, setPagoDetalle] = useState(null);
  const [pagoAEliminar, setPagoAEliminar] = useState(null);
  const [costoAEliminar, setCostoAEliminar] = useState(null);
  const [notaEliminarCosto, setNotaEliminarCosto] = useState(null);

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    cargarPagos();
  }, [filtroDesde, filtroHasta]);

  async function cargar() {
    setCargando(true);
    try {
      const [costosData, pendientesData] = await Promise.all([obtenerCostosRecurrentes(), obtenerPendientes()]);
      setCostos(costosData);
      const mapa = {};
      pendientesData.forEach((p) => { mapa[p.costoRecurrenteId] = p; });
      setPendientes(mapa);
    } finally {
      setCargando(false);
    }
  }

  async function cargarPagos() {
    setPagos(await obtenerPagos(filtroDesde, filtroHasta));
  }

  function irAHoy() {
    setFiltroDesde(hoyISO());
    setFiltroHasta(hoyISO());
  }

  function cicloOrdenEstado() {
    setOrdenEstado((prev) => (prev === 'ninguno' ? 'activos' : prev === 'activos' ? 'inactivos' : 'ninguno'));
  }

  function abrirCrear() { setEditando(null); setModalAbierta(true); }
  function abrirEditar(c) { setEditando(c); setModalAbierta(true); }

  async function handleToggle(c) {
    if (c.activo) await desactivarCostoRecurrente(c.id);
    else await activarCostoRecurrente(c.id);
    cargar();
  }

  function handleGuardado() { setModalAbierta(false); cargar(); }

  function abrirEliminarCosto(c) {
    setNotaEliminarCosto(null);
    setCostoAEliminar(c);
  }

  async function confirmarEliminarCosto() {
    try {
      await eliminarCostoRecurrente(costoAEliminar.id);
      setCostoAEliminar(null);
      cargar();
    } catch (err) {
      setNotaEliminarCosto(err.response?.data?.error || 'No se pudo eliminar el costo');
    }
  }

  const costosOrdenados = useMemo(() => {
    const lista = [...costos];
    if (ordenEstado === 'activos') lista.sort((a, b) => Number(b.activo) - Number(a.activo));
    else if (ordenEstado === 'inactivos') lista.sort((a, b) => Number(a.activo) - Number(b.activo));
    return lista;
  }, [costos, ordenEstado]);

  const costosActivos = useMemo(() => costos.filter((c) => c.activo), [costos]);
  const costoSeleccionado = costosActivos.find((c) => c.id === Number(costoPagoId));
  const esSueldoDiario = costoSeleccionado?.tipo === 'SUELDO' && costoSeleccionado?.frecuencia === 'DIARIO';

  function seleccionarCosto(id) {
    setCostoPagoId(id);
    const costo = costosActivos.find((c) => c.id === Number(id));
    const esNuevoSueldoDiario = costo?.tipo === 'SUELDO' && costo?.frecuencia === 'DIARIO';
    setModoPeriodo(esNuevoSueldoDiario ? 'todo' : 'semana');
    setNotaModal(null);
    setMensajePago(null);
  }

  const rangoPago = useMemo(() => {
    if (modoPeriodo === 'semana') return rangoSemanaActual();
    if (modoPeriodo === 'mes') return rangoMesActual();
    if (modoPeriodo === 'todo') return null;
    return { desde: pagoDesde, hasta: pagoHasta };
  }, [modoPeriodo, pagoDesde, pagoHasta]);

  useEffect(() => {
    if (!esSueldoDiario || !costoSeleccionado) { setDias([]); return; }
    cargarDias();
  }, [costoSeleccionado?.id, modoPeriodo, pagoDesde, pagoHasta]);

  async function cargarDias() {
    setCargandoDias(true);
    try {
      if (rangoPago) setDias(await obtenerDias(costoSeleccionado.id, rangoPago.desde, rangoPago.hasta));
      else setDias(await obtenerDias(costoSeleccionado.id));
    } finally {
      setCargandoDias(false);
    }
  }

  const diasContables = useMemo(
    () => dias.filter((d) => d.estado === 'PENDIENTE' || d.estado === 'EXTRA_PENDIENTE'),
    [dias]
  );

  const montoPreview = useMemo(() => {
    if (!costoSeleccionado) return 0;
    if (esSueldoDiario) return diasContables.length * Number(costoSeleccionado.monto);
    if (!rangoPago) return 0;
    const numDias = diasEntre(rangoPago.desde, rangoPago.hasta);
    if (numDias <= 0) return 0;
    const monto = Number(costoSeleccionado.monto);
    const prorrateado = costoSeleccionado.frecuencia === 'DIARIO' ? monto * numDias : (monto / 30) * numDias;
    const pendienteActual = pendientes[costoSeleccionado.id]?.pendiente;
    return pendienteActual != null ? Math.min(prorrateado, pendienteActual) : prorrateado;
  }, [costoSeleccionado, esSueldoDiario, diasContables, rangoPago, pendientes]);

  async function toggleDia(dia) {
    if (dia.estado === 'PAGADO' || accionEnCurso) return;

    if (dia.estado === 'PENDIENTE') {
      setNotaModal({ fecha: dia.fecha });
      setNotaTexto('');
      return;
    }

    setAccionEnCurso(dia.fecha);
    try {
      if (dia.estado === 'INVALIDO' || dia.estado === 'EXTRA_PENDIENTE') {
        await quitarExcepcionDia(costoSeleccionado.id, dia.fecha);
      } else if (dia.estado === 'NO_APLICA') {
        await agregarDiaExtra(costoSeleccionado.id, dia.fecha);
      }
      await cargarDias();
    } catch (err) {
      setMensajePago({ tipo: 'error', texto: err.response?.data?.error || 'No se pudo actualizar el día' });
    } finally {
      setAccionEnCurso(null);
    }
  }

  async function confirmarNota(e) {
    e.preventDefault();
    if (!notaModal || !notaTexto.trim()) return;
    setAccionEnCurso(notaModal.fecha);
    try {
      await invalidarDia(costoSeleccionado.id, notaModal.fecha, notaTexto.trim());
      setNotaModal(null);
      setNotaTexto('');
      await cargarDias();
    } catch (err) {
      setMensajePago({ tipo: 'error', texto: err.response?.data?.error || 'No se pudo descontar el día' });
    } finally {
      setAccionEnCurso(null);
    }
  }

  async function handleRegistrarPago() {
    if (!costoSeleccionado) return;
    setRegistrando(true);
    setMensajePago(null);
    try {
      if (esSueldoDiario) {
        const fechas = diasContables.map((d) => d.fecha);
        if (fechas.length === 0) {
          setMensajePago({ tipo: 'error', texto: 'No hay días pendientes para pagar en este rango' });
          return;
        }
        await registrarPagoPorDias(costoSeleccionado.id, fechas);
      } else {
        await registrarPago(costoSeleccionado.id, rangoPago.desde, rangoPago.hasta);
      }
      setMensajePago({ tipo: 'ok', texto: `Pago de "${costoSeleccionado.descripcion}" registrado correctamente` });
      seleccionarCosto('');
      cargar();
      cargarPagos();
    } catch (err) {
      setMensajePago({ tipo: 'error', texto: err.response?.data?.error || 'No se pudo registrar el pago' });
    } finally {
      setRegistrando(false);
      setTimeout(() => setMensajePago(null), 4000);
    }
  }

  async function handlePagarCompleto() {
    if (!costoSeleccionado) return;
    setRegistrando(true);
    setMensajePago(null);
    try {
      await registrarPagoCompleto(costoSeleccionado.id);
      setMensajePago({ tipo: 'ok', texto: `"${costoSeleccionado.descripcion}" pagado por completo` });
      seleccionarCosto('');
      cargar();
      cargarPagos();
    } catch (err) {
      setMensajePago({ tipo: 'error', texto: err.response?.data?.error || 'No se pudo registrar el pago' });
    } finally {
      setRegistrando(false);
      setTimeout(() => setMensajePago(null), 4000);
    }
  }

  async function confirmarEliminarPago() {
    await eliminarPago(pagoAEliminar.id);
    setPagoAEliminar(null);
    setPagoDetalle(null);
    cargar();
    cargarPagos();
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Costos recurrentes</h1>
        <button className="admin-page__agregar" onClick={abrirCrear}>
          <Plus size={16} strokeWidth={2.5} />
          Agregar
        </button>
      </div>

      {cargando && <p className="admin-page__cargando">Cargando...</p>}

      {!cargando && (
        <div className="admin-page__tabla">
          <table>
            <thead>
              <tr>
                <th>Descripción</th><th>Tipo</th><th>Monto</th><th>Frecuencia</th>
                <th className="admin-page__th-ordenable" onClick={cicloOrdenEstado} title="Clic para ordenar por estado">
                  <span>
                    Estado
                    {ordenEstado === 'activos' && <ArrowUp size={12} strokeWidth={2.5} />}
                    {ordenEstado === 'inactivos' && <ArrowDown size={12} strokeWidth={2.5} />}
                    {ordenEstado === 'ninguno' && <ArrowUpDown size={12} strokeWidth={2} />}
                  </span>
                </th>
                <th>Pendiente</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {costos.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-page__vacio">
                    <Repeat size={22} strokeWidth={1.5} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.5 }} />
                    Sin costos registrados
                  </td>
                </tr>
              )}
              {costosOrdenados.map((c) => {
                const p = pendientes[c.id];
                return (
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
                    <td>
                      {p ? (
                        <span className={`admin-page__badge ${p.pendiente > 0 ? 'admin-page__badge--inactivo' : 'admin-page__badge--activo'}`}>
                          {p.pendiente > 0 ? `$${p.pendiente.toFixed(2)}` : 'Al día'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="admin-page__acciones">
                      <button className="editar" onClick={() => abrirEditar(c)} title="Editar" aria-label="Editar">
                        <Pencil size={15} strokeWidth={2} />
                      </button>
                      <button
                        className={c.activo ? 'desactivar' : 'activar'}
                        onClick={() => handleToggle(c)}
                        title={c.activo ? 'Desactivar' : 'Activar'}
                        aria-label={c.activo ? 'Desactivar' : 'Activar'}
                      >
                        {c.activo ? <PowerOff size={15} strokeWidth={2} /> : <Power size={15} strokeWidth={2} />}
                      </button>
                      <button
                        className="eliminar"
                        onClick={() => abrirEliminarCosto(c)}
                        title="Eliminar"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="costos__pago-panel">
        <h2><CreditCard size={17} strokeWidth={2} /> Registrar pago</h2>

        <div className="costos__pago-form">
          <label className="costos__pago-campo">
            <span>Costo</span>
            <select value={costoPagoId} onChange={(e) => seleccionarCosto(e.target.value)}>
              <option value="">Selecciona un costo…</option>
              {costosActivos.map((c) => (
                <option key={c.id} value={c.id}>{c.descripcion} (${Number(c.monto).toFixed(2)} {c.frecuencia === 'DIARIO' ? '/día' : '/mes'})</option>
              ))}
            </select>
          </label>

          {costoSeleccionado && pendientes[costoSeleccionado.id] && (
            <div className="costos__pendiente-actual">
              <Clock size={13} strokeWidth={2} />
              Pendiente actualmente: <strong>${pendientes[costoSeleccionado.id].pendiente.toFixed(2)}</strong>
              {pendientes[costoSeleccionado.id].pendienteDesde && (
                <>
                  {' '}(desde el {new Date(`${pendientes[costoSeleccionado.id].pendienteDesde}T00:00:00`).toLocaleDateString('es-EC', { day: '2-digit', month: 'long' })}
                  {' hasta hoy '}
                  {new Date(`${pendientes[costoSeleccionado.id].pendienteHasta}T00:00:00`).toLocaleDateString('es-EC', { day: '2-digit', month: 'long' })})
                </>
              )}
            </div>
          )}

          <div className="costos__pago-periodo">
            <div className="costos__pago-pills">
              {esSueldoDiario && (
                <button className={modoPeriodo === 'todo' ? 'activo' : ''} onClick={() => setModoPeriodo('todo')}>Todo el historial</button>
              )}
              <button className={modoPeriodo === 'semana' ? 'activo' : ''} onClick={() => setModoPeriodo('semana')}>Esta semana</button>
              <button className={modoPeriodo === 'mes' ? 'activo' : ''} onClick={() => setModoPeriodo('mes')}>Este mes</button>
              <button className={modoPeriodo === 'rango' ? 'activo' : ''} onClick={() => setModoPeriodo('rango')}>
                {esSueldoDiario ? 'Rango / día específico' : 'Rango personalizado'}
              </button>
            </div>

            {modoPeriodo === 'rango' && (
              <label className="costos__pago-rango">
                <CalendarRange size={14} strokeWidth={2} />
                <input type="date" value={pagoDesde} max={pagoHasta} onChange={(e) => setPagoDesde(e.target.value)} />
                <span>→</span>
                <input type="date" value={pagoHasta} min={pagoDesde} max={hoyISO()} onChange={(e) => setPagoHasta(e.target.value)} />
              </label>
            )}
          </div>

          {esSueldoDiario && (
            <div className="costos__dias-ledger">
              {cargandoDias && <p className="admin-page__cargando">Cargando días...</p>}
              {!cargandoDias && dias.length === 0 && <p className="admin-page__vacio">Sin días en este rango.</p>}

              {!cargandoDias && dias.length > 0 && (
                <>
                  <div className="costos__dias-detalle">
                    {dias.map((d) => (
                      <button
                        type="button"
                        key={d.fecha}
                        disabled={d.estado === 'PAGADO' || accionEnCurso === d.fecha}
                        className={`costos__dia costos__dia--${claseEstado(d.estado)}`}
                        onClick={() => toggleDia(d)}
                        title={d.estado === 'INVALIDO' && d.nota ? `Descontado: ${d.nota}` : TITULO_ESTADO[d.estado]}
                      >
                        {new Date(`${d.fecha}T00:00:00`).toLocaleDateString('es-EC', { weekday: 'short', day: '2-digit', month: 'short' })}
                        {d.estado === 'PAGADO' && <CheckCircle2 size={11} strokeWidth={2.5} />}
                      </button>
                    ))}
                  </div>
                  <div className="costos__dias-leyenda">
                    <span><i className="costos__dia--pendiente" />Lunes a viernes</span>
                    <span><i className="costos__dia--extra-pendiente" />Extra agregado</span>
                    <span><i className="costos__dia--invalido" />Descontado</span>
                    <span><i className="costos__dia--pagado" />Pagado</span>
                    <span><i className="costos__dia--no-aplica" />Fin de semana</span>
                  </div>
                </>
              )}
            </div>
          )}

          {costoSeleccionado && (
            <div className="costos__pago-preview">
              {esSueldoDiario ? (
                <>Se pagarán <strong>{diasContables.length}</strong> día(s) pendiente(s) — Monto: <strong>${montoPreview.toFixed(2)}</strong></>
              ) : (
                rangoPago && (
                  <>
                    Se pagará del <strong>{rangoPago.desde}</strong> al <strong>{rangoPago.hasta}</strong>
                    {' '}({diasEntre(rangoPago.desde, rangoPago.hasta)} días) — Monto: <strong>${montoPreview.toFixed(2)}</strong>
                  </>
                )
              )}
            </div>
          )}

          {mensajePago && (
            <p className={mensajePago.tipo === 'ok' ? 'costos__pago-ok' : 'costos__pago-error'}>{mensajePago.texto}</p>
          )}

          <div className="costos__pago-acciones">
            <button
              className="costos__pago-boton"
              disabled={!costoSeleccionado || montoPreview <= 0 || registrando}
              onClick={handleRegistrarPago}
            >
              {registrando ? 'Registrando...' : 'Registrar pago'}
            </button>

            {costoSeleccionado && !esSueldoDiario && pendientes[costoSeleccionado.id]?.pendiente > 0 && (
              <button
                className="costos__pago-boton-completo"
                disabled={registrando}
                onClick={handlePagarCompleto}
              >
                Pagar completo (${pendientes[costoSeleccionado.id].pendiente.toFixed(2)})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="costos__pagos-seccion">
        <div className="costos__pagos-header">
          <h2><Wallet size={17} strokeWidth={2} /> Pagos registrados</h2>
          <div className="costos__pago-pills">
            <button className={filtroDesde === hoyISO() && filtroHasta === hoyISO() ? 'activo' : ''} onClick={irAHoy}>Hoy</button>
            <label className="costos__pago-rango">
              <CalendarRange size={13} strokeWidth={2} />
              <input type="date" value={filtroDesde} max={filtroHasta} onChange={(e) => setFiltroDesde(e.target.value)} />
              <span>→</span>
              <input type="date" value={filtroHasta} min={filtroDesde} max={hoyISO()} onChange={(e) => setFiltroHasta(e.target.value)} />
            </label>
          </div>
        </div>

        {pagos.length === 0 && (
          <p className="admin-page__vacio">
            <Receipt size={22} strokeWidth={1.5} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.5 }} />
            No hay pagos registrados en este rango.
          </p>
        )}

        <div className="costos__pagos-grid">
          {pagos.map((pago) => (
            <button key={pago.id} type="button" className="costos__pago-card" onClick={() => setPagoDetalle(pago)}>
              <span className="costos__pago-sello">
                <CheckCircle2 size={11} strokeWidth={2.5} />
                Pagado
              </span>

              <strong>{pago.costoRecurrente?.descripcion}</strong>
              <span className="costos__pago-periodo-texto">
                {new Date(pago.periodoDesde).toLocaleDateString('es-EC')} → {new Date(pago.periodoHasta).toLocaleDateString('es-EC')}
              </span>

              <div className="costos__pago-monto">${Number(pago.monto).toFixed(2)}</div>

              <span className="costos__pago-meta">
                Registrado por {pago.registradoPor?.nombre} · {new Date(pago.fechaPago).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}, {new Date(pago.fechaPago).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </button>
          ))}
        </div>
      </div>

      {modalAbierta && (
        <Modal titulo={editando ? 'Editar costo' : 'Agregar costo recurrente'} onClose={() => setModalAbierta(false)}>
          <FormularioCostoRecurrente costoExistente={editando} onGuardado={handleGuardado} />
        </Modal>
      )}

      {notaModal && (
        <Modal titulo="Descontar día" onClose={() => setNotaModal(null)}>
          <form className="pos__form-guardar form-producto" onSubmit={confirmarNota}>
            <label htmlFor="nota-descuento">
              ¿Por qué se descuenta el {new Date(`${notaModal.fecha}T00:00:00`).toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: 'long' })}?
            </label>
            <input
              id="nota-descuento"
              type="text"
              value={notaTexto}
              onChange={(e) => setNotaTexto(e.target.value)}
              placeholder="Ej. Falta injustificada, permiso, descuento por..."
              autoFocus
              required
            />
            <button type="submit" disabled={!notaTexto.trim()}>Descontar día</button>
          </form>
        </Modal>
      )}

      {pagoDetalle && (
        <Modal titulo="Detalle del pago" onClose={() => setPagoDetalle(null)}>
          <div className="costos__detalle-pago">
            <div className="costos__detalle-fila">
              <span>Costo</span>
              <strong>{pagoDetalle.costoRecurrente?.descripcion}</strong>
            </div>
            <div className="costos__detalle-fila">
              <span>Tipo</span>
              <strong>{pagoDetalle.costoRecurrente?.tipo === 'SUELDO' ? 'Sueldo' : 'Operativo'}</strong>
            </div>
            <div className="costos__detalle-fila">
              <span>Periodo cubierto</span>
              <strong>
                {new Date(pagoDetalle.periodoDesde).toLocaleDateString('es-EC')} → {new Date(pagoDetalle.periodoHasta).toLocaleDateString('es-EC')}
              </strong>
            </div>
            <div className="costos__detalle-fila">
              <span>Monto total</span>
              <strong>${Number(pagoDetalle.monto).toFixed(2)}</strong>
            </div>
            <div className="costos__detalle-fila">
              <span>Registrado por</span>
              <strong>{pagoDetalle.registradoPor?.nombre}</strong>
            </div>
            <div className="costos__detalle-fila">
              <span>Fecha de registro</span>
              <strong>
                {new Date(pagoDetalle.fechaPago).toLocaleDateString('es-EC')}, {new Date(pagoDetalle.fechaPago).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
              </strong>
            </div>

            {pagoDetalle.dias?.length > 0 && (
              <div className="costos__detalle-dias">
                <span>Días pagados ({pagoDetalle.dias.length})</span>
                <div className="costos__dias-detalle">
                  {pagoDetalle.dias.map((f) => (
                    <span key={f} className="costos__dia costos__dia--pagado">
                      {new Date(`${f}T00:00:00`).toLocaleDateString('es-EC', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {pagoDetalle.diasInvalidos?.length > 0 && (
              <div className="costos__detalle-dias">
                <span>Días descontados ({pagoDetalle.diasInvalidos.length})</span>
                <div className="costos__dias-invalidos-lista">
                  {pagoDetalle.diasInvalidos.map((d) => (
                    <div key={d.fecha} className="costos__dia-invalido-fila">
                      <span className="costos__dia costos__dia--invalido">
                        {new Date(`${d.fecha}T00:00:00`).toLocaleDateString('es-EC', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </span>
                      <span className="costos__dia-invalido-nota">{d.nota}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="costos__pago-eliminar" onClick={() => setPagoAEliminar(pagoDetalle)}>
              <Trash2 size={14} strokeWidth={2} />
              Eliminar este pago
            </button>
          </div>
        </Modal>
      )}

      {pagoAEliminar && (
        <ConfirmModal
          titulo="Eliminar pago"
          mensaje={`¿Eliminar el pago de "${pagoAEliminar.costoRecurrente?.descripcion}" por $${Number(pagoAEliminar.monto).toFixed(2)}? Quedará como si no se hubiera pagado — el monto vuelve a sumarse a lo pendiente. Esta acción no se puede deshacer.`}
          onConfirmar={confirmarEliminarPago}
          onCancelar={() => setPagoAEliminar(null)}
        />
      )}

      {costoAEliminar && (
        <ConfirmModal
          titulo="Eliminar costo recurrente"
          mensaje={`¿Eliminar "${costoAEliminar.descripcion}" por completo? Esta acción no se puede deshacer.`}
          nota={notaEliminarCosto}
          onConfirmar={confirmarEliminarCosto}
          onCancelar={() => setCostoAEliminar(null)}
        />
      )}
    </div>
  );
}
