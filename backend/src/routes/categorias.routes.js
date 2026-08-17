const express = require('express');
const prisma = require('../prismaClient');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', verificarToken, async (req, res) => {
  const categorias = await prisma.categoria.findMany({ orderBy: { nombre: 'asc' } });
  res.json(categorias);
});

router.post('/', verificarToken, async (req, res) => {
  const { nombre } = req.body;
  try {
    const categoria = await prisma.categoria.create({ data: { nombre } });
    res.json(categoria);
  } catch (err) {
    res.status(400).json({ error: 'No se pudo crear la categoría' });
  }
});

router.delete('/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  try {
    const tieneProductos = await prisma.producto.findFirst({ where: { categoriaId: Number(id) } });
    if (tieneProductos) {
      return res.status(400).json({ error: 'No se puede eliminar: tiene platos asociados. Muévelos o elimínalos primero.' });
    }
    await prisma.categoria.delete({ where: { id: Number(id) } });
    res.json({ eliminado: true });
  } catch (err) {
    res.status(400).json({ error: 'No se pudo eliminar la categoría' });
  }
});

module.exports = router;