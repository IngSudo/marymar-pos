const express = require('express');
const prisma = require('../prismaClient');
const { verificarToken } = require('../middleware/auth');
const { inicioDelDia, finDelDia } = require('../utils/fechas');

const router = express.Router();

router.post('/', verificarToken, async (req, res) => {
  const { descripcion, monto, fecha } = req.body;
  try {
    const gasto = await prisma.gasto.create({
      data: {
        descripcion,
        monto,
        fecha: fecha ? inicioDelDia(fecha) : undefined,
      },
    });
    res.json(gasto);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', verificarToken, async (req, res) => {
  const { desde, hasta } = req.query;
  const where = {};
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = inicioDelDia(desde);
    if (hasta) where.fecha.lte = finDelDia(hasta);
  }

  const gastos = await prisma.gasto.findMany({ where, orderBy: { fecha: 'desc' } });
  res.json(gastos);
});

router.put('/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  const { descripcion, monto, fecha } = req.body;
  try {
    const gasto = await prisma.gasto.update({
      where: { id: Number(id) },
      data: {
        descripcion,
        monto,
        fecha: fecha ? inicioDelDia(fecha) : undefined,
      },
    });
    res.json(gasto);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo actualizar el gasto' });
  }
});

router.delete('/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.gasto.delete({ where: { id: Number(id) } });
    res.json({ eliminado: true });
  } catch (err) {
    res.status(400).json({ error: 'No se pudo eliminar el gasto' });
  }
});

module.exports = router;