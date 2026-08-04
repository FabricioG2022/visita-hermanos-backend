const { db } = require('../config/firebase');
const cacheService = require('../services/cacheService');
const { randomUUID } = require('crypto');

const CACHE_KEY_ANNOUNCEMENTS = 'announcements_list';
const CACHE_KEY_REQUESTS = 'requests_list';
const CACHE_KEY_CONTACT_LOGS = 'contact_logs_list';

// ==========================================
// AVISOS GENERALES (Announcements)
// ==========================================

const getAnnouncements = async (req, res) => {
  try {
    let cached = cacheService.get(CACHE_KEY_ANNOUNCEMENTS);
    if (cached) return res.json(cached);

    let list = [];
    try {
      const snapshot = await db.collection('announcements').get();
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
    } catch (fsErr) {
      if (fsErr.code === 8 || fsErr.message?.includes('Quota exceeded')) {
        console.warn('⚠️ Cuota de Firestore en avisos. Usando fallback.');
        list = cached || [
          {
            id: 'ann_default_1',
            title: '📌 Recordatorio de Registro de Visitas',
            content: 'Estimados visitadores, recuerden registrar todas las visitas realizadas en el sistema antes del viernes a las 18:00 hs.',
            category: 'Importante',
            authorName: 'Administración',
            isPinned: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 'ann_default_2',
            title: '🗺️ Asignación de Nuevas Zonas',
            content: 'Se han actualizado las zonas de cobertura para las visitas domiciliarias. Consultar en ajustes o con el coordinador.',
            category: 'Información',
            authorName: 'Coordinador General',
            isPinned: false,
            createdAt: new Date().toISOString()
          }
        ];
      } else {
        throw fsErr;
      }
    }

    // Ordenar: Fijados primero, luego por fecha descendente
    list.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    cacheService.set(CACHE_KEY_ANNOUNCEMENTS, list);
    res.json(list);
  } catch (error) {
    console.error('Error al obtener avisos:', error.message);
    res.status(500).json({ message: 'Error al consultar avisos del sistema' });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, content, category, isPinned } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'El título y el contenido son requeridos' });
    }

    const newId = `ann_${randomUUID()}`;
    const newAnnouncement = {
      id: newId,
      title,
      content,
      category: category || 'General',
      isPinned: Boolean(isPinned),
      authorName: req.user ? req.user.name : 'Administrador',
      authorEmail: req.user ? req.user.email : 'admin@visita.com',
      createdAt: new Date().toISOString()
    };

    try {
      await db.collection('announcements').doc(newId).set(newAnnouncement);
    } catch (fsErr) {
      console.warn('⚠️ Cuota al guardar aviso en Firestore, guardado en cache local.');
    }

    let cached = cacheService.get(CACHE_KEY_ANNOUNCEMENTS) || [];
    cached.unshift(newAnnouncement);
    cacheService.set(CACHE_KEY_ANNOUNCEMENTS, cached);

    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error('Error al crear aviso:', error.message);
    res.status(500).json({ message: 'Error al publicar aviso' });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await db.collection('announcements').doc(id).delete();
    } catch (e) {}

    let cached = cacheService.get(CACHE_KEY_ANNOUNCEMENTS) || [];
    cached = cached.filter(a => String(a.id) !== String(id));
    cacheService.set(CACHE_KEY_ANNOUNCEMENTS, cached);

    res.json({ message: 'Aviso eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar aviso' });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, isPinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'El título y el contenido son requeridos' });
    }

    const updateData = {
      title,
      content,
      category: category || 'General',
      isPinned: Boolean(isPinned),
      updatedAt: new Date().toISOString()
    };

    try {
      const docRef = db.collection('announcements').doc(id);
      await docRef.update(updateData);
    } catch (fsErr) {
      console.warn('⚠️ Cuota al actualizar aviso en Firestore, actualizado en cache local.');
    }

    let cached = cacheService.get(CACHE_KEY_ANNOUNCEMENTS) || [];
    const idx = cached.findIndex(a => String(a.id) === String(id));
    if (idx !== -1) {
      cached[idx] = { ...cached[idx], ...updateData };
    }
    // Reordenar por fijados y fecha
    cached.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    cacheService.set(CACHE_KEY_ANNOUNCEMENTS, cached);

    res.json({ message: 'Aviso actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar aviso:', error.message);
    res.status(500).json({ message: 'Error al actualizar aviso' });
  }
};

// ==========================================
// BUZÓN DE SOLICITUDES (Requests)
// ==========================================

