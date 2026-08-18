import { useEffect, useMemo, useState } from 'react';
import {
  Search, Minus, Plus, X, ShoppingCart, ShoppingBag, Trash2, LayoutGrid,
  Save, Clock, CheckCircle2, Hourglass, ClipboardList, CalendarRange,
} from 'lucide-react';
import { obtenerProductos } from '../../api/productos';
import { obtenerCategorias } from '../../api/categorias';
import { registrarVenta, obtenerVentas } from '../../api/ventas';
import { hoyISO, fechaLocalISO } from '../../utils/fechas';
import { leerCarrito, guardarCarrito, leerPendientes, guardarPendientes } from '../../utils/posStorage';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import Modal from '../../components/modal/Modal';
import './Pos.scss';

export default function Pos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carrito, setCarrito] = useState(leerCarrito);
  const [pendientes, setPendientes] = useState(leerPendientes);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [filtroDesde, setFiltroDesde] = useState(hoyISO());
  const [filtroHasta, setFiltroHasta] = useState(hoyISO());
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [cobrandoId, setCobrandoId] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('');
  const [ultimoAgregado, setUltimoAgregado] = useState(null);
  const [confirmarVaciar, setConfirmarVaciar] = useState(false);
  const [modalGuardarAbierta, setModalGuardarAbierta] = useState(false);
  const [etiquetaPedido, setEtiquetaPedido] = useState('');
  const [pendienteAEliminar, setPendienteAEliminar] = useState(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    cargarVentas();
  }, [filtroDesde, filtroHasta]);

  useEffect(() => { guardarCarrito(carrito); }, [carrito]);
  useEffect(() => { guardarPendientes(pendientes); }, [pendientes]);

  async function cargarProductos() {
    setCargandoProductos(true);
    try {
      const [productosData, categoriasData] = await Promise.all([obtenerProductos(), obtenerCategorias()]);
      setProductos(productosData.filter((p) => p.activo));
      setCategorias(categoriasData);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'No se pudo cargar el menú' });
    } finally {
      setCargandoProductos(false);
    }
  }

  async function cargarVentas() {
    try {
      setVentasFiltradas(await obtenerVentas(filtroDesde, filtroHasta));
    } catch (err) {}
  }

  function irAHoy() {
    setFiltroDesde(hoyISO());
    setFiltroHasta(hoyISO());
  }

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      const coincideCategoria = !categoriaActiva || p.categoriaId === Number(categoriaActiva);
      const coincideTexto = !texto || p.nombre.toLowerCase().includes(texto);
      return coincideCategoria && coincideTexto;
    });
  }, [productos, categoriaActiva, busqueda]);

  function agregarAlCarrito(producto) {
    setCarrito((prev) => {
      const existente = prev.find((i) => i.productoId === producto.id);
      if (existente) {
        return prev.map((i) =>
          i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        { productoId: producto.id, nombre: producto.nombre, precio: Number(producto.precio), cantidad: 1 },
      ];
    });
    setUltimoAgregado(producto.id);
    setTimeout(() => setUltimoAgregado((actual) => (actual === producto.id ? null : actual)), 350);
  }

  function cambiarCantidad(productoId, delta) {
    setCarrito((prev) =>
      prev
        .map((i) => (i.productoId === productoId ? { ...i, cantidad: i.cantidad + delta } : i))
        .filter((i) => i.cantidad > 0)
    );
  }

  function quitarDelCarrito(productoId) {
    setCarrito((prev) => prev.filter((i) => i.productoId !== productoId));
  }

  function vaciarCarrito() {
    setCarrito([]);
    setConfirmarVaciar(false);
  }

  const totalItems = useMemo(() => carrito.reduce((sum, i) => sum + i.cantidad, 0), [carrito]);
  const total = useMemo(() => carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0), [carrito]);

  async function cobrarItems(items) {
    const payload = items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad }));
    await registrarVenta(payload);
    await cargarVentas();
  }

  async function confirmarVenta() {
    if (carrito.length === 0) return;
    setEnviando(true);
    setMensaje(null);

    try {
      await cobrarItems(carrito);
      setMensaje({ tipo: 'ok', texto: 'Venta registrada correctamente' });
      setCarrito([]);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'No se pudo registrar la venta' });
    } finally {
      setEnviando(false);
      setTimeout(() => setMensaje(null), 4000);
    }
  }

  function abrirGuardar() {
    if (carrito.length === 0) return;
    setEtiquetaPedido(`Pedido ${pendientes.length + 1}`);
    setModalGuardarAbierta(true);
  }

  function confirmarGuardarPedido(e) {
    e.preventDefault();
    setPendientes((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        etiqueta: etiquetaPedido.trim() || `Pedido ${prev.length + 1}`,
        items: carrito,
        total,
        creadoEn: new Date().toISOString(),
      },
    ]);
    setCarrito([]);
    setModalGuardarAbierta(false);
  }

  async function cobrarPendiente(pedido) {
    setCobrandoId(pedido.id);
    setMensaje(null);
    try {
      await cobrarItems(pedido.items);
      setPendientes((prev) => prev.filter((p) => p.id !== pedido.id));
      setMensaje({ tipo: 'ok', texto: `"${pedido.etiqueta}" cobrado correctamente` });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'No se pudo cobrar el pedido' });
    } finally {
      setCobrandoId(null);
      setTimeout(() => setMensaje(null), 4000);
    }
  }

  function eliminarPendiente() {
    setPendientes((prev) => prev.filter((p) => p.id !== pendienteAEliminar.id));
    setPendienteAEliminar(null);
  }

  const pedidosFiltrados = useMemo(() => {
    const guardados = pendientes
      .filter((p) => {
        const fechaPedido = fechaLocalISO(p.creadoEn);
        return fechaPedido >= filtroDesde && fechaPedido <= filtroHasta;
      })
      .map((p) => ({
        id: p.id,
        tipo: 'pendiente',
        etiqueta: p.etiqueta,
        items: p.items,
        total: p.total,
        hora: p.creadoEn,
      }));
    const cobrados = ventasFiltradas.map((v) => ({
      id: `venta-${v.id}`,
      tipo: 'cobrado',
      etiqueta: `Venta #${v.id}`,
      items: v.detalles.map((d) => ({ nombre: d.producto?.nombre, cantidad: d.cantidad, precio: Number(d.producto?.precio ?? 0) })),
      total: Number(v.total),
      hora: v.fecha,
      usuario: v.usuario?.nombre,
    }));
    return [...guardados, ...cobrados].sort((a, b) => new Date(b.hora) - new Date(a.hora));
  }, [pendientes, ventasFiltradas, filtroDesde, filtroHasta]);

  const filtroEsHoy = filtroDesde === hoyISO() && filtroHasta === hoyISO();

  return (
    <div className="pos">
      <div className="pos__fila-superior">
      <div className="pos__productos">
        <div className="pos__toolbar">
          <h1>Vender</h1>
          <div className="pos__buscador">
            <Search size={16} strokeWidth={2} />
            <input
              type="text"
              placeholder="Buscar plato..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="pos__tabs">
          <button
            className={`pos__tab ${categoriaActiva === '' ? 'pos__tab--activa' : ''}`}
            onClick={() => setCategoriaActiva('')}
          >
            <LayoutGrid size={14} strokeWidth={2} />
            Todos
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              className={`pos__tab ${categoriaActiva === String(c.id) ? 'pos__tab--activa' : ''}`}
              onClick={() => setCategoriaActiva(String(c.id))}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        {cargandoProductos && <p className="pos__cargando">Cargando menú...</p>}

        {!cargandoProductos && productosFiltrados.length === 0 && (
          <p className="pos__sin-resultados">No hay platos que coincidan con la búsqueda.</p>
        )}

        <div className="pos__grid">
          {productosFiltrados.map((p) => (
            <button
              key={p.id}
              className={`pos__producto ${ultimoAgregado === p.id ? 'pos__producto--agregado' : ''}`}
              onClick={() => agregarAlCarrito(p)}
            >
              <span className="pos__producto-categoria">{p.categoria?.nombre}</span>
              <span className="pos__producto-nombre">{p.nombre}</span>
              <span className="pos__producto-precio">${Number(p.precio).toFixed(2)}</span>
              <span className="pos__producto-agregar"><Plus size={14} strokeWidth={2.5} /></span>
            </button>
          ))}
        </div>
      </div>

      <aside className="pos__carrito">
        <div className="pos__carrito-header">
          <h2>
            <ShoppingCart size={18} strokeWidth={2} />
            Venta actual
            {totalItems > 0 && <span className="pos__carrito-contador">{totalItems}</span>}
          </h2>
          {carrito.length > 0 && (
            <button className="pos__vaciar" onClick={() => setConfirmarVaciar(true)} title="Vaciar carrito" aria-label="Vaciar carrito">
              <Trash2 size={15} strokeWidth={2} />
            </button>
          )}
        </div>

        {carrito.length === 0 && (
          <div className="pos__carrito-vacio">
            <ShoppingCart size={32} strokeWidth={1.5} />
            <p>Toca un producto para agregarlo</p>
          </div>
        )}

        <div className="pos__carrito-items">
          {carrito.map((i) => (
            <div key={i.productoId} className="pos__item">
              <div className="pos__item-info">
                <div>
                  <span className="pos__item-nombre">{i.nombre}</span>
                  <span className="pos__item-precio-unit">${i.precio.toFixed(2)} c/u</span>
                </div>
                <span className="pos__item-subtotal">${(i.precio * i.cantidad).toFixed(2)}</span>
              </div>
              <div className="pos__item-controles">
                <button onClick={() => cambiarCantidad(i.productoId, -1)} aria-label="Restar">
                  <Minus size={13} strokeWidth={2.5} />
                </button>
                <span>{i.cantidad}</span>
                <button onClick={() => cambiarCantidad(i.productoId, 1)} aria-label="Sumar">
                  <Plus size={13} strokeWidth={2.5} />
                </button>
                <button className="pos__item-quitar" onClick={() => quitarDelCarrito(i.productoId)} aria-label="Quitar">
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pos__total">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>

        {mensaje && (
          <div className={`pos__mensaje pos__mensaje--${mensaje.tipo}`}>{mensaje.texto}</div>
        )}

        <div className="pos__acciones-cobro">
          <button
            className="pos__guardar"
            disabled={carrito.length === 0 || enviando}
            onClick={abrirGuardar}
          >
            <Save size={16} strokeWidth={2} />
            Guardar
          </button>
          <button
            className="pos__confirmar"
            disabled={carrito.length === 0 || enviando}
            onClick={confirmarVenta}
          >
            <ShoppingBag size={17} strokeWidth={2} />
            {enviando ? 'Guardando...' : 'Cobrar directo'}
          </button>
        </div>
      </aside>
      </div>

      <div className="pos__pedidos">
        <div className="pos__pedidos-header">
          <h2><ClipboardList size={17} strokeWidth={2} /> Pedidos</h2>
          <div className="pos__pedidos-filtro">
            <button className={filtroEsHoy ? 'activo' : ''} onClick={irAHoy}>Hoy</button>
            <label>
              <CalendarRange size={13} strokeWidth={2} />
              <input type="date" value={filtroDesde} max={filtroHasta} onChange={(e) => setFiltroDesde(e.target.value)} />
              <span>→</span>
              <input type="date" value={filtroHasta} min={filtroDesde} max={hoyISO()} onChange={(e) => setFiltroHasta(e.target.value)} />
            </label>
          </div>
        </div>

        {pedidosFiltrados.length === 0 && (
          <p className="pos__sin-resultados">No hay pedidos guardados ni ventas cobradas en este rango.</p>
        )}

        <div className="pos__pedidos-grid">
          {pedidosFiltrados.map((pedido) => (
            <div key={pedido.id} className="pos__pedido">
              <span className={`pos__pedido-sello ${pedido.tipo === 'cobrado' ? 'pos__pedido-sello--cobrado' : 'pos__pedido-sello--pendiente'}`}>
                {pedido.tipo === 'cobrado' ? <CheckCircle2 size={11} strokeWidth={2.5} /> : <Hourglass size={11} strokeWidth={2.5} />}
                {pedido.tipo === 'cobrado' ? 'Cobrado' : 'Pendiente'}
              </span>

              <div className="pos__pedido-header">
                <strong>{pedido.etiqueta}</strong>
                <span className="pos__pedido-hora">
                  <Clock size={11} strokeWidth={2} />
                  {new Date(pedido.hora).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                  {', '}
                  {new Date(pedido.hora).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <ul className="pos__pedido-items">
                {pedido.items.map((it, idx) => (
                  <li key={idx}>
                    <span>{it.cantidad}× {it.nombre}</span>
                    <span>${(it.precio * it.cantidad).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <div className="pos__pedido-total">
                <span>Total</span>
                <span>${pedido.total.toFixed(2)}</span>
              </div>

              {pedido.tipo === 'pendiente' && (
                <div className="pos__pedido-acciones">
                  <button
                    className="pos__pedido-cobrar"
                    disabled={cobrandoId === pedido.id}
                    onClick={() => cobrarPendiente(pedido)}
                  >
                    {cobrandoId === pedido.id ? 'Cobrando...' : 'Cobrar'}
                  </button>
                  <button
                    className="pos__pedido-eliminar"
                    onClick={() => setPendienteAEliminar(pedido)}
                    title="Descartar pedido"
                    aria-label="Descartar pedido"
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {confirmarVaciar && (
        <ConfirmModal
          titulo="Vaciar carrito"
          mensaje="¿Quitar todos los productos de la venta actual?"
          onConfirmar={vaciarCarrito}
          onCancelar={() => setConfirmarVaciar(false)}
        />
      )}

      {pendienteAEliminar && (
        <ConfirmModal
          titulo="Descartar pedido"
          mensaje={`¿Descartar "${pendienteAEliminar.etiqueta}"? Esta acción no se puede deshacer.`}
          onConfirmar={eliminarPendiente}
          onCancelar={() => setPendienteAEliminar(null)}
        />
      )}

      {modalGuardarAbierta && (
        <Modal titulo="Guardar pedido" onClose={() => setModalGuardarAbierta(false)}>
          <form className="pos__form-guardar form-producto" onSubmit={confirmarGuardarPedido}>
            <label htmlFor="etiqueta-pedido">Nombre del pedido</label>
            <input
              id="etiqueta-pedido"
              type="text"
              value={etiquetaPedido}
              onChange={(e) => setEtiquetaPedido(e.target.value)}
              placeholder="Ej. Mesa 3, Para llevar..."
              autoFocus
            />
            <p className="pos__form-guardar-nota">
              Queda como pendiente, sin cobrar todavía. Podrás cobrarlo después desde "Pedidos de hoy".
            </p>
            <button type="submit">Guardar pedido</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
