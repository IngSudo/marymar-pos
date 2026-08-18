import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sidebar/Sidebar';
import Empanada from '../components/icons/Empanada';
import './MainLayout.scss';

export default function MainLayout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  return (
    <div className="main-layout">
      <header className="main-layout__topbar">
        <button
          className="main-layout__menu-boton"
          onClick={() => setSidebarAbierto((v) => !v)}
          aria-label={sidebarAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={sidebarAbierto}
        >
          <Empanada size={18} strokeWidth={2.25} />
        </button>
        <span className="main-layout__topbar-titulo">MaryMar</span>
      </header>

      {sidebarAbierto && (
        <div className="main-layout__overlay" onClick={() => setSidebarAbierto(false)} />
      )}

      <Sidebar abierto={sidebarAbierto} onCerrar={() => setSidebarAbierto(false)} />

      <main className="main-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
