const express = require('express');
const prisma = require('../prismaClient');
const { verificarToken, soloAdmin } = require('../middleware/auth');
const { inicioDelDia, finDelDia, diasEntre, formatFechaUTC } = require('../utils/fechas');
const { montoProrateado } = require('../utils/finanzas');
const { calcularPendiente } = require('../utils/pendientes');

const router = express.Router();

const INCLUDE_PAGO = {
  costoRecurrente: true,
  registradoPor: { select: { id: true, nombre: true } },
  dias: { select: { fecha: true } },
};

async function diasInvalidosDelPeriodo(costoRecurrenteId, periodoDesde, periodoHasta) {
  const invalidos = await prisma.diaCostoRecurrente.findMany({
    where: {
      costoRecurrenteId,
      estado: 'INVALIDO',
      fecha: { gte: inicioDelDia(periodoDesde), lte: inicioDelDia(periodoHasta) },
    },
    select: { fecha: true, nota: true },
  });
  return invalidos
    .map((d) => ({ fecha: formatFechaUTC(d.fecha), nota: d.nota }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

async function formatearPago(pago) {
  const diasInvalidos = await diasInvalidosDelPeriodo(pago.costoRecurrenteId, pago.periodoDesde, pago.periodoHasta);
  return {
    ...pago,
    dias: pago.dias.map((d) => formatFechaUTC(d.fecha)).sort(),
    diasInvalidos,
  };
}

router.get('/', verificarToken, soloAdmin, async (req, res) => {
  const { desde, hasta, costoRecurrenteId } = req.query;
  const where = {};
  if (desde || hasta) {
    where.fechaPago = {};
    if (desde) where.fechaPago.gte = inicioDelDia(desde);
    if (hasta) where.fechaPago.lte = finDelDia(hasta);
  }
  if (costoRecurrenteId) where.costoRecurrenteId = Number(costoRecurrenteId);

  const pagos = await prisma.pagoCostoRecurrente.findMany({
    where,
    include: INCLUDE_PAGO,
    orderBy: { fechaPago: 'desc' },
  });
  res.json(await Promise.all(pagos.map(formatearPago)));
});

router.post('/', verificarToken, soloAdmin, async (req, res) => {
  const { costoRecurrenteId, desde, hasta, diasTrabajados, fechas, pagarCompleto } = req.body;
  if (!costoRecurrenteId) {
    return res.status(400).json({ error: 'Falta costoRecurrenteId' });
  }

  try {
    const costo = await prisma.costoRecurrente.findUnique({ where: { id: Number(costoRecurrenteId) } });
    if (!costo) return res.status(404).json({ error: 'Costo recurrente no encontrado' });

    if (pagarCompleto) {
      const { pendiente } = await calcularPendiente(prisma, costo);
      if (pendiente <= 0) {
        return res.status(400).json({ error: 'Este costo ya está al día, no hay nada pendiente por pagar' });
      }

      const pago = await prisma.pagoCostoRecurrente.create({
        data: {
          costoRecurrenteId: costo.id,
          periodoDesde: inicioDelDia(costo.createdAt),
          periodoHasta: finDelDia(new Date()),
          monto: pendiente,
          registradoPorId: req.usuario.id,
        },
        include: INCLUDE_PAGO,
      });

      return res.json(await formatearPago(pago));
    }

    if (Array.isArray(fechas) && fechas.length > 0) {
      const hoy = inicioDelDia(new Date());
      const fechasUnicas = [...new Set(fechas)].sort();

      const futura = fechasUnicas.find((f) => inicioDelDia(f) > hoy);
      if (futura) {
        return res.status(400).json({ error: `No se puede pagar por adelantado: ${futura} todavía no ha pasado` });
      }

      const existentes = await prisma.diaCostoRecurrente.findMany({
        where: { costoRecurrenteId: costo.id, fecha: { in: fechasUnicas.map((f) => inicioDelDia(f)) } },
      });
      const yaPagado = existentes.find((e) => e.estado === 'PAGADO');
      if (yaPagado) {
        return res.status(400).json({ error: `El día ${formatFechaUTC(yaPagado.fecha)} ya fue pagado anteriormente` });
      }
      const invalido = existentes.find((e) => e.estado === 'INVALIDO');
      if (invalido) {
        return res.status(400).json({ error: `El día ${formatFechaUTC(invalido.fecha)} está marcado como inválido/descontado` });
      }

      const monto = Number((Number(costo.monto) * fechasUnicas.length).toFixed(2));

      const pago = await prisma.pagoCostoRecurrente.create({
        data: {
          costoRecurrenteId: costo.id,
          periodoDesde: inicioDelDia(fechasUnicas[0]),
          periodoHasta: finDelDia(fechasUnicas[fechasUnicas.length - 1]),
          monto,
          registradoPorId: req.usuario.id,
        },
        include: INCLUDE_PAGO,
      });

      await Promise.all(fechasUnicas.map((f) => prisma.diaCostoRecurrente.upsert({
        where: { costoRecurrenteId_fecha: { costoRecurrenteId: costo.id, fecha: inicioDelDia(f) } },
        update: { estado: 'PAGADO', pagoId: pago.id, nota: null },
        create: { costoRecurrenteId: costo.id, fecha: inicioDelDia(f), estado: 'PAGADO', pagoId: pago.id },
      })));

      const diasInvalidos = await diasInvalidosDelPeriodo(costo.id, pago.periodoDesde, pago.periodoHasta);
      return res.json({ ...pago, dias: fechasUnicas, diasInvalidos });
    }

    if (!desde || !hasta) {
      return res.status(400).json({ error: 'Faltan datos: costoRecurrenteId, desde, hasta' });
    }

    const periodoDesde = inicioDelDia(desde);
    const periodoHasta = finDelDia(hasta);
    if (periodoDesde > periodoHasta) {
      return res.status(400).json({ error: 'La fecha "desde" no puede ser posterior a "hasta"' });
    }

    const dias = costo.frecuencia === 'DIARIO' && diasTrabajados != null
      ? Number(diasTrabajados)
      : diasEntre(desde, hasta);
    const montoProrrateado = Number(montoProrateado(costo, dias).toFixed(2));

    const { pendiente } = await calcularPendiente(prisma, costo);
    if (pendiente <= 0) {
      return res.status(400).json({ error: 'Este costo ya está al día, no hay nada pendiente por pagar' });
    }
    const monto = Math.min(montoProrrateado, pendiente);

    const pago = await prisma.pagoCostoRecurrente.create({
      data: {
        costoRecurrenteId: costo.id,
        periodoDesde,
        periodoHasta,
        monto,
        registradoPorId: req.usuario.id,
      },
      include: INCLUDE_PAGO,
    });

    res.json(await formatearPago(pago));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const pago = await prisma.pagoCostoRecurrente.findUnique({ where: { id } });
  if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });

  await prisma.diaCostoRecurrente.deleteMany({ where: { pagoId: id } });
  await prisma.pagoCostoRecurrente.delete({ where: { id } });
  res.json({ eliminado: true });
});

module.exports = router;
