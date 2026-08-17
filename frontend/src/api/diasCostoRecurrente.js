import client from './client';

export async function obtenerDias(costoRecurrenteId, desde, hasta) {
  const params = { costoRecurrenteId };
  if (desde) params.desde = desde;
  if (hasta) params.hasta = hasta;
  const { data } = await client.get('/dias-costo-recurrente', { params });
  return data;
}

export async function invalidarDia(costoRecurrenteId, fecha, nota) {
  const { data } = await client.post('/dias-costo-recurrente/invalidar', { costoRecurrenteId, fecha, nota });
  return data;
}

export async function agregarDiaExtra(costoRecurrenteId, fecha) {
  const { data } = await client.post('/dias-costo-recurrente/agregar-extra', { costoRecurrenteId, fecha });
  return data;
}

export async function quitarExcepcionDia(costoRecurrenteId, fecha) {
  const { data } = await client.delete('/dias-costo-recurrente', { data: { costoRecurrenteId, fecha } });
  return data;
}
