import client from './client';

export async function obtenerCostosRecurrentes() {
  const { data } = await client.get('/costos-recurrentes');
  return data;
}

export async function crearCostoRecurrente(costo) {
  const { data } = await client.post('/costos-recurrentes', costo);
  return data;
}

export async function editarCostoRecurrente(id, costo) {
  const { data } = await client.put(`/costos-recurrentes/${id}`, costo);
  return data;
}

export async function desactivarCostoRecurrente(id) {
  const { data } = await client.patch(`/costos-recurrentes/${id}/desactivar`);
  return data;
}

export async function activarCostoRecurrente(id) {
  const { data } = await client.patch(`/costos-recurrentes/${id}/activar`);
  return data;
}

export async function obtenerPendientes() {
  const { data } = await client.get('/costos-recurrentes/pendientes');
  return data;
}