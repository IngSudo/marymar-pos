import client from './client';

export async function obtenerGastos(desde, hasta) {
  const params = {};
  if (desde) params.desde = desde;
  if (hasta) params.hasta = hasta;
  const { data } = await client.get('/gastos', { params });
  return data;
}

export async function crearGasto(gasto) {
  const { data } = await client.post('/gastos', gasto);
  return data;
}

export async function editarGasto(id, gasto) {
  const { data } = await client.put(`/gastos/${id}`, gasto);
  return data;
}

export async function eliminarGasto(id) {
  const { data } = await client.delete(`/gastos/${id}`);
  return data;
}