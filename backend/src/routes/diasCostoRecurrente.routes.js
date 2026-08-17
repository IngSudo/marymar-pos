const express = require('express');
const prisma = require('../prismaClient');
const { verificarToken, soloAdmin } = require('../middleware/auth');
const { inicioDelDia, finDelDia, formatFecha, formatFechaUTC } = require('../utils/fechas');

const router = express.Router();

function clave(costoRecurrenteId, fecha) {
  return { costoRecurrenteId_fecha: { costoRecurrenteId: Number(costoRecurrenteId), fecha: inicioDelDia(fecha) } };
}

router.get('/', verificarToken, soloAdmin, async (req, res) => {
  const { costoRecurrenteId, desde, hasta } = req.query;
  if (!costoRecurrenteId) return res.status(400).json({ error: 'Falta costoRecurrenteId' });

  const costo = await prisma.costoRecurrente.findUnique({ where: { id: Number(costoRecurrenteId) } });
  if (!costo) return res.status(404).json({ error: 'Costo recurrente no encontrado' });

  const hoy = inicioDelDia(new Date());
  const inicioRango = inicioDelDia(desde || costo.createdAt);
  const finSolicitado = finDelDia(hasta || hoy);
  const finRango = finSolicitado > finDelDia(hoy) ? finDelDia(hoy) : finSolicitado;

  const excepciones = await prisma.diaCostoRecurrente.findMany({
    where: { costoRecurrenteId: costo.id, fecha: { gte: inicioRango, lte: finRango } },
  });
  const mapa = {};
  excepciones.forEach((e) => { mapa[formatFechaUTC(e.fecha)] = e; });

  const dias = [];
  const cursor = new Date(inicioRango);
  while (cursor <= finRango) {
    const fechaISO = formatFecha(cursor);
    const diaSemana = cursor.getDay();
    const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
    const excepcion = mapa[fechaISO];

    dias.push({
      fecha: fechaISO,
      diaSemana,
      esFinDeSemana,
      estado: excepcion ? excepcion.estado : (esFinDeSemana ? 'NO_APLICA' : 'PENDIENTE'),
      nota: excepcion?.nota || null,
      pagoId: excepcion?.pagoId || null,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  res.json(dias);
});

router.post('/invalidar', verificarToken, soloAdmin, async (req, res) => {
  const { costoRecurrenteId, fecha, nota } = req.body;
  if (!costoRecurrenteId || !fecha) return res.status(400).json({ error: 'Faltan datos' });

  const existente = await prisma.diaCostoRecurrente.findUnique({ where: clave(costoRecurrenteId, fecha) });
  if (existente?.estado === 'PAGADO') {
    return res.status(400).json({ error: 'Ese día ya fue pagado, no se puede modificar' });
  }

  const dia = await prisma.diaCostoRecurrente.upsert({
    where: clave(costoRecurrenteId, fecha),
    update: { estado: 'INVALIDO', nota: nota || null },
    create: { costoRecurrenteId: Number(costoRecurrenteId), fecha: inicioDelDia(fecha), estado: 'INVALIDO', nota: nota || null },
  });
  res.json(dia);
});

router.post('/agregar-extra', verificarToken, soloAdmin, async (req, res) => {
  const { costoRecurrenteId, fecha } = req.body;
  if (!costoRecurrenteId || !fecha) return res.status(400).json({ error: 'Faltan datos' });

  if (inicioDelDia(fecha) > inicioDelDia(new Date())) {
    return res.status(400).json({ error: 'No se puede agregar un día futuro' });
  }

  const existente = await prisma.diaCostoRecurrente.findUnique({ where: clave(costoRecurrenteId, fecha) });
  if (existente?.estado === 'PAGADO') {
    return res.status(400).json({ error: 'Ese día ya fue pagado' });
  }

  const dia = await prisma.diaCostoRecurrente.upsert({
    where: clave(costoRecurrenteId, fecha),
    update: { estado: 'EXTRA_PENDIENTE', nota: null },
    create: { costoRecurrenteId: Number(costoRecurrenteId), fecha: inicioDelDia(fecha), estado: 'EXTRA_PENDIENTE' },
  });
  res.json(dia);
});

router.delete('/', verificarToken, soloAdmin, async (req, res) => {
  const { costoRecurrenteId, fecha } = req.body;
  if (!costoRecurrenteId || !fecha) return res.status(400).json({ error: 'Faltan datos' });

  const existente = await prisma.diaCostoRecurrente.findUnique({ where: clave(costoRecurrenteId, fecha) });
  if (!existente) return res.json({ ok: true });
  if (existente.estado === 'PAGADO') {
    return res.status(400).json({ error: 'Ese día ya fue pagado, no se puede modificar' });
  }

  await prisma.diaCostoRecurrente.delete({ where: { id: existente.id } });
  res.json({ ok: true });
});

module.exports = router;