const getRequests = async (req, res) => {
  try {
    let cached = cacheService.get(CACHE_KEY_REQUESTS);
    if (cached) return res.json(cached);

    let list = [];
    try {
      const snapshot = await db.collection('requests').get();
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
    } catch (fsErr) {
      if (fsErr.code === 8 || fsErr.message?.includes('Quota exceeded')) {
        list = cached || [
          {
            id: 'req_1',
            subject: 'Solicitud de reasignación de visita',
            details: 'Debido a cambio de horario laboral solicito que el miembro Pedro Gómez sea reasignado.',
            category: 'Reasignación',
            requestedBy: 'FIRGODOY',
            status: 'Pendiente',
            createdAt: new Date().toISOString()
          }
        ];
      } else {
        throw fsErr;
      }
    }

    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    cacheService.set(CACHE_KEY_REQUESTS, list);
    res.json(list);
  } catch (error) {
    console.error('Error al obtener solicitudes:', error.message);
    res.status(500).json({ message: 'Error al cargar solicitudes' });
  }
};

const createRequest = async (req, res) => {
  try {
    const { subject, details, category, recipient, recipientName, recipientId } = req.body;
    if (!subject || !details) {
      return res.status(400).json({ message: 'El asunto y el detalle son obligatorios' });
    }

    const rName = recipientName || recipient || 'Todos';
    const newId = `req_${randomUUID()}`;
    const newRequest = {
      id: newId,
      subject,
      details,
      category: category || 'General',
      requestedBy: req.body.requestedBy || (req.user ? req.user.name : 'Visitador'),
      requestedByEmail: req.body.requestedByEmail || (req.user ? req.user.email : 'visitador@visita.com'),
      requestedById: req.body.requestedById || (req.user ? (req.user.id || req.user.uid || '') : ''),
      recipient: rName,
      recipientName: rName,
      recipientId: recipientId || '',
      status: 'Pendiente',
      responseNote: '',
      createdAt: new Date().toISOString()
    };

    try {
      await db.collection('requests').doc(newId).set(newRequest);
    } catch (e) {}

    let cached = cacheService.get(CACHE_KEY_REQUESTS) || [];
    cached.unshift(newRequest);
    cacheService.set(CACHE_KEY_REQUESTS, cached);

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Error al crear solicitud:', error.message);
    res.status(500).json({ message: 'Error al enviar la solicitud' });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, responseNote } = req.body;

    const docRef = db.collection('requests').doc(id);
    const updateData = {
      status: status || 'Pendiente',
      responseNote: responseNote || '',
      updatedAt: new Date().toISOString()
    };

    try {
      await docRef.update(updateData);
    } catch (e) {}

    let cached = cacheService.get(CACHE_KEY_REQUESTS) || [];
    const idx = cached.findIndex(r => String(r.id) === String(id));
    if (idx !== -1) {
      cached[idx] = { ...cached[idx], ...updateData };
    }
    cacheService.set(CACHE_KEY_REQUESTS, cached);

    res.json(cached[idx] || updateData);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar estado de la solicitud' });
  }
};

// ==========================================
// HISTORIAL DE CONTACTOS (Contact Logs)
// ==========================================

const getContactLogs = async (req, res) => {
  try {
    let cached = cacheService.get(CACHE_KEY_CONTACT_LOGS);
    if (cached) return res.json(cached);

    let list = [];
    try {
      const snapshot = await db.collection('contactLogs').get();
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
    } catch (fsErr) {
      list = cached || [];
    }

    list.sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0));
    cacheService.set(CACHE_KEY_CONTACT_LOGS, list);
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Error al consultar historial de contactos' });
  }
};

const createContactLog = async (req, res) => {
  try {
    const { memberId, memberName, type, templateName, messageText } = req.body;
    if (!memberName || !type) {
      return res.status(400).json({ message: 'Nombre de miembro y tipo de contacto son requeridos' });
    }

    const newId = `log_${randomUUID()}`;
    const newLog = {
      id: newId,
      memberId: memberId || 'general',
      memberName,
      type: type || 'WhatsApp',
      templateName: templateName || 'Mensaje directo',
      messageText: messageText || '',
      sentBy: req.user ? req.user.name : 'Usuario',
      timestamp: new Date().toISOString()
    };

    try {
      await db.collection('contactLogs').doc(newId).set(newLog);
    } catch (e) {}

    let cached = cacheService.get(CACHE_KEY_CONTACT_LOGS) || [];
    cached.unshift(newLog);
    cacheService.set(CACHE_KEY_CONTACT_LOGS, cached);

    res.status(201).json(newLog);
  } catch (error) {
    console.error('Error al registrar historial de contacto:', error.message);
    res.status(500).json({ message: 'Error al guardar registro en historial' });
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getRequests,
  createRequest,
  updateRequestStatus,
  getContactLogs,
  createContactLog
};
