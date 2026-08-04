const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/firebase');

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

// Middlewares globales
app.use(cors());
app.use(express.json());

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
