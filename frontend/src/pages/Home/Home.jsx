import { useEffect, useMemo, useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { obtenerProductos } from '../../api/productos';
import { obtenerCategorias } from '../../api/categorias';
import { obtenerResumen } from '../../api/dashboard';
import Modal from '../../components/modal/Modal';
import FormularioProducto from '../../components/FormularioProducto/FormularioProducto';
import BarChart from '../../components/BarChart/BarChart';
import Empanada from '../../components/icons/Empanada';
import { chartColors } from '../../styles/chartColors';
import './Home.scss';

const FRASES = [
  'Que hoy se vendan todos los platos estrella.',
  'Cada venta cuenta — vamos por un gran día.',
  'La cocina lista, la caja lista, ¡a vender!',
  'Un buen servicio empieza con un buen ánimo.',
];

function saludoPorHora() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Home() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'ADMIN';

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modalAbierta, setModalAbierta] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const fecha = useMemo(
    () => new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' }),
    []
  );
  const frase = useMemo(() => FRASES[new Date().getDate() % FRASES.length], []);

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

  const datosComparativa = resumen
    ? [
        { label: 'Ingresos', value: resumen.ingresos, color: chartColors.primary },
        { label: 'Gastos', value: resumen.gastosVariables, color: chartColors.warning },
        {
          label: 'Ganancia',
          value: resumen.gananciaNeta,
          color: resumen.gananciaNeta >= 0 ? chartColors.primary : chartColors.danger,
        },
      ]
    : [];

  return (
    <div className="home">
      <div className="home__hero">
        <div className="home__hero-icono">
          <Empanada size={26} strokeWidth={2} />
        </div>
        <div className="home__hero-texto">
          <span className="home__hero-saludo">{saludoPorHora()}, {usuario?.nombre?.split(' ')[0]}</span>
          <span className="home__hero-fecha">{fecha}</span>
        </div>
        <div className="home__hero-frase">
          <Sparkles size={15} strokeWidth={2} />
          {frase}
        </div>
      </div>

      {esAdmin && resumen && (
        <div className="home__panel">
          <div className="home__resumen">
            <div className="home__card">
              <span className="home__card-label">Ingresos hoy</span>
              <span className="home__card-valor">${resumen.ingresos.toFixed(2)}</span>
            </div>
            <div className={`home__card ${resumen.gananciaNeta >= 0 ? 'home__card--positivo' : 'home__card--negativo'}`}>
              <span className="home__card-label">Ganancia neta</span>
              <span className="home__card-valor">
                {resumen.gananciaNeta >= 0 ? <TrendingUp size={16} strokeWidth={2.5} /> : <TrendingDown size={16} strokeWidth={2.5} />}
                ${resumen.gananciaNeta.toFixed(2)}
              </span>
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

          <div className="home__comparativa">
            <h2>Comparativa del día</h2>
            <BarChart data={datosComparativa} />
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
            <button className="home__agregar" onClick={() => setModalAbierta(true)}>
              <Plus size={16} strokeWidth={2.5} />
              Agregar plato
            </button>
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
