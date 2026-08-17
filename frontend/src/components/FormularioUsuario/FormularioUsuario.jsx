import { useState } from 'react';
import { crearUsuario, editarUsuario } from '../../api/usuarios';

export default function FormularioUsuario({ usuarioExistente, onGuardado }) {
  const esEdicion = Boolean(usuarioExistente);
  const [nombre, setNombre] = useState(usuarioExistente?.nombre || '');
  const [usuario, setUsuario] = useState(usuarioExistente?.usuario || '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(usuarioExistente?.rol || 'CAJERO');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      if (esEdicion) {
        const payload = { nombre, usuario, rol };
        if (password) payload.password = password;
        await editarUsuario(usuarioExistente.id, payload);
      } else {
        await crearUsuario({ nombre, usuario, password, rol });
      }
      onGuardado();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el usuario');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="form-producto" onSubmit={handleSubmit}>
      {error && <div className="form-producto__error">{error}</div>}

      <label>Nombre completo</label>
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />

      <label>Usuario (para iniciar sesión)</label>
      <input value={usuario} onChange={(e) => setUsuario(e.target.value)} required />

      <label>{esEdicion ? 'Nueva contraseña (dejar vacío para no cambiarla)' : 'Contraseña'}</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!esEdicion} />

      <label>Rol</label>
      <select value={rol} onChange={(e) => setRol(e.target.value)}>
        <option value="CAJERO">Cajero</option>
        <option value="ADMIN">Admin</option>
      </select>

      <button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear usuario'}</button>
    </form>
  );
}