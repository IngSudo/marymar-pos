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