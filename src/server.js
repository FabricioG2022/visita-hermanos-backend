const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
require('./config/firebase');

const { sanitizeBody } = require('./middleware/sanitizeMiddleware');
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const visitRoutes = require('./routes/visitRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const verseRoutes = require('./routes/verseRoutes');
const messageRoutes = require('./routes/messageRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Cabeceras HTTP de Seguridad (Helmet)
app.use(helmet());

// Limitador de tasa global para la API (300 req / 15 min)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas solicitudes desde esta IP, por favor intenta nuevamente más tarde.' }
});
app.use('/api/', globalLimiter);

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(sanitizeBody);

// Ruta base de estado
app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    message: 'API REST - Web Visita Hermanos',
    version: '1.0.0',
    documentation: 'Consigne Final - Plataformas de Desarrollo'
  });
});

// Registro de rutas API
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/verse', verseRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/settings', settingsRoutes);

// Manejador de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint no encontrado' });
});

// Middleware global de captura de errores
app.use((err, req, res, next) => {
  console.error('❌ Error no controlado:', err);
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.statusCode || 500).json({
    message: isProduction ? 'Ocurrió un error interno en el servidor.' : (err.message || 'Error interno del servidor'),
    ...(isProduction ? {} : { stack: err.stack })
  });
});

const { seedAdminUser } = require('./controllers/authController');

// Iniciar Servidor
app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 Servidor Backend iniciado en puerto ${PORT}`);
  console.log(`📡 Endpoint base: http://localhost:${PORT}/api`);
  console.log(`====================================================`);
  
  // Inicialización de Semillas en Firebase Auth
  await seedAdminUser();
});

// Manejadores de eventos del proceso Node.js (evitan que caiga la aplicación)
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Promesa rechazada no manejada:', promise, 'Razón:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('💥 Excepción no capturada a nivel de proceso:', err);
});

