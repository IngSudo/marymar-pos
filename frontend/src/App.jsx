import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login/Login';
import Home from './pages/Home/Home';
import Pos from './pages/Pos/Pos';
import Menu from './pages/Menu/Menu';
import Gastos from './pages/Gastos/Gastos';
import Dashboard from './pages/Dashboard/Dashboard';
import CostosRecurrentes from './pages/CostosRecurrentes/CostosRecurrentes';
import Usuarios from './pages/Usuarios/Usuarios';
import Configuracion from './pages/Configuracion/Configuracion';
import Notas from './pages/Notas/Notas';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<Home />} />
            <Route path="/vender" element={<Pos />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/notas" element={<Notas />} />

            <Route path="/admin/dashboard" element={<ProtectedRoute soloAdmin><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/costos" element={<ProtectedRoute soloAdmin><CostosRecurrentes /></ProtectedRoute>} />
            <Route path="/admin/usuarios" element={<ProtectedRoute soloAdmin><Usuarios /></ProtectedRoute>} />
            <Route path="/admin/configuracion" element={<ProtectedRoute soloAdmin><Configuracion /></ProtectedRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}