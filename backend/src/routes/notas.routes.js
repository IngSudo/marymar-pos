const express = require('express');
const prisma = require('../prismaClient');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verificarToken, async (req, res) => {
  const notas = await prisma.nota.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(notas);
});

router.post('/', verificarToken, async (req, res) => {
  const { contenido } = req.body;
  try {
    const nota = await prisma.nota.create({
      data: { contenido, creadoPor: req.usuario.nombre },
    });
    res.json(nota);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo crear la nota' });
  }
});

router.put('/:id', verificarToken, async (req, res) => {
  const { contenido } = req.body;
  try {
    const nota = await prisma.nota.update({
      where: { id: Number(req.params.id) },
      data: { contenido },
    });
    res.json(nota);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo editar la nota' });
  }
});

router.delete('/:id', verificarToken, async (req, res) => {
  try {
    await prisma.nota.delete({ where: { id: Number(req.params.id) } });
    res.json({ eliminado: true });
  } catch (err) {
    res.status(400).json({ error: 'No se pudo eliminar la nota' });
  }
});

module.exports = router;