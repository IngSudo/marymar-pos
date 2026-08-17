import client from "./client";

export async function obtenerUsuarios() {
  const { data } = await client.get("/auth/usuarios");
  return data;
}

export async function crearUsuario(usuario) {
  const { data } = await client.post("/auth/registrar", usuario);
  return data;
}

export async function editarUsuario(id, usuario) {
  const { data } = await client.put(`/auth/usuarios/${id}`, usuario);
  return data;
}

export async function desactivarUsuario(id) {
  const { data } = await client.patch(`/auth/usuarios/${id}/desactivar`);
  return data;
}

export async function activarUsuario(id) {
  const { data } = await client.patch(`/auth/usuarios/${id}/activar`);
  return data;
}

export async function eliminarUsuario(id) {
  const { data } = await client.delete(`/auth/usuarios/${id}`);
  return data;
}

export async function generarSesionDispositivo(id) {
  const { data } = await client.post(`/auth/usuarios/${id}/sesion-dispositivo`);
  return data;
}

export async function cambiarPassword(passwordActual, passwordNueva) {
  const { data } = await client.put('/auth/cambiar-password', { passwordActual, passwordNueva });
  return data;
}