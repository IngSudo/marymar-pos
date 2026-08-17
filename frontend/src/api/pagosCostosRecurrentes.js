import client from './client';

export async function obtenerPagos(desde, hasta) {
  const params = {};
  if (desde) params.desde = desde;
  if (hasta) params.hasta = hasta;
  const { data } = await client.get('/pagos-costos-recurrentes', { params });
  return data;
}

export async function registrarPago(costoRecurrenteId, desde, hasta, diasTrabajados) {
  const { data } = await client.post('/pagos-costos-recurrentes', { costoRecurrenteId, desde, hasta, diasTrabajados });
  return data;
}

export async function registrarPagoPorDias(costoRecurrenteId, fechas) {
  const { data } = await client.post('/pagos-costos-recurrentes', { costoRecurrenteId, fechas });
  return data;
}

export async function registrarPagoCompleto(costoRecurrenteId) {
  const { data } = await client.post('/pagos-costos-recurrentes', { costoRecurrenteId, pagarCompleto: true });
  return data;
}

export async function eliminarPago(id) {
  const { data } = await client.delete(`/pagos-costos-recurrentes/${id}`);
  return data;
}
