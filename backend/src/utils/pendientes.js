const { diasEntre, inicioDelDia, formatFecha, formatFechaUTC } = require('./fechas');
const { montoProrateado } = require('./finanzas');

async function calcularPendienteSueldoDiario(prisma, costo) {
  const hoy = inicioDelDia(new Date());
  const excepciones = await prisma.diaCostoRecurrente.findMany({ where: { costoRecurrenteId: costo.id } });
  const mapa = {};
  excepciones.forEach((e) => { mapa[formatFechaUTC(e.fecha)] = e.estado; });

  let diasContables = 0;
  let pendienteDesde = null;
  let pendienteHasta = null;
  const cursor = new Date(inicioDelDia(costo.createdAt));
  while (cursor <= hoy) {
    const estado = mapa[formatFecha(cursor)];
    const esFinDeSemana = cursor.getDay() === 0 || cursor.getDay() === 6;

    if (estado === 'EXTRA_PENDIENTE' || (!estado && !esFinDeSemana)) {
      diasContables += 1;
      if (!pendienteDesde) pendienteDesde = formatFecha(cursor);
      pendienteHasta = formatFecha(cursor);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const pendiente = Number((diasContables * Number(costo.monto)).toFixed(2));
  const agregado = await prisma.pagoCostoRecurrente.aggregate({
    where: { costoRecurrenteId: costo.id },
    _sum: { monto: true },
  });
  const pagado = Number(agregado._sum.monto || 0);
  return {
    devengado: Number((pendiente + pagado).toFixed(2)),
    pagado,
    pendiente,
    pendienteDesde,
    pendienteHasta,
  };
}

async function calcularPendienteProrrateado(prisma, costo) {
  const hoy = new Date();
  const dias = diasEntre(costo.createdAt, hoy);
  const devengado = montoProrateado(costo, dias);
  const agregado = await prisma.pagoCostoRecurrente.aggregate({
    where: { costoRecurrenteId: costo.id },
    _sum: { monto: true },
  });
  const pagado = Number(agregado._sum.monto || 0);
  const pendiente = Math.max(0, devengado - pagado);

  let pendienteDesde = null;
  let pendienteHasta = null;
  const tasaDiaria = costo.frecuencia === 'DIARIO' ? Number(costo.monto) : Number(costo.monto) / 30;
  if (pendiente > 0 && tasaDiaria > 0) {
    const diasCubiertos = Math.floor(pagado / tasaDiaria);
    const desde = new Date(inicioDelDia(costo.createdAt));
    desde.setDate(desde.getDate() + diasCubiertos);
    pendienteDesde = formatFecha(desde);
    pendienteHasta = formatFecha(hoy);
  }

  return {
    devengado: Number(devengado.toFixed(2)),
    pagado: Number(pagado.toFixed(2)),
    pendiente: Number(pendiente.toFixed(2)),
    pendienteDesde,
    pendienteHasta,
  };
}

async function calcularPendiente(prisma, costo) {
  const esSueldoDiario = costo.tipo === 'SUELDO' && costo.frecuencia === 'DIARIO';
  return esSueldoDiario ? calcularPendienteSueldoDiario(prisma, costo) : calcularPendienteProrrateado(prisma, costo);
}

module.exports = { calcularPendiente, calcularPendienteSueldoDiario, calcularPendienteProrrateado };
