import { NavLink, Link } from 'react-router-dom';
import {
  Home,
  ShoppingCart,
  Soup,
  Wallet,
  StickyNote,
  LayoutDashboard,
  Repeat,
  Users,
  Settings,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Empanada from '../icons/Empanada';
import './Sidebar.scss';

const itemsBase = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/vender', label: 'Vender', icon: ShoppingCart },
  { to: '/menu', label: 'Menú', icon: Soup },
  { to: '/gastos', label: 'Gastos', icon: Wallet },
  { to: '/notas', label: 'Notas', icon: StickyNote },
];

const itemsAdmin = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/costos', label: 'Costos recurrentes', icon: Repeat },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/configuracion', label: 'Configuración', icon: Settings },
];

export default function Sidebar({ abierto, onCerrar }) {
  const { usuario, esSesionElevada, logout } = useAuth();
  const esAdmin = usuario?.rol === 'ADMIN';
  const iniciales = usuario?.nombre
    ?.split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <aside className={`sidebar ${abierto ? 'sidebar--abierto' : ''}`}>
      <div className="sidebar__brand">
        <span className="sidebar__brand-icon">
          <Empanada size={18} strokeWidth={2.25} />
        </span>
        MaryMar
      </div>

      <nav className="sidebar__nav">
        {itemsBase.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onCerrar}
            className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
          >
            <item.icon className="sidebar__icon" size={18} strokeWidth={2} />
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
                onClick={onCerrar}
                className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
              >
                <item.icon className="sidebar__icon" size={18} strokeWidth={2} />
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__usuario">
          <span className="sidebar__avatar">{iniciales || '?'}</span>
          <div className="sidebar__usuario-info">
            <strong>{usuario?.nombre}</strong>
            <span>{usuario?.rol}</span>
          </div>
        </div>

        {esSesionElevada ? (
          <button className="sidebar__logout" onClick={() => { logout(); onCerrar?.(); }}>
            <LogOut size={16} strokeWidth={2} />
            Cerrar sesión
          </button>
        ) : (
          <Link className="sidebar__logout" to="/login" onClick={onCerrar}>
            <LogIn size={16} strokeWidth={2} />
            Iniciar sesión como admin
          </Link>
        )}
      </div>
    </aside>
  );
}
