import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sidebar/Sidebar';
import './MainLayout.scss';

export default function MainLayout() {
  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-layout__content">
        <Outlet />
      </main>
    </div>
  );
}