import client from './client';

export async function obtenerProductos() {
  const { data } = await client.get('/productos');
  return data;
}

export async function crearProducto(producto) {
  const { data } = await client.post('/productos', producto);
  return data;
}

export async function editarProducto(id, producto) {
  const { data } = await client.put(`/productos/${id}`, producto);
  return data;
}

export async function desactivarProducto(id) {
  const { data } = await client.patch(`/productos/${id}/desactivar`);
  return data;
}

export async function activarProducto(id) {
  const { data } = await client.patch(`/productos/${id}/activar`);
  return data;
}

export async function eliminarProducto(id) {
  const { data } = await client.delete(`/productos/${id}`);
  return data;
}