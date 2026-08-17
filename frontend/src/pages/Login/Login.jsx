import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Empanada from '../../components/icons/Empanada';
import './Login.scss';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await login(usuario, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesión');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={handleSubmit}>
        <div className="login__icono">
          <Empanada size={26} strokeWidth={2} />
        </div>
        <h1 className="login__title">Restaurante MaryMar</h1>
        <p className='login__subtitle--slogan'>Las Delicias del Mar</p>
        <p className="login__subtitle">Inicia sesión para continuar</p>

        {error && (
          <div className="login__error">
            <AlertCircle size={15} strokeWidth={2} />
            {error}
          </div>
        )}

        <label className="login__label" htmlFor="usuario">Usuario</label>
        <div className="login__input-wrap">
          <User size={16} strokeWidth={2} className="login__input-icono" />
          <input
            id="usuario"
            className="login__input"
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoFocus
            required
          />
        </div>

        <label className="login__label" htmlFor="password">Contraseña</label>
        <div className="login__input-wrap">
          <Lock size={16} strokeWidth={2} className="login__input-icono" />
          <input
            id="password"
            className="login__input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="login__submit" type="submit" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
