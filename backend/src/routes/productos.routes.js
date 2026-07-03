const express = require('express');
const prisma = require('../prismaClient');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', verificarToken, async (req, res) => {
  const productos = await prisma.producto.findMany({
    include: { categoria: true },
    orderBy: { nombre: 'asc' },
  });
  res.json(productos);
});

router.post('/', verificarToken, soloAdmin, async (req, res) => {
  const { nombre, precio, costoEstimado, categoriaId } = req.body;
  const producto = await prisma.producto.create({
    data: { nombre, precio, costoEstimado, categoriaId },
  });
  res.json(producto);
});

router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, costoEstimado, categoriaId, activo } = req.body;
  const producto = await prisma.producto.update({
    where: { id: Number(id) },
    data: { nombre, precio, costoEstimado, categoriaId, activo },
  });
  res.json(producto);
});

router.patch('/:id/desactivar', verificarToken, soloAdmin, async (req, res) => {
  const { id } = req.params;
  const producto = await prisma.producto.update({
    where: { id: Number(id) },
    data: { activo: false },
  });
  res.json(producto);
});

module.exports = router;