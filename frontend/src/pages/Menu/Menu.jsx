import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Power, PowerOff, X, Soup, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { obtenerProductos, desactivarProducto, activarProducto, eliminarProducto } from '../../api/productos';
import { obtenerCategorias, eliminarCategoria } from '../../api/categorias';
import Modal from '../../components/modal/Modal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import FormularioProducto from '../../components/FormularioProducto/FormularioProducto';
import '../../styles/_admin.scss';

export default function Menu() {
  const { usuario } = useAuth();
  const esAdmin = true;

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierta, setModalAbierta] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [error, setError] = useState('');
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);

  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [orden, setOrden] = useState('nombre');
  const [ordenEstado, setOrdenEstado] = useState('ninguno');

  function cicloOrdenEstado() {
    setOrdenEstado((prev) => (prev === 'ninguno' ? 'activos' : prev === 'activos' ? 'inactivos' : 'ninguno'));
  }

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const [productosData, categoriasData] = await Promise.all([obtenerProductos(), obtenerCategorias()]);
      setProductos(productosData);
      setCategorias(categoriasData);
    } finally {
      setCargando(false);
    }
  }

  function abrirCrear() { setProductoEditando(null); setModalAbierta(true); }
  function abrirEditar(producto) { setProductoEditando(producto); setModalAbierta(true); }

  async function handleToggle(producto) {
    if (producto.activo) await desactivarProducto(producto.id);
    else await activarProducto(producto.id);
    cargar();
  }

  async function confirmarEliminarProducto() {
    setError('');
    try {
      await eliminarProducto(productoAEliminar.id);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar');
    } finally {
      setProductoAEliminar(null);
    }
  }

  async function confirmarEliminarCategoria() {
    setError('');
    try {
      await eliminarCategoria(categoriaAEliminar.id);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar la categoría');
    } finally {
      setCategoriaAEliminar(null);
    }
  }

  function handleGuardado() { setModalAbierta(false); cargar(); }

  const productosFiltrados = useMemo(() => {
    let lista = [...productos];
    if (filtroCategoria) lista = lista.filter((p) => p.categoriaId === Number(filtroCategoria));
    if (orden === 'reciente') {
      lista.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
    if (ordenEstado === 'activos') {
      lista.sort((a, b) => Number(b.activo) - Number(a.activo));
    } else if (ordenEstado === 'inactivos') {
      lista.sort((a, b) => Number(a.activo) - Number(b.activo));
    }
    return lista;
  }, [productos, filtroCategoria, orden, ordenEstado]);

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Menú</h1>
        {esAdmin && (
          <button className="admin-page__agregar" onClick={abrirCrear}>
            <Plus size={16} strokeWidth={2.5} />
            Agregar plato
          </button>
        )}
      </div>

      {error && <p className="admin-page__error">{error}</p>}

      <div className="admin-page__filtros">
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>

        <select value={orden} onChange={(e) => setOrden(e.target.value)}>
          <option value="nombre">Orden alfabético</option>
          <option value="reciente">Recién añadidos primero</option>
        </select>
      </div>

      {cargando && <p className="admin-page__cargando">Cargando...</p>}

      {!cargando && (
        <div className="admin-page__tabla">
          <table>
            <thead>
              <tr>
                <th>Plato</th><th>Categoría</th><th>Precio</th>
                {esAdmin && <th>Costo</th>}
                <th
                  className="admin-page__th-ordenable"
                  onClick={cicloOrdenEstado}
                  title="Clic para ordenar por estado"
                >
                  <span>
                    Estado
                    {ordenEstado === 'activos' && <ArrowUp size={12} strokeWidth={2.5} />}
                    {ordenEstado === 'inactivos' && <ArrowDown size={12} strokeWidth={2.5} />}
                    {ordenEstado === 'ninguno' && <ArrowUpDown size={12} strokeWidth={2} />}
                  </span>
                </th>
                {esAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={esAdmin ? 6 : 4} className="admin-page__vacio">
                    <Soup size={22} strokeWidth={1.5} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.5 }} />
                    No hay platos que coincidan con el filtro
                  </td>
                </tr>
              )}
              {productosFiltrados.map((p) => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>{p.categoria?.nombre}</td>
                  <td>${Number(p.precio).toFixed(2)}</td>
                  {esAdmin && <td>{p.costoEstimado !== null ? `$${Number(p.costoEstimado).toFixed(2)}` : '—'}</td>}
                  <td>
                    <span className={`admin-page__badge ${p.activo ? 'admin-page__badge--activo' : 'admin-page__badge--inactivo'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {esAdmin && (
                    <td className="admin-page__acciones">
                      <button className="editar" onClick={() => abrirEditar(p)} title="Editar" aria-label="Editar">
                        <Pencil size={15} strokeWidth={2} />
                      </button>
                      <button
                        className={p.activo ? 'desactivar' : 'activar'}
                        onClick={() => handleToggle(p)}
                        title={p.activo ? 'Desactivar' : 'Activar'}
                        aria-label={p.activo ? 'Desactivar' : 'Activar'}
                      >
                        {p.activo ? <PowerOff size={15} strokeWidth={2} /> : <Power size={15} strokeWidth={2} />}
                      </button>
                      <button className="desactivar" onClick={() => setProductoAEliminar(p)} title="Eliminar" aria-label="Eliminar">
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {esAdmin && (
        <div className="admin-page__seccion-categorias">
          <h2>Categorías</h2>
          <div className="admin-page__categorias-lista">
            {categorias.map((c) => (
              <span key={c.id} className="admin-page__categoria-chip">
                {c.nombre}
                <button onClick={() => setCategoriaAEliminar(c)} title="Eliminar categoría" aria-label="Eliminar categoría">
                  <X size={12} strokeWidth={2.5} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {modalAbierta && esAdmin && (
        <Modal titulo={productoEditando ? 'Editar plato' : 'Agregar plato'} onClose={() => setModalAbierta(false)}>
          <FormularioProducto productoExistente={productoEditando} onGuardado={handleGuardado} />
        </Modal>
      )}

      {productoAEliminar && (
        <ConfirmModal
          titulo="Eliminar plato"
          mensaje={`¿Eliminar "${productoAEliminar.nombre}" permanentemente? Esta acción no se puede deshacer.`}
          onConfirmar={confirmarEliminarProducto}
          onCancelar={() => setProductoAEliminar(null)}
        />
      )}

      {categoriaAEliminar && (
        <ConfirmModal
          titulo="Eliminar categoría"
          mensaje={`¿Eliminar la categoría "${categoriaAEliminar.nombre}"? Esta acción no se puede deshacer.`}
          onConfirmar={confirmarEliminarCategoria}
          onCancelar={() => setCategoriaAEliminar(null)}
        />
      )}
    </div>
  );
}
