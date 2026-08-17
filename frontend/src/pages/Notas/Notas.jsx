import { useEffect, useState } from 'react';
import { obtenerNotas, crearNota, editarNota, eliminarNota } from '../../api/notas';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './Notas.scss';

export default function Notas() {
  const [notas, setNotas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [texto, setTexto] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [textoEdicion, setTextoEdicion] = useState('');
  const [aEliminar, setAEliminar] = useState(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      setNotas(await obtenerNotas());
    } finally {
      setCargando(false);
    }
  }

  async function handleCrear(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    await crearNota(texto.trim());
    setTexto('');
    cargar();
  }

  function empezarEdicion(nota) {
    setEditandoId(nota.id);
    setTextoEdicion(nota.contenido);
  }

  async function guardarEdicion(id) {
    if (!textoEdicion.trim()) return;
    await editarNota(id, textoEdicion.trim());
    setEditandoId(null);
    cargar();
  }

  async function confirmarEliminar() {
    await eliminarNota(aEliminar.id);
    setAEliminar(null);
    cargar();
  }

  return (
    <div className="notas">
      <h1>Notas</h1>
      <p className="notas__subtitulo">Registro de notas - cosas sucedidas en el dia o pagos pendientes</p>

      <form className="notas__form" onSubmit={handleCrear}>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe una nota nueva..."
          rows={3}
        />
        <button type="submit">Agregar nota</button>
      </form>

      {cargando && <p className="notas__cargando">Cargando...</p>}

      <div className="notas__lista">
        {!cargando && notas.length === 0 && <p className="notas__vacio">No hay notas todavía.</p>}

        {notas.map((n) => (
          <div key={n.id} className="notas__item">
            {editandoId === n.id ? (
              <>
                <textarea
                  value={textoEdicion}
                  onChange={(e) => setTextoEdicion(e.target.value)}
                  rows={3}
                />
                <div className="notas__item-acciones">
                  <button onClick={() => guardarEdicion(n.id)}>Guardar</button>
                  <button onClick={() => setEditandoId(null)}>Cancelar</button>
                </div>
              </>
            ) : (
              <>
                <p className="notas__contenido">{n.contenido}</p>
                <div className="notas__meta">
                  <span>{n.creadoPor} · {new Date(n.createdAt).toLocaleString('es-EC')}</span>
                  <div className="notas__item-acciones">
                    <button onClick={() => empezarEdicion(n)}>Editar</button>
                    <button onClick={() => setAEliminar(n)}>Eliminar</button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {aEliminar && (
        <ConfirmModal
          titulo="Eliminar nota"
          mensaje="¿Eliminar esta nota permanentemente?"
          onConfirmar={confirmarEliminar}
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </div>
  );
}