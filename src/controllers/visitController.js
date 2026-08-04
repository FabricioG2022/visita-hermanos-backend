const { db } = require('../config/firebase');
const cacheService = require('../services/cacheService');
const { fetchAllMembersInternal } = require('./memberController');

const CACHE_KEY_VISITS = 'visitas';

const getVisits = async (req, res) => {
  try {
    const { memberId } = req.query;

    let cached = cacheService.get(CACHE_KEY_VISITS);
    if (cached) {
      let list = [...cached];
      if (memberId) list = list.filter(v => String(v.memberId) === String(memberId));
      return res.json(list);
    }

    let visitsList = [];
    try {
      // 1. Obtener documentos de la colección 'visits'
      const snapshot = await db.collection('visits').get();
      snapshot.forEach(doc => {
        visitsList.push({ id: doc.id, ...doc.data() });
      });

      // 2. Obtener miembros (utiliza caché centralizado en memoria, 0 lecturas adicionales a Firestore)
      const members = await fetchAllMembersInternal();
      members.forEach(mData => {
        const mName = mData.name || mData.nombre || '';
        const mId = mData.id;
        if (mData.historialVisitas && Array.isArray(mData.historialVisitas)) {
          mData.historialVisitas.forEach((v, idx) => {
            visitsList.push({
              id: `mv_${mId}_${idx}`,
              memberId: mId,
              memberName: mName,
              date: v.fecha || mData.lastVisit || '',
              time: v.hora || '16:00',
              responsible: v.visitador || 'Voluntario',
              summary: v.nota || v.resumen || 'Visita registrada en historial de miembro.',
              status: v.nuevoEstadoAnimico || mData.status || 'Verde',
              fotoUrl: mData.fotoUrl || '',
              createdAt: v.fecha || new Date().toISOString()
            });
          });
        }
      });

      visitsList.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));

      cacheService.set(CACHE_KEY_VISITS, visitsList);
      cached = visitsList;
    } catch (fsErr) {
      if (fsErr.code === 8 || fsErr.message?.includes('Quota exceeded')) {
        console.warn('⚠️ Cuota diaria de Firestore alcanzada en visitas. Usando cache local.');
        cached = cacheService.get(CACHE_KEY_VISITS) || [];
      } else {
        throw fsErr;
      }
    }

    let list = [...(cached || [])];
    if (memberId) {
      list = list.filter(v => String(v.memberId) === String(memberId));
    }

    res.json(list);
  } catch (error) {
    console.error('Error al consultar visitas de Firestore:', error.message);
    res.status(503).json({ message: 'Límite de cuota de Firebase alcanzado temporalmente' });
  }
};

const createVisit = async (req, res) => {
  try {
    const { memberId, memberName, date, time, summary, responsible } = req.body;

    let name = memberName;
    if (!name && memberId) {
      try {
        const members = await fetchAllMembersInternal();
        const found = members.find(m => String(m.id) === String(memberId));
        if (found) name = found.name;
      } catch (e) {}
    }

    const newId = `v_${Date.now()}`;
    const visitDate = date || new Date().toLocaleDateString('es-AR');

    const newVisit = {
      id: newId,
      memberId: memberId || "1",
      memberName: name || "Miembro Seleccionado",
      date: visitDate,
      time: time || "16:00",
      responsible: responsible || (req.user ? req.user.name : "Voluntario"),
      summary: summary || "Visita realizada exitosamente.",
      status: "Realizada",
      createdAt: new Date().toISOString()
    };

    await db.collection('visits').doc(newId).set(newVisit);

    if (memberId) {
      try {
        const memberRef = db.collection('miembros').doc(memberId);
        const memberDoc = await memberRef.get();
        if (memberDoc.exists) {
          await memberRef.update({ ultimaVisita: visitDate });
        }
      } catch (e) {}
    }

    // Actualizar caché de visitas y desinvalidar miembros/dashboard
    let cached = cacheService.get(CACHE_KEY_VISITS) || [];
    cached.unshift(newVisit);
    cacheService.set(CACHE_KEY_VISITS, cached);
    cacheService.invalidateKeys('miembros', 'dashboard_stats');

    res.status(201).json(newVisit);
  } catch (error) {
    console.error('Error al crear visita en Firestore:', error.message);
    res.status(503).json({ message: 'Cuota de Firebase excedida al registrar visita.' });
  }
};

module.exports = {
  getVisits,
  createVisit
};
