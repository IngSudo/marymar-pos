import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { obtenerProductos, desactivarProducto, activarProducto, eliminarProducto } from '../../api/productos';
import { obtenerCategorias, eliminarCategoria } from '../../api/categorias';
import Modal from '../../components/Modal/Modal';
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

  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [orden, setOrden] = useState('nombre');

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

  async function handleEliminarProducto(producto) {
    if (!confirm(`¿Eliminar "${producto.nombre}" permanentemente?`)) return;
    setError('');
    try {
      await eliminarProducto(producto.id);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar');
    }
  }

  async function handleEliminarCategoria(categoria) {
    if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return;
    setError('');
    try {
      await eliminarCategoria(categoria.id);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar la categoría');
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
    return lista;
  }, [productos, filtroCategoria, orden]);

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Menú</h1>
        {esAdmin && <button className="admin-page__agregar" onClick={abrirCrear}>+ Agregar plato</button>}
      </div>

      {error && <p style={{ color: '#c0392b', marginBottom: '1rem' }}>{error}</p>}

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
                <th>Estado</th>
                {esAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.length === 0 && (
                <tr><td colSpan={esAdmin ? 6 : 4} className="admin-page__vacio">No hay platos que coincidan con el filtro</td></tr>
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
                      <button className="editar" onClick={() => abrirEditar(p)}>Editar</button>
                      <button className={p.activo ? 'desactivar' : 'activar'} onClick={() => handleToggle(p)}>
                        {p.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button className="desactivar" onClick={() => handleEliminarProducto(p)}>Eliminar</button>
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
                <button onClick={() => handleEliminarCategoria(c)} title="Eliminar categoría">✕</button>
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
    </div>
  );
}