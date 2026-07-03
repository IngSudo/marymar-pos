const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const user = await prisma.usuario.findUnique({ where: { usuario } });
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const passwordValida = await bcrypt.compare(password, user.password);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol, nombre: user.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, usuario: { id: user.id, nombre: user.nombre, rol: user.rol } });
  } catch (err) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.post('/registrar', async (req, res) => {
  const { nombre, usuario, password, rol } = req.body;

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const nuevoUsuario = await prisma.usuario.create({
      data: { nombre, usuario, password: passwordHash, rol },
    });
    res.json({ id: nuevoUsuario.id, nombre: nuevoUsuario.nombre, rol: nuevoUsuario.rol });
  } catch (err) {
    res.status(400).json({ error: 'No se pudo crear el usuario (¿usuario ya existe?)' });
  }
});

module.exports = router;