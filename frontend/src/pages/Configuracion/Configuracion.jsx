import { useEffect, useState } from 'react';
import { obtenerUsuarios, generarSesionDispositivo } from '../../api/usuarios';
import { useAuth } from '../../context/AuthContext';
import '../../styles/_admin.scss';

export default function Configuracion() {
  const { configurarCajaPredeterminada } = useAuth();
  const [cajeros, setCajeros] = useState([]);
  const [seleccionado, setSeleccionado] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerUsuarios()
      .then((data) => setCajeros(data.filter((u) => u.rol === 'CAJERO' && u.activo)))
      .finally(() => setCargando(false));
  }, []);

  async function handleEstablecer() {
    if (!seleccionado) return;
    setMensaje('');
    try {
      const { token, usuario } = await generarSesionDispositivo(seleccionado);
      configurarCajaPredeterminada(token, usuario);
      setMensaje(`Listo — este dispositivo abrirá como "${usuario.nombre}" automáticamente desde ahora.`);
    } catch (err) {
      setMensaje(err.response?.data?.error || 'No se pudo configurar la caja predeterminada');
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header"><h1>Configuración del dispositivo</h1></div>

      <p style={{ marginBottom: '1rem', color: '#7a7a7a' }}>
        Elige qué cajero usará este dispositivo por defecto 
      </p>

      {cargando && <p className="admin-page__cargando">Cargando cajeros...</p>}

      {!cargando && cajeros.length === 0 && (
        <p className="admin-page__vacio">No hay cajeros activos todavía. Crea uno en la sección Usuarios primero.</p>
      )}

      {!cargando && cajeros.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select value={seleccionado} onChange={(e) => setSeleccionado(e.target.value)}>
            <option value="">-- Selecciona un cajero --</option>
            {cajeros.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre} ({u.usuario})</option>
            ))}
          </select>
          <button className="admin-page__agregar" onClick={handleEstablecer}>
            Establecer como caja predeterminado
          </button>
        </div>
      )}

      {mensaje && <p style={{ marginTop: '1rem' }}>{mensaje}</p>}
    </div>
  );
}