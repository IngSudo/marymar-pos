const express = require("express");
const prisma = require("../prismaClient");
const { verificarToken, soloAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", verificarToken, async (req, res) => {
  const productos = await prisma.producto.findMany({
    include: { categoria: true },
    orderBy: { nombre: "asc" },
  });
  res.json(productos);
});

router.post("/", verificarToken, async (req, res) => {
  const { nombre, precio, costoEstimado, categoriaId } = req.body;
  const producto = await prisma.producto.create({
    data: { nombre, precio, costoEstimado, categoriaId },
  });
  res.json(producto);
});

router.put("/:id", verificarToken, async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, costoEstimado, categoriaId, activo } = req.body;
  const producto = await prisma.producto.update({
    where: { id: Number(id) },
    data: { nombre, precio, costoEstimado, categoriaId, activo },
  });
  res.json(producto);
});

router.patch("/:id/desactivar", verificarToken, async (req, res) => {
  const { id } = req.params;
  const producto = await prisma.producto.update({
    where: { id: Number(id) },
    data: { activo: false },
  });
  res.json(producto);
});

router.patch('/:id/activar', verificarToken, async (req, res) => {
  const { id } = req.params;
  const producto = await prisma.producto.update({
    where: { id: Number(id) },
    data: { activo: true },
  });
  res.json(producto);
});

router.delete('/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  try {
    const tieneVentas = await prisma.detalleVenta.findFirst({ where: { productoId: Number(id) } });
    if (tieneVentas) {
      return res.status(400).json({ error: 'No se puede eliminar: tiene ventas registradas. Desactívalo en su lugar.' });
    }
    await prisma.producto.delete({ where: { id: Number(id) } });
    res.json({ eliminado: true });
  } catch (err) {
    res.status(400).json({ error: 'No se pudo eliminar el producto' });
  }
});

module.exports = router;
