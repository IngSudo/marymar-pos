import client from './client';

export async function obtenerCategorias() {
  const { data } = await client.get('/categorias');
  return data;
}

export async function crearCategoria(nombre) {
  const { data } = await client.post('/categorias', { nombre });
  return data;
}

export async function eliminarCategoria(id) {
  const { data } = await client.delete(`/categorias/${id}`);
  return data;
}