async function calcularResumenRango(prisma, { desde, hasta, numeroDias }) {
  const ventas = await prisma.venta.findMany({
    where: { fecha: { gte: desde, lte: hasta } },
    include: { detalles: { include: { producto: true } } },
  });

  const gastos = await prisma.gasto.findMany({
    where: { fecha: { gte: desde, lte: hasta } },
  });

  const costosRecurrentes = await prisma.costoRecurrente.findMany({ where: { activo: true } });

  function calcularEnRango(costo) {
    if (costo.frecuencia === 'DIARIO') return Number(costo.monto) * numeroDias;
    if (costo.frecuencia === 'MENSUAL') return (Number(costo.monto) / 30) * numeroDias;
    return 0;
  }

  const sueldos = costosRecurrentes.filter((c) => c.tipo === 'SUELDO').reduce((s, c) => s + calcularEnRango(c), 0);
  const costosOperativos = costosRecurrentes.filter((c) => c.tipo === 'OPERATIVO').reduce((s, c) => s + calcularEnRango(c), 0);
  const gastosVariables = gastos.reduce((s, g) => s + Number(g.monto), 0);
  const costosRecurrentesTotal = sueldos + costosOperativos;
  const costos = gastosVariables + costosRecurrentesTotal;
  const ingresos = ventas.reduce((s, v) => s + Number(v.total), 0);
  const gananciaNeta = ingresos - costos;
  const margen = ingresos > 0 ? (gananciaNeta / ingresos) * 100 : 0;
  const ticketPromedio = ventas.length > 0 ? ingresos / ventas.length : 0;

  const conteoProductos = {};
  ventas.forEach((v) => {
    v.detalles.forEach((d) => {
      const nombre = d.producto.nombre;
      conteoProductos[nombre] = (conteoProductos[nombre] || 0) + d.cantidad;
    });
  });
  const platosVendidos = Object.entries(conteoProductos)
    .sort((a, b) => b[1] - a[1])
    .map(([nombre, cantidad]) => ({ nombre, cantidad }));

  return {
    ingresos: Number(ingresos.toFixed(2)),
    gastosVariables: Number(gastosVariables.toFixed(2)),
    sueldos: Number(sueldos.toFixed(2)),
    costosOperativos: Number(costosOperativos.toFixed(2)),
    costosRecurrentesTotal: Number(costosRecurrentesTotal.toFixed(2)),
    costos: Number(costos.toFixed(2)),
    gananciaNeta: Number(gananciaNeta.toFixed(2)),
    margen: Number(margen.toFixed(2)),
    ticketPromedio: Number(ticketPromedio.toFixed(2)),
    numeroVentas: ventas.length,
    platosVendidos,
  };
}

module.exports = { calcularResumenRango };