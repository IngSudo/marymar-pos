import client from './client';

export async function registrarVenta(items) {
  const { data } = await client.post('/ventas', { items });
  return data;
}