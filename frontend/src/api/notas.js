import client from './client';

export async function obtenerNotas() {
  const { data } = await client.get('/notas');
  return data;
}

export async function crearNota(contenido) {
  const { data } = await client.post('/notas', { contenido });
  return data;
}

export async function editarNota(id, contenido) {
  const { data } = await client.put(`/notas/${id}`, { contenido });
  return data;
}

export async function eliminarNota(id) {
  const { data } = await client.delete(`/notas/${id}`);
  return data;
}