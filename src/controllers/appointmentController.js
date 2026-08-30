const { db } = require('../config/firebase');
const cacheService = require('../services/cacheService');

const CACHE_KEY_APPOINTMENTS = 'citas';

const getAppointments = async (req, res) => {
  try {
    const { memberId, status } = req.query;

    let cached = cacheService.get(CACHE_KEY_APPOINTMENTS);
    if (!cached) {
      let appointmentsList = [];
      try {
        const snapshot = await db.collection('appointments').get();
        snapshot.forEach(doc => {
          appointmentsList.push({ id: doc.id, ...doc.data() });
        });
        cached = appointmentsList;
      } catch (fsErr) {
        console.warn('⚠️ Cuota/Conexión a Firestore alcanzada en citas. Usando caché local.');
        cached = [];
      }
      cacheService.set(CACHE_KEY_APPOINTMENTS, cached);
    }

    let list = [...(cached || [])];
    if (memberId) {
      list = list.filter(a => String(a.memberId) === String(memberId));
    }

    if (status) {
      list = list.filter(a => a.status && a.status.toLowerCase() === status.toLowerCase());
    }

    res.json(list);
  } catch (error) {
    console.error('Error al obtener citas:', error.message);
    let fallback = cacheService.get(CACHE_KEY_APPOINTMENTS) || [];
    res.json(fallback);
  }
};

const createAppointment = async (req, res) => {
  try {
    const { memberId, memberName, date, time, visitType, location, responsible, observations } = req.body;

    if (!date || !time) {
      return res.status(400).json({ message: 'La fecha y la hora son obligatorias' });
    }

    const newId = `a_${Date.now()}`;
    const newAppointment = {
      id: newId,
      memberId: memberId || "1",
      memberName: memberName || "Miembro Seleccionado",
      date,
      time,
      visitType: visitType || "Visita en domicilio",
      location: location || "Domicilio",
      responsible: responsible || (req.user ? req.user.name : "Coordinador"),
      observations: observations || "",
      status: "Pendiente",
      createdAt: new Date().toISOString()
    };

    try {
      await db.collection('appointments').doc(newId).set(newAppointment);
    } catch (fsErr) {
      console.warn('⚠️ Cuota/Conexión a Firestore en creación de cita, guardado en caché local.');
    }

    let cached = cacheService.get(CACHE_KEY_APPOINTMENTS) || [];
    cached.unshift(newAppointment);
    cacheService.set(CACHE_KEY_APPOINTMENTS, cached);

    return res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Error al crear cita:', error.message);
    res.status(500).json({ message: 'Error al crear la cita programada' });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const newStatus = status || "Pendiente";

    try {
      const docRef = db.collection('appointments').doc(id);
      await docRef.update({ status: newStatus, updatedAt: new Date().toISOString() });
    } catch (e) {
      console.warn('⚠️ Cuota al actualizar estado de cita en Firestore, actualizado en caché.');
    }

    let cached = cacheService.get(CACHE_KEY_APPOINTMENTS) || [];
    const idx = cached.findIndex(a => String(a.id) === String(id));
    if (idx !== -1) {
      cached[idx] = { ...cached[idx], status: newStatus };
    }
    cacheService.set(CACHE_KEY_APPOINTMENTS, cached);

    res.json(cached[idx] || { id, status: newStatus });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar estado de la cita' });
  }
};

module.exports = {
  getAppointments,
  createAppointment,
  updateAppointmentStatus
};
