const express = require('express');
const prisma = require('../prismaClient');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', verificarToken, soloAdmin, async (req, res) => {
  const { descripcion, monto, fecha } = req.body;
  try {
    const gasto = await prisma.gasto.create({
      data: {
        descripcion,
        monto,
        fecha: fecha ? new Date(fecha) : undefined,
      },
    });
    res.json(gasto);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', verificarToken, soloAdmin, async (req, res) => {
  const { desde, hasta } = req.query;
  const where = {};
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = new Date(desde);
    if (hasta) where.fecha.lte = new Date(hasta);
  }

  const gastos = await prisma.gasto.findMany({ where, orderBy: { fecha: 'desc' } });
  res.json(gastos);
});

module.exports = router;