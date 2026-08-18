function aISO(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function aFechaLocal(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function hoyISO() {
  return aISO(new Date());
}

export function fechaLocalISO(fechaOInstante) {
  return aISO(new Date(fechaOInstante));
}

export function mesActualISO() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

export function rangoDeMes(mesISO) {
  const [anio, mes] = mesISO.split('-').map(Number);
  const primerDia = new Date(anio, mes - 1, 1);
  const ultimoDia = new Date(anio, mes, 0);
  return { desde: aISO(primerDia), hasta: aISO(ultimoDia) };
}

export function mesAnteriorA(mesISO) {
  const [anio, mes] = mesISO.split('-').map(Number);
  const fecha = new Date(anio, mes - 2, 1);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
}

export function nombreDeMes(mesISO) {
  const [anio, mes] = mesISO.split('-').map(Number);
  const texto = new Date(anio, mes - 1, 1).toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function diasEntre(desde, hasta) {
  const d1 = aFechaLocal(desde);
  const d2 = aFechaLocal(hasta);
  return Math.round((d2 - d1) / 86400000) + 1;
}

export function rangoAnteriorEquivalente(desde, hasta) {
  const d1 = aFechaLocal(desde);
  const dias = diasEntre(desde, hasta);

  const anteriorHasta = new Date(d1);
  anteriorHasta.setDate(anteriorHasta.getDate() - 1);
  const anteriorDesde = new Date(anteriorHasta);
  anteriorDesde.setDate(anteriorDesde.getDate() - (dias - 1));

  return { desde: aISO(anteriorDesde), hasta: aISO(anteriorHasta) };
}

export function rangoHoy() {
  const hoy = new Date();
  return { desde: aISO(hoy), hasta: aISO(hoy) };
}

export function rangoAyer() {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  return { desde: aISO(ayer), hasta: aISO(ayer) };
}

export function rangoSemanaActual() {
  const hoy = new Date();
  const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - (diaSemana - 1));
  return { desde: aISO(lunes), hasta: aISO(hoy) };
}

export function rangoSemanaAnterior() {
  const { desde } = rangoSemanaActual();
  const lunesActual = new Date(desde);
  const lunesAnterior = new Date(lunesActual);
  lunesAnterior.setDate(lunesActual.getDate() - 7);
  const domingoAnterior = new Date(lunesActual);
  domingoAnterior.setDate(lunesActual.getDate() - 1);
  return { desde: aISO(lunesAnterior), hasta: aISO(domingoAnterior) };
}

export function rangoMesActual() {
  const hoy = new Date();
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  return { desde: aISO(primerDia), hasta: aISO(hoy) };
}

export function rangoMesAnterior() {
  const hoy = new Date();
  const primerDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
  return { desde: aISO(primerDiaMesAnterior), hasta: aISO(ultimoDiaMesAnterior) };
}
