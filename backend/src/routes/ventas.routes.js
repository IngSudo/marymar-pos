const express = require("express");
const prisma = require("../prismaClient");
const { verificarToken } = require("../middleware/auth");
const { inicioDelDia, finDelDia } = require('../utils/fechas');

const router = express.Router();

router.post("/", verificarToken, async (req, res) => {
  const { items } = req.body;

  if (!items || items.length === 0) {
    return res
      .status(400)
      .json({ error: "La venta debe tener al menos un producto" });
  }

  try {
    const productoIds = items.map((i) => i.productoId);
    const productos = await prisma.producto.findMany({
      where: { id: { in: productoIds } },
    });

    let total = 0;
    const detalles = items.map((item) => {
      const producto = productos.find((p) => p.id === item.productoId);
      if (!producto) throw new Error(`Producto ${item.productoId} no existe`);
      const subtotal = Number(producto.precio) * item.cantidad;
      total += subtotal;
      return {
        productoId: producto.id,
        cantidad: item.cantidad,
        subtotal,
      };
    });

    const venta = await prisma.venta.create({
      data: {
        usuarioId: req.usuario.id,
        total,
        detalles: { create: detalles },
      },
      include: { detalles: { include: { producto: true } } },
    });

    res.json(venta);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/", verificarToken, async (req, res) => {
  const { desde, hasta } = req.query;
  const where = {};
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = inicioDelDia(desde);
    if (hasta) where.fecha.lte = finDelDia(hasta);
  }

  const ventas = await prisma.venta.findMany({
    where,
    include: { detalles: { include: { producto: true } }, usuario: true },
    orderBy: { fecha: "desc" },
  });
  res.json(ventas);
});

module.exports = router;
