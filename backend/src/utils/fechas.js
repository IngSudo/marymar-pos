function inicioDelDia(fecha) {
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [y, m, d] = fecha.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

function finDelDia(fecha) {
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [y, m, d] = fecha.split('-').map(Number);
    return new Date(y, m - 1, d, 23, 59, 59, 999);
  }
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d;
}

function diasEntre(desde, hasta) {
  return Math.round((inicioDelDia(hasta) - inicioDelDia(desde)) / 86400000) + 1;
}

function formatFecha(fecha) {
  const d = new Date(fecha);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatFechaUTC(fecha) {
  const d = new Date(fecha);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

module.exports = { inicioDelDia, finDelDia, formatFecha, formatFechaUTC, diasEntre };
