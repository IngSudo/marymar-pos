require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const ventasRoutes = require('./routes/ventas.routes');
const gastosRoutes = require('./routes/gastos.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const costosRecurrentesRoutes = require('./routes/costosRecurrentes.routes');
const pagosCostosRecurrentesRoutes = require('./routes/pagosCostosRecurrentes.routes');
const diasCostoRecurrenteRoutes = require('./routes/diasCostoRecurrente.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const notasRoutes = require('./routes/notas.routes');


const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/gastos', gastosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/costos-recurrentes', costosRecurrentesRoutes);
app.use('/api/pagos-costos-recurrentes', pagosCostosRecurrentesRoutes);
app.use('/api/dias-costo-recurrente', diasCostoRecurrenteRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/notas', notasRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});