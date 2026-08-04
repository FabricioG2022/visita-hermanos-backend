const { db } = require('../config/firebase');
const cacheService = require('../services/cacheService');

const CACHE_KEY_SETTINGS = 'app_settings_global';

const DEFAULT_SETTINGS = {
  id: 'global',
  visitTypes: [
    'Visita en domicilio',
    'Visita en centro',
    'Llamada de seguimiento',
    'Atención médica',
    'Acompañamiento espiritual',
    'Seguimiento pastoral'
  ],
  statuses: [
    { name: 'Pendiente', color: '#f59e0b' },
    { name: 'Realizada', color: '#10b981' },
    { name: 'Reagendada', color: '#3b82f6' },
    { name: 'Cancelada', color: '#ef4444' }
  ],
  reminders: {
    email24h: true,
    email2h: false,
    appNotify: true,
    whatsappAlert: true
  },
  templates: [
    { id: 't_coordinar', key: 'coordinar', title: '📅 Coordinación de Visita', text: 'Hola {nombre}, te escribo del equipo de Visita a Hermanos para coordinar la visita de esta semana. ¿Qué día y horario te queda mejor?' },
    { id: 't_recordatorio', key: 'recordatorio', title: '⏰ Recordatorio de Cita', text: 'Hola {nombre}, te recordamos la cita programada para el {fecha} a las {hora} hs. ¡Esperamos verte pronto!' },
    { id: 't_saludo', key: 'saludo', title: '🙏 Saludo Pastoral y Ánimo', text: 'Hola {nombre}, esperamos que estés teniendo un bendecido día. Quería saludarte y saber cómo te encuentras hoy.' }
  ],
  updatedAt: new Date().toISOString()
};

const getSettings = async (req, res) => {
  try {
    let cached = cacheService.get(CACHE_KEY_SETTINGS);
    if (cached) return res.json(cached);

    let settings = { ...DEFAULT_SETTINGS };
    try {
      const doc = await db.collection('settings').doc('global').get();
      if (doc.exists) {
        settings = { ...DEFAULT_SETTINGS, ...doc.data() };
      }
    } catch (fsErr) {
      console.warn('⚠️ Cuota de Firestore superada al consultar configuración, usando caché local.');
    }

    cacheService.set(CACHE_KEY_SETTINGS, settings);
    res.json(settings);
  } catch (error) {
    console.error('Error al consultar configuración:', error.message);
    res.status(500).json({ message: 'Error al cargar configuración del sistema' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { visitTypes, statuses, reminders, templates } = req.body;

    let current = cacheService.get(CACHE_KEY_SETTINGS) || { ...DEFAULT_SETTINGS };

    const updatedSettings = {
      ...current,
      id: 'global',
      visitTypes: Array.isArray(visitTypes) ? visitTypes : current.visitTypes,
      statuses: Array.isArray(statuses) ? statuses : current.statuses,
      reminders: reminders ? { ...current.reminders, ...reminders } : current.reminders,
      templates: Array.isArray(templates) ? templates : (current.templates || DEFAULT_SETTINGS.templates),
      updatedAt: new Date().toISOString()
    };

    try {
      await db.collection('settings').doc('global').set(updatedSettings, { merge: true });
    } catch (fsErr) {
      console.warn('⚠️ Cuota de Firestore superada al actualizar configuración, guardado en caché local.');
    }

    cacheService.set(CACHE_KEY_SETTINGS, updatedSettings);
    res.json(updatedSettings);
  } catch (error) {
    console.error('Error al actualizar configuración:', error.message);
    res.status(500).json({ message: 'Error al actualizar configuración del sistema' });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
