import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Power, PowerOff, Users as UsersIcon } from "lucide-react";
import {
  obtenerUsuarios,
  desactivarUsuario,
  activarUsuario,
  eliminarUsuario,
} from "../../api/usuarios";
import Modal from "../../components/modal/Modal";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import FormularioUsuario from "../../components/FormularioUsuario/FormularioUsuario";
import "../../styles/_admin.scss";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierta, setModalAbierta] = useState(false);
  const [editando, setEditando] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    try {
      setUsuarios(await obtenerUsuarios());
    } finally {
      setCargando(false);
    }
  }

  function abrirCrear() {
    setEditando(null);
    setModalAbierta(true);
  }
  function abrirEditar(u) {
    setEditando(u);
    setModalAbierta(true);
  }
  function handleGuardado() {
    setModalAbierta(false);
    cargar();
  }

  async function handleToggle(u) {
    if (u.activo) await desactivarUsuario(u.id);
    else await activarUsuario(u.id);
    cargar();
  }

  async function confirmarEliminar() {
    setError("");
    try {
      await eliminarUsuario(aEliminar.id);
      setAEliminar(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo eliminar");
      setAEliminar(null);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Usuarios</h1>
        <button className="admin-page__agregar" onClick={abrirCrear}>
          <Plus size={16} strokeWidth={2.5} />
          Crear usuario
        </button>
      </div>

      {error && <p className="admin-page__error">{error}</p>}
      {cargando && <p className="admin-page__cargando">Cargando...</p>}

      {!cargando && (
        <div className="admin-page__tabla">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Desactivado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-page__vacio">
                    <UsersIcon size={22} strokeWidth={1.5} style={{ display: "block", margin: "0 auto 8px", opacity: 0.5 }} />
                    No hay usuarios
                  </td>
                </tr>
              )}
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre}</td>
                  <td>{u.usuario}</td>
                  <td>{u.rol}</td>
                  <td>
                    <span
                      className={`admin-page__badge ${u.activo ? "admin-page__badge--activo" : "admin-page__badge--inactivo"}`}
                    >
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString("es-EC")}</td>
                  <td>
                    {u.fechaDesactivacion
                      ? new Date(u.fechaDesactivacion).toLocaleDateString(
                          "es-EC",
                        )
                      : "—"}
                  </td>
                  <td className="admin-page__acciones">
                    <button className="editar" onClick={() => abrirEditar(u)} title="Editar" aria-label="Editar">
                      <Pencil size={15} strokeWidth={2} />
                    </button>
                    <button
                      className={u.activo ? "desactivar" : "activar"}
                      onClick={() => handleToggle(u)}
                      title={u.activo ? "Desactivar" : "Activar"}
                      aria-label={u.activo ? "Desactivar" : "Activar"}
                    >
                      {u.activo ? <PowerOff size={15} strokeWidth={2} /> : <Power size={15} strokeWidth={2} />}
                    </button>
                    <button
                      className="desactivar"
                      onClick={() => setAEliminar(u)}
                      title="Eliminar"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={15} strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierta && (
        <Modal
          titulo={editando ? "Editar usuario" : "Crear usuario"}
          onClose={() => setModalAbierta(false)}
        >
          <FormularioUsuario
            usuarioExistente={editando}
            onGuardado={handleGuardado}
          />
        </Modal>
      )}

      {aEliminar && (
        <ConfirmModal
          titulo="Eliminar usuario"
          mensaje={`¿Eliminar a "${aEliminar.nombre}" permanentemente? Esta acción no se puede deshacer.`}
          onConfirmar={confirmarEliminar}
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </div>
  );
}
