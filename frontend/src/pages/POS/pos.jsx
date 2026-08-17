import { useEffect, useMemo, useState } from 'react';
import { obtenerProductos } from '../../api/productos';
import { registrarVenta } from '../../api/ventas';
import './Pos.scss';

export default function Pos() {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]); // [{ productoId, nombre, precio, cantidad }]
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { tipo: 'ok' | 'error', texto }

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    setCargandoProductos(true);
    try {
      const data = await obtenerProductos();
      setProductos(data.filter((p) => p.activo));
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'No se pudo cargar el menú' });
    } finally {
      setCargandoProductos(false);
    }
  }

  // Agrupa productos por categoría, para mostrarlos organizados
  const productosPorCategoria = useMemo(() => {
    const grupos = {};
    productos.forEach((p) => {
      const cat = p.categoria?.nombre || 'Otros';
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(p);
    });
    return grupos;
  }, [productos]);

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

  const total = useMemo(
    () => carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
    [carrito]
  );

  async function confirmarVenta() {
    if (carrito.length === 0) return;
    setEnviando(true);
    setMensaje(null);

    try {
      const items = carrito.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad }));
      await registrarVenta(items);
      setMensaje({ tipo: 'ok', texto: 'Venta registrada correctamente' });
      setCarrito([]);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'No se pudo registrar la venta' });
    } finally {
      setEnviando(false);
      setTimeout(() => setMensaje(null), 4000);
    }
  }

  return (
    <div className="pos">
      <div className="pos__productos">
        <h1>Vender</h1>

        {cargandoProductos && <p className="pos__cargando">Cargando menú...</p>}

        {!cargandoProductos &&
          Object.entries(productosPorCategoria).map(([categoria, items]) => (
            <div key={categoria} className="pos__categoria">
              <h2>{categoria}</h2>
              <div className="pos__grid">
                {items.map((p) => (
                  <button key={p.id} className="pos__producto" onClick={() => agregarAlCarrito(p)}>
                    <span className="pos__producto-nombre">{p.nombre}</span>
                    <span className="pos__producto-precio">${Number(p.precio).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
      </div>

      <aside className="pos__carrito">
        <h2>Venta actual</h2>

        {carrito.length === 0 && <p className="pos__carrito-vacio">Toca un producto para agregarlo</p>}

        <div className="pos__carrito-items">
          {carrito.map((i) => (
            <div key={i.productoId} className="pos__item">
              <div className="pos__item-info">
                <span className="pos__item-nombre">{i.nombre}</span>
                <span className="pos__item-subtotal">${(i.precio * i.cantidad).toFixed(2)}</span>
              </div>
              <div className="pos__item-controles">
                <button onClick={() => cambiarCantidad(i.productoId, -1)}>−</button>
                <span>{i.cantidad}</span>
                <button onClick={() => cambiarCantidad(i.productoId, 1)}>+</button>
                <button className="pos__item-quitar" onClick={() => quitarDelCarrito(i.productoId)}>✕</button>
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

        <button
          className="pos__confirmar"
          disabled={carrito.length === 0 || enviando}
          onClick={confirmarVenta}
        >
          {enviando ? 'Guardando...' : 'Cobrar'}
        </button>
      </aside>
    </div>
  );
}