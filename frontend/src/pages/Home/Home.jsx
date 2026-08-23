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
import { rangoHoy, rangoAyer } from '../../utils/fechas';
import { delta } from '../../utils/finanzas';
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
  const [resumenAyer, setResumenAyer] = useState(null);
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
      if (esAdmin) {
        const { desde: hoyDesde, hasta: hoyHasta } = rangoHoy();
        const { desde: ayerDesde, hasta: ayerHasta } = rangoAyer();
        promesas.push(obtenerResumen(hoyDesde, hoyHasta), obtenerResumen(ayerDesde, ayerHasta));
      }

      const [productosData, categoriasData, resumenData, resumenAyerData] = await Promise.all(promesas);
      setProductos(productosData.filter((p) => p.activo));
      setCategorias(categoriasData);
      if (resumenData) setResumen(resumenData);
      if (resumenAyerData) setResumenAyer(resumenAyerData);
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

  const deltaIngresos = resumenAyer ? delta(resumen?.ingresos, resumenAyer.ingresos) : null;
  const deltaGanancia = resumenAyer ? delta(resumen?.gananciaNeta, resumenAyer.gananciaNeta) : null;

  const seriesComparativa = [
    { key: 'hoy', label: 'Hoy', color: chartColors.primary },
    { key: 'ayer', label: 'Ayer', color: chartColors.compare },
  ];
  const datosComparativa = resumen && resumenAyer
    ? [
        { label: 'Ingresos', valores: { hoy: resumen.ingresos, ayer: resumenAyer.ingresos } },
        { label: 'Gastos', valores: { hoy: resumen.gastosVariables, ayer: resumenAyer.gastosVariables } },
        { label: 'Ganancia', valores: { hoy: resumen.gananciaNeta, ayer: resumenAyer.gananciaNeta } },
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
              {deltaIngresos && (
                <span className={`home__card-delta ${deltaIngresos.positivo ? 'positivo' : 'negativo'}`}>
                  {deltaIngresos.positivo ? <TrendingUp size={13} strokeWidth={2.5} /> : <TrendingDown size={13} strokeWidth={2.5} />}
                  {deltaIngresos.texto} vs ayer
                </span>
              )}
            </div>
            <div className={`home__card ${resumen.gananciaNeta >= 0 ? 'home__card--positivo' : 'home__card--negativo'}`}>
              <span className="home__card-label">Ganancia neta</span>
              <span className="home__card-valor">
                {resumen.gananciaNeta >= 0 ? <TrendingUp size={16} strokeWidth={2.5} /> : <TrendingDown size={16} strokeWidth={2.5} />}
                ${resumen.gananciaNeta.toFixed(2)}
              </span>
              {deltaGanancia && (
                <span className={`home__card-delta ${deltaGanancia.positivo ? 'positivo' : 'negativo'}`}>
                  {deltaGanancia.positivo ? <TrendingUp size={13} strokeWidth={2.5} /> : <TrendingDown size={13} strokeWidth={2.5} />}
                  {deltaGanancia.texto} vs ayer
                </span>
              )}
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
            <h2>Comparativa — hoy vs ayer</h2>
            <BarChart data={datosComparativa} series={seriesComparativa} />
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
          <button className="home__agregar" onClick={() => setModalAbierta(true)}>
            <Plus size={16} strokeWidth={2.5} />
            Agregar plato
          </button>
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
