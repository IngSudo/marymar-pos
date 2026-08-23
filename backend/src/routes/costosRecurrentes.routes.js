const express = require('express');
const prisma = require('../prismaClient');
const { verificarToken, soloAdmin } = require('../middleware/auth');
const { calcularPendiente } = require('../utils/pendientes');

const router = express.Router();

router.get('/', verificarToken, soloAdmin, async (req, res) => {
  const costos = await prisma.costoRecurrente.findMany({
    orderBy: { descripcion: 'asc' },
  });
  res.json(costos);
});

router.get('/pendientes', verificarToken, soloAdmin, async (req, res) => {
  const costos = await prisma.costoRecurrente.findMany({ where: { activo: true } });

  const resultado = await Promise.all(costos.map(async (c) => {
    const r = await calcularPendiente(prisma, c);
    return { costoRecurrenteId: c.id, ...r };
  }));

  res.json(resultado);
});

router.post('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    if (Array.isArray(req.body.costosRecurrentes)) {
      const creados = await prisma.costoRecurrente.createMany({
        data: req.body.costosRecurrentes.map((c) => ({
          descripcion: c.descripcion,
          monto: c.monto,
          frecuencia: c.frecuencia,
          tipo: c.tipo,
        })),
      });
      return res.json({ creados: creados.count });
    }

    const { descripcion, monto, frecuencia, tipo } = req.body;
    const costo = await prisma.costoRecurrente.create({
      data: { descripcion, monto, frecuencia, tipo },
    });
    res.json(costo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  const { id } = req.params;
  const { descripcion, monto, frecuencia, tipo } = req.body;
  try {
    const costo = await prisma.costoRecurrente.update({
      where: { id: Number(id) },
      data: { descripcion, monto, frecuencia, tipo },
    });
    res.json(costo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/desactivar', verificarToken, soloAdmin, async (req, res) => {
  const { id } = req.params;
  const costo = await prisma.costoRecurrente.update({
    where: { id: Number(id) },
    data: { activo: false },
  });
  res.json(costo);
});

router.patch('/:id/activar', verificarToken, soloAdmin, async (req, res) => {
  const { id } = req.params;
  const costo = await prisma.costoRecurrente.update({
    where: { id: Number(id) },
    data: { activo: true },
  });
  res.json(costo);
});

router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.costoRecurrente.delete({ where: { id: Number(id) } });
    res.json({ eliminado: true });
  } catch (err) {
    if (err.code === 'P2003') {
      return res.status(400).json({
        error: 'No se puede eliminar: este costo tiene pagos y/o días registrados (pagados, descontados o extras) en su historial. Elimina esos pagos y reactiva esos días primero, o desactívalo en su lugar.',
      });
    }
    res.status(400).json({ error: 'No se pudo eliminar' });
  }
});

module.exports = router;
