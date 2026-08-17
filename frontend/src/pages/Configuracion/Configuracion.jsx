import { useEffect, useState } from 'react';
import { MonitorSmartphone, CheckCircle2, AlertCircle, UserRound, KeyRound } from 'lucide-react';
import { obtenerUsuarios, generarSesionDispositivo, cambiarPassword } from '../../api/usuarios';
import { useAuth } from '../../context/AuthContext';
import '../../styles/_admin.scss';
import './Configuracion.scss';

export default function Configuracion() {
  const { configurarCajaPredeterminada, usuario } = useAuth();
  const [cajeros, setCajeros] = useState([]);
  const [seleccionado, setSeleccionado] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(true);

  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [mensajePassword, setMensajePassword] = useState(null);
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  useEffect(() => {
    obtenerUsuarios()
      .then((data) => setCajeros(data.filter((u) => u.rol === 'CAJERO' && u.activo)))
      .finally(() => setCargando(false));
  }, []);

  async function handleEstablecer() {
    if (!seleccionado) return;
    setMensaje(null);
    try {
      const { token, usuario } = await generarSesionDispositivo(seleccionado);
      configurarCajaPredeterminada(token, usuario);
      setMensaje({ tipo: 'ok', texto: `Listo — este dispositivo abrirá como "${usuario.nombre}" automáticamente desde ahora.` });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'No se pudo configurar la caja predeterminada' });
    }
  }

  async function handleCambiarPassword(e) {
    e.preventDefault();
    setMensajePassword(null);

    if (passwordNueva !== passwordConfirmar) {
      setMensajePassword({ tipo: 'error', texto: 'La confirmación no coincide con la nueva contraseña' });
      return;
    }

    setGuardandoPassword(true);
    try {
      await cambiarPassword(passwordActual, passwordNueva);
      setMensajePassword({ tipo: 'ok', texto: 'Contraseña actualizada correctamente' });
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirmar('');
    } catch (err) {
      setMensajePassword({ tipo: 'error', texto: err.response?.data?.error || 'No se pudo cambiar la contraseña' });
    } finally {
      setGuardandoPassword(false);
    }
  }

  return (
    <div className="admin-page configuracion">
      <div className="admin-page__header"><h1>Configuración del dispositivo</h1></div>

      <div className="configuracion__card">
        <div className="configuracion__icono">
          <MonitorSmartphone size={22} strokeWidth={2} />
        </div>
        <div className="configuracion__texto">
          <h2>Caja predeterminada de este dispositivo</h2>
          <p>
            Asigna un cajero fijo a esta computadora o tablet: la próxima vez que se abra la app aquí,
            iniciará sesión automáticamente con ese usuario, sin pedir contraseña.
          </p>

          {cargando && <p className="admin-page__cargando">Cargando cajeros...</p>}

          {!cargando && cajeros.length === 0 && (
            <p className="admin-page__vacio">No hay cajeros activos todavía. Crea uno en la sección Usuarios primero.</p>
          )}

          {!cargando && cajeros.length > 0 && (
            <div className="configuracion__form">
              <div className="configuracion__select-wrap">
                <UserRound size={16} strokeWidth={2} className="configuracion__select-icono" />
                <select value={seleccionado} onChange={(e) => setSeleccionado(e.target.value)}>
                  <option value="">Selecciona un cajero…</option>
                  {cajeros.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre} ({u.usuario})</option>
                  ))}
                </select>
              </div>
              <button className="admin-page__agregar" onClick={handleEstablecer} disabled={!seleccionado}>
                Establecer como predeterminado
              </button>
            </div>
          )}

          {mensaje && (
            <div className={`configuracion__mensaje configuracion__mensaje--${mensaje.tipo}`}>
              {mensaje.tipo === 'ok' ? <CheckCircle2 size={16} strokeWidth={2} /> : <AlertCircle size={16} strokeWidth={2} />}
              {mensaje.texto}
            </div>
          )}
        </div>
      </div>

      <div className="configuracion__card">
        <div className="configuracion__icono">
          <KeyRound size={22} strokeWidth={2} />
        </div>
        <div className="configuracion__texto">
          <h2>Cambiar mi contraseña</h2>
          <p>
            Actualiza la contraseña de tu cuenta ({usuario?.nombre}). Necesitas confirmar tu contraseña actual.
          </p>

          <form className="configuracion__form-password form-producto" onSubmit={handleCambiarPassword}>
            <label htmlFor="password-actual">Contraseña actual</label>
            <input
              id="password-actual"
              type="password"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              required
            />

            <label htmlFor="password-nueva">Nueva contraseña</label>
            <input
              id="password-nueva"
              type="password"
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              minLength={4}
              required
            />

            <label htmlFor="password-confirmar">Confirmar nueva contraseña</label>
            <input
              id="password-confirmar"
              type="password"
              value={passwordConfirmar}
              onChange={(e) => setPasswordConfirmar(e.target.value)}
              minLength={4}
              required
            />

            {mensajePassword && (
              <div className={`configuracion__mensaje configuracion__mensaje--${mensajePassword.tipo}`}>
                {mensajePassword.tipo === 'ok' ? <CheckCircle2 size={16} strokeWidth={2} /> : <AlertCircle size={16} strokeWidth={2} />}
                {mensajePassword.texto}
              </div>
            )}

            <button type="submit" disabled={guardandoPassword}>
              {guardandoPassword ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
