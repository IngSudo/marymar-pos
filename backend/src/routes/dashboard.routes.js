const express = require('express');
const prisma = require('../prismaClient');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

function inicioDelDia(fecha = new Date()) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}
function finDelDia(fecha = new Date()) {
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d;
}

router.get('/resumen', verificarToken, soloAdmin, async (req, res) => {
  const hoy = new Date();
  const desde = inicioDelDia(hoy);
  const hasta = finDelDia(hoy);

  const ventas = await prisma.venta.findMany({
    where: { fecha: { gte: desde, lte: hasta } },
    include: { detalles: { include: { producto: true } } },
  });

  const gastos = await prisma.gasto.findMany({
    where: { fecha: { gte: desde, lte: hasta } },
  });

  const ingresos = ventas.reduce((sum, v) => sum + Number(v.total), 0);
  const costos = gastos.reduce((sum, g) => sum + Number(g.monto), 0);
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
  const topPlatos = Object.entries(conteoProductos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nombre, cantidad]) => ({ nombre, cantidad }));

  res.json({
    fecha: desde.toISOString().split('T')[0],
    ingresos,
    costos,
    gananciaNeta,
    margen: Number(margen.toFixed(2)),
    ticketPromedio: Number(ticketPromedio.toFixed(2)),
    numeroVentas: ventas.length,
    topPlatos,
  });
});

module.exports = router;