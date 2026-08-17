import client from './client';

export async function registrarVenta(items) {
  const { data } = await client.post('/ventas', { items });
  return data;
}

export async function obtenerVentas(desde, hasta) {
  const params = {};
  if (desde) params.desde = desde;
  if (hasta) params.hasta = hasta;
  const { data } = await client.get('/ventas', { params });
  return data;
}
