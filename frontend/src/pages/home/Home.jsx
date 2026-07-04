import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Home.scss';

export default function Home() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="home">
      <header className="home__header">
        <div>
          <h1>Hola, {usuario.nombre}</h1>
          <span className="home__rol">Rol: {usuario.rol}</span>
        </div>
        <button className="home__logout" onClick={handleLogout}>Cerrar sesion</button>
      </header>

      <p className="home__mensaje">
        en proceso de construir las demas paginas
      </p>
    </div>
  );
}