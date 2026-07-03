const express = require("express");
const prisma = require("../prismaClient");
const { verificarToken, soloAdmin } = require("../middleware/auth");

const router = express.Router();

function formatFecha(fecha) {
  const d = new Date(fecha);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function inicioDelDia(fecha) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}
function finDelDia(fecha) {
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d;
}

router.get("/resumen", verificarToken, soloAdmin, async (req, res) => {
  const desde = req.query.desde
    ? inicioDelDia(req.query.desde)
    : inicioDelDia(new Date());
  const hasta = req.query.hasta
    ? finDelDia(req.query.hasta)
    : finDelDia(new Date());

  const ventas = await prisma.venta.findMany({
    where: { fecha: { gte: desde, lte: hasta } },
    include: { detalles: { include: { producto: true } } },
  });

  const gastos = await prisma.gasto.findMany({
    where: { fecha: { gte: desde, lte: hasta } },
  });

  const numeroDias =
    Math.round(
      (inicioDelDia(hasta) - inicioDelDia(desde)) / (1000 * 60 * 60 * 24),
    ) + 1;

  const costosRecurrentes = await prisma.costoRecurrente.findMany({
    where: { activo: true },
  });

  function calcularEnRango(costo) {
    if (costo.frecuencia === "DIARIO") return Number(costo.monto) * numeroDias;
    if (costo.frecuencia === "MENSUAL")
      return (Number(costo.monto) / 30) * numeroDias;
    return 0;
  }

  const sueldos = costosRecurrentes
    .filter((c) => c.tipo === "SUELDO")
    .reduce((sum, c) => sum + calcularEnRango(c), 0);

  const costosOperativos = costosRecurrentes
    .filter((c) => c.tipo === "OPERATIVO")
    .reduce((sum, c) => sum + calcularEnRango(c), 0);

  const gastosVariables = gastos.reduce((sum, g) => sum + Number(g.monto), 0);
  const costosRecurrentesTotal = sueldos + costosOperativos;
  const costos = gastosVariables + costosRecurrentesTotal;

  const ingresos = ventas.reduce((sum, v) => sum + Number(v.total), 0);
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
    desde: formatFecha(desde),
    hasta: formatFecha(hasta),
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
    topPlatos,
  });
});

router.get('/rentabilidad', verificarToken, soloAdmin, async (req, res) => {
  const desde = req.query.desde ? inicioDelDia(req.query.desde) : inicioDelDia(new Date());
  const hasta = req.query.hasta ? finDelDia(req.query.hasta) : finDelDia(new Date());

  const productos = await prisma.producto.findMany({
    where: { activo: true },
    include: {
      detalleVentas: {
        where: { venta: { fecha: { gte: desde, lte: hasta } } },
      },
    },
  });

  const rentabilidad = productos.map((p) => {
    const precio = Number(p.precio);
    const costo = p.costoEstimado ? Number(p.costoEstimado) : null;

    const margenUnitario = costo !== null ? precio - costo : null;
    const margenPorcentual = costo !== null && precio > 0
      ? Number(((margenUnitario / precio) * 100).toFixed(2))
      : null;

    const unidadesVendidas = p.detalleVentas.reduce((sum, d) => sum + d.cantidad, 0);
    const ingresoGenerado = p.detalleVentas.reduce((sum, d) => sum + Number(d.subtotal), 0);
    const gananciaGenerada = costo !== null
      ? Number((margenUnitario * unidadesVendidas).toFixed(2))
      : null;

    return {
      productoId: p.id,
      nombre: p.nombre,
      precio,
      costoEstimado: costo,
      margenUnitario,
      margenPorcentual,
      unidadesVendidas,
      ingresoGenerado: Number(ingresoGenerado.toFixed(2)),
      gananciaGenerada,
    };
  });

  rentabilidad.sort((a, b) => (b.gananciaGenerada ?? 0) - (a.gananciaGenerada ?? 0));

  res.json({
    desde: formatFecha(desde),
    hasta: formatFecha(hasta),
    productos: rentabilidad,
  });
});

module.exports = router;
