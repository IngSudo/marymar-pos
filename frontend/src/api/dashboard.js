import client from './client';

export async function obtenerResumen(desde, hasta) {
  const params = {};
  if (desde) params.desde = desde;
  if (hasta) params.hasta = hasta;
  const { data } = await client.get('/dashboard/resumen', { params });
  return data;
}

export async function obtenerRentabilidad(desde, hasta) {
  const params = {};
  if (desde) params.desde = desde;
  if (hasta) params.hasta = hasta;
  const { data } = await client.get('/dashboard/rentabilidad', { params });
  return data;
}