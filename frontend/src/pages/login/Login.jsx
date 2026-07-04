import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
        <h1 className="login__title">Restaurante MaryMar</h1>
        <p className='login__subtitle--slogan'>Las Delicias del Mar</p>
        <p className="login__subtitle">Inicia sesion para continuar</p>

        {error && <div className="login__error">{error}</div>}

        <label className="login__label" htmlFor="usuario">Usuario</label>
        <input
          id="usuario"
          className="login__input"
          type="text"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          autoFocus
          required
        />

        <label className="login__label" htmlFor="password">Contraseña</label>
        <input
          id="password"
          className="login__input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="login__submit" type="submit" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}