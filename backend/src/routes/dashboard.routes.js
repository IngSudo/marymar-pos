const express = require('express');
const prisma = require('../prismaClient');
const { verificarToken, soloAdmin } = require('../middleware/auth');
const { inicioDelDia, finDelDia, formatFecha } = require('../utils/fechas');
const { calcularResumenRango } = require('../utils/finanzas');

const router = express.Router();

router.get('/resumen', verificarToken, soloAdmin, async (req, res) => {
  const desde = req.query.desde ? inicioDelDia(req.query.desde) : inicioDelDia(new Date());
  const hasta = req.query.hasta ? finDelDia(req.query.hasta) : finDelDia(new Date());
  const numeroDias = Math.round((inicioDelDia(hasta) - inicioDelDia(desde)) / 86400000) + 1;

  const resumen = await calcularResumenRango(prisma, { desde, hasta, numeroDias });

  res.json({
    desde: formatFecha(desde),
    hasta: formatFecha(hasta),
    ...resumen,
    topPlatos: resumen.platosVendidos.slice(0, 5),
  });
});

router.get('/detalle-por-dia', verificarToken, soloAdmin, async (req, res) => {
  const desde = inicioDelDia(req.query.desde || new Date());
  const hasta = finDelDia(req.query.hasta || new Date());

  const dias = [];
  const cursor = new Date(desde);

  while (cursor <= hasta) {
    const inicioDia = inicioDelDia(cursor);
    const finDia = finDelDia(cursor);
    const resumenDia = await calcularResumenRango(prisma, { desde: inicioDia, hasta: finDia, numeroDias: 1 });
    dias.push({ fecha: formatFecha(inicioDia), ...resumenDia });
    cursor.setDate(cursor.getDate() + 1);
  }

  const totales = await calcularResumenRango(prisma, { desde, hasta, numeroDias: dias.length });

  res.json({
    desde: formatFecha(desde),
    hasta: formatFecha(hasta),
    dias,
    totales,
  });
});

router.get('/rentabilidad', verificarToken, soloAdmin, async (req, res) => {
  const desde = req.query.desde ? inicioDelDia(req.query.desde) : inicioDelDia(new Date());
  const hasta = req.query.hasta ? finDelDia(req.query.hasta) : finDelDia(new Date());

  const productos = await prisma.producto.findMany({
    where: { activo: true },
    include: { detalleVentas: { where: { venta: { fecha: { gte: desde, lte: hasta } } } } },
  });

  const rentabilidad = productos.map((p) => {
    const precio = Number(p.precio);
    const costo = p.costoEstimado ? Number(p.costoEstimado) : null;
    const margenUnitario = costo !== null ? precio - costo : null;
    const margenPorcentual = costo !== null && precio > 0 ? Number(((margenUnitario / precio) * 100).toFixed(2)) : null;
    const unidadesVendidas = p.detalleVentas.reduce((sum, d) => sum + d.cantidad, 0);
    const ingresoGenerado = p.detalleVentas.reduce((sum, d) => sum + Number(d.subtotal), 0);
    const gananciaGenerada = costo !== null ? Number((margenUnitario * unidadesVendidas).toFixed(2)) : null;

    return {
      productoId: p.id, nombre: p.nombre, precio, costoEstimado: costo,
      margenUnitario, margenPorcentual, unidadesVendidas,
      ingresoGenerado: Number(ingresoGenerado.toFixed(2)), gananciaGenerada,
    };
  });

  rentabilidad.sort((a, b) => (b.gananciaGenerada ?? 0) - (a.gananciaGenerada ?? 0));

  res.json({ desde: formatFecha(desde), hasta: formatFecha(hasta), productos: rentabilidad });
});

module.exports = router;