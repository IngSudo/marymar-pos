function aISO(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
  const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay(); // lunes = 1 ... domingo = 7
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