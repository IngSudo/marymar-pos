import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.scss';

const itemsBase = [
  { to: '/', label: 'Inicio', icon: '🏠' },
  { to: '/vender', label: 'Vender', icon: '🧾' },
  { to: '/menu', label: 'Menú', icon: '🍽️' },
  { to: '/gastos', label: 'Gastos', icon: '💸' },
  { to: '/notas', label: 'Notas', icon: '📝' },
];

const itemsAdmin = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/costos', label: 'Costos recurrentes', icon: '🔁' },
  { to: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
  { to: '/admin/configuracion', label: 'Configuración', icon: '⚙️' },
];

export default function Sidebar() {
  const { usuario, esSesionElevada, logout } = useAuth();
  const esAdmin = usuario?.rol === 'ADMIN';

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">MaryMar POS</div>

      <nav className="sidebar__nav">
        {itemsBase.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
          >
            <span className="sidebar__icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {esAdmin && (
          <>
            <div className="sidebar__separador">Administración</div>
            {itemsAdmin.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
              >
                <span className="sidebar__icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__usuario">
          <strong>{usuario?.nombre}</strong>
          <span>{usuario?.rol}</span>
        </div>

        {esSesionElevada ? (
          <button className="sidebar__logout" onClick={logout}>Cerrar sesión</button>
        ) : (
          <Link className="sidebar__logout" to="/login">Iniciar sesión como admin</Link>
        )}
      </div>
    </aside>
  );
}