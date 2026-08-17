const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");

const router = express.Router();
const { verificarToken, soloAdmin } = require('../middleware/auth');

router.post("/login", async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const user = await prisma.usuario.findUnique({ where: { usuario } });
    if (!user) {
      return res
        .status(401)
        .json({ error: "Usuario o contraseña incorrectos" });
    }

    if (!user.activo) {
      return res.status(401).json({ error: "Usuario desactivado" });
    }

    const passwordValida = await bcrypt.compare(password, user.password);
    if (!passwordValida) {
      return res
        .status(401)
        .json({ error: "Usuario o contraseña incorrectos" });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol, nombre: user.nombre },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({
      token,
      usuario: { id: user.id, nombre: user.nombre, rol: user.rol },
    });
  } catch (err) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

router.post("/registrar", verificarToken, soloAdmin, async (req, res) => {
  const { nombre, usuario, password, rol } = req.body;

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const nuevoUsuario = await prisma.usuario.create({
      data: { nombre, usuario, password: passwordHash, rol },
    });
    res.json({
      id: nuevoUsuario.id,
      nombre: nuevoUsuario.nombre,
      rol: nuevoUsuario.rol,
    });
  } catch (err) {
    res
      .status(400)
      .json({ error: "No se pudo crear el usuario (¿usuario ya existe?)" });
  }
});

router.get('/usuarios', verificarToken, soloAdmin, async (req, res) => {
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      nombre: true,
      usuario: true,
      rol: true,
      activo: true,
      createdAt: true,
      fechaDesactivacion: true,
    },
    orderBy: { nombre: 'asc' },
  });
  res.json(usuarios);
});

router.patch('/usuarios/:id/desactivar', verificarToken, soloAdmin, async (req, res) => {
  const usuario = await prisma.usuario.update({
    where: { id: Number(req.params.id) },
    data: { activo: false, fechaDesactivacion: new Date() },
    select: { id: true, nombre: true, usuario: true, rol: true, activo: true, createdAt: true, fechaDesactivacion: true },
  });
  res.json(usuario);
});

router.patch('/usuarios/:id/activar', verificarToken, soloAdmin, async (req, res) => {
  const usuario = await prisma.usuario.update({
    where: { id: Number(req.params.id) },
    data: { activo: true, fechaDesactivacion: null },
    select: { id: true, nombre: true, usuario: true, rol: true, activo: true, createdAt: true, fechaDesactivacion: true },
  });
  res.json(usuario);
});

router.delete('/usuarios/:id', verificarToken, soloAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const tieneVentas = await prisma.venta.findFirst({ where: { usuarioId: Number(id) } });
    if (tieneVentas) {
      return res.status(400).json({ error: 'No se puede eliminar: tiene ventas registradas. Desactívalo en su lugar.' });
    }
    await prisma.usuario.delete({ where: { id: Number(id) } });
    res.json({ eliminado: true });
  } catch (err) {
    res.status(400).json({ error: 'No se pudo eliminar el usuario' });
  }
});

router.post('/usuarios/:id/sesion-dispositivo', verificarToken, soloAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.usuario.findUnique({ where: { id: Number(id) } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (user.rol !== 'CAJERO') return res.status(400).json({ error: 'Solo se puede configurar un cajero como caja predeterminada' });
    if (!user.activo) return res.status(400).json({ error: 'Ese usuario está desactivado' });

    const token = jwt.sign(
      { id: user.id, rol: user.rol, nombre: user.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '180d' } // sesión larga, pensada para no expirar en el uso diario
    );

    res.json({ token, usuario: { id: user.id, nombre: user.nombre, rol: user.rol } });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo generar la sesión de dispositivo' });
  }
});

module.exports = router;