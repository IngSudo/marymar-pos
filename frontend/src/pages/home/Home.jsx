import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { obtenerProductos } from '../../api/productos';
import { obtenerCategorias } from '../../api/categorias';
import { obtenerResumen } from '../../api/dashboard';
import Modal from '../../components/Modal/Modal';
import FormularioProducto from '../../components/FormularioProducto/FormularioProducto';
import './Home.scss';

export default function Home() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'ADMIN';

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modalAbierta, setModalAbierta] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    setCargando(true);
    try {
      const promesas = [obtenerProductos(), obtenerCategorias()];
      if (esAdmin) promesas.push(obtenerResumen());

      const [productosData, categoriasData, resumenData] = await Promise.all(promesas);
      setProductos(productosData.filter((p) => p.activo));
      setCategorias(categoriasData);
      if (resumenData) setResumen(resumenData);
    } finally {
      setCargando(false);
    }
  }

  function handleProductoCreado() {
    setModalAbierta(false);
    cargarDatos();
  }

  const productosFiltrados = useMemo(() => {
    if (!filtroCategoria) return productos;
    return productos.filter((p) => p.categoriaId === Number(filtroCategoria));
  }, [productos, filtroCategoria]);

  return (
    <div className="home">
      <h1>Hola, {usuario?.nombre} 👋</h1>

      {esAdmin && resumen && (
        <div className="home__resumen">
          <div className="home__card">
            <span className="home__card-label">Ingresos hoy</span>
            <span className="home__card-valor">${resumen.ingresos.toFixed(2)}</span>
          </div>
          <div className={`home__card ${resumen.gananciaNeta >= 0 ? 'home__card--positivo' : 'home__card--negativo'}`}>
            <span className="home__card-label">Ganancia neta</span>
            <span className="home__card-valor">${resumen.gananciaNeta.toFixed(2)}</span>
          </div>
          <div className="home__card">
            <span className="home__card-label">Margen</span>
            <span className="home__card-valor">{resumen.margen.toFixed(1)}%</span>
          </div>
          <div className="home__card">
            <span className="home__card-label">Gastos hoy</span>
            <span className="home__card-valor">${resumen.gastosVariables.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="home__menu-header">
        <h2>Menú de hoy</h2>
        <div className="home__menu-controles">
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          {esAdmin && (
            <button className="home__agregar" onClick={() => setModalAbierta(true)}>+ Agregar plato</button>
          )}
        </div>
      </div>

      {cargando && <p className="home__cargando">Cargando...</p>}

      {!cargando && productosFiltrados.length === 0 && (
        <p className="home__vacio">No hay platos que coincidan con este filtro.</p>
      )}

      <div className="home__menu-grid">
        {productosFiltrados.map((p) => (
          <div key={p.id} className="home__plato">
            <span className="home__plato-nombre">{p.nombre}</span>
            <span className="home__plato-categoria">{p.categoria?.nombre}</span>
            <span className="home__plato-precio">${Number(p.precio).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {modalAbierta && (
        <Modal titulo="Agregar plato al menú" onClose={() => setModalAbierta(false)}>
          <FormularioProducto onGuardado={handleProductoCreado} />
        </Modal>
      )}
    </div>
  );
}