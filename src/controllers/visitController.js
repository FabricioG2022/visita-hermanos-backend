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
    const seenVisitKeys = new Set();

    // 1. Obtener documentos de la colección 'visits'
    try {
      const snapshot = await db.collection('visits').get();
      snapshot.forEach(doc => {
        const vData = doc.data();
        visitsList.push({ id: doc.id, ...vData });
        if (vData.memberId && vData.date) {
          seenVisitKeys.add(`${vData.memberId}_${vData.date}_${vData.summary || ''}`);
        }
      });
    } catch (fsErr) {
      console.warn("⚠️ Advertencia al leer coleccion visits:", fsErr.message);
    }

    // 2. Obtener miembros e integrar su historialVisitas (para sincronizar con app móvil)
    try {
      const members = await fetchAllMembersInternal();
      members.forEach(mData => {
        const mName = mData.name || mData.nombre || '';
        const mId = mData.id;
        if (mData.historialVisitas && Array.isArray(mData.historialVisitas)) {
          mData.historialVisitas.forEach((v, idx) => {
            const dateStr = v.fecha || mData.lastVisit || '';
            const summaryStr = v.nota || v.resumen || '';
            const key = `${mId}_${dateStr}_${summaryStr}`;
            if (!seenVisitKeys.has(key)) {
              seenVisitKeys.add(key);
              visitsList.push({
                id: `mv_${mId}_${idx}`,
                memberId: mId,
                memberName: mName,
                date: dateStr,
                time: v.hora || '16:00',
                responsible: v.visitador || 'Voluntario',
                summary: summaryStr || 'Visita registrada en historial de miembro.',
                status: v.nuevoEstadoAnimico || mData.status || 'Verde',
                fotoUrl: mData.fotoUrl || '',
                createdAt: v.fecha || new Date().toISOString()
              });
            }
          });
        }
      });
    } catch (fsErr) {
      console.warn("⚠️ Advertencia al leer historialVisitas de miembros:", fsErr.message);
    }

    visitsList.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));

    cacheService.set(CACHE_KEY_VISITS, visitsList);
    cached = visitsList;

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
    const { memberId, memberName, date, time, summary, responsible, status, visitType } = req.body;

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
    const visitTime = time || new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const visitStatus = status || "Verde";
    const visitResponsible = responsible || (req.user ? req.user.name : "Voluntario");
    const visitSummary = summary || "Visita realizada exitosamente.";

    const newVisit = {
      id: newId,
      memberId: memberId || "1",
      memberName: name || "Miembro Seleccionado",
      date: visitDate,
      time: visitTime,
      responsible: visitResponsible,
      visitType: visitType || "Visita en domicilio",
      summary: visitSummary,
      status: visitStatus,
      createdAt: new Date().toISOString()
    };

    // 1. Guardar documento en colección 'visits'
    await db.collection('visits').doc(newId).set(newVisit);

    // 2. Actualizar el miembro en la colección 'miembros' (actualizar estadoAnimico, status, ultimaVisita, lastVisit y historialVisitas)
    if (memberId) {
      try {
        const memberRef = db.collection('miembros').doc(memberId);
        const memberDoc = await memberRef.get();
        if (memberDoc.exists) {
          const mData = memberDoc.data() || {};
          const currentHistory = Array.isArray(mData.historialVisitas) ? mData.historialVisitas : [];

          const newHistoryItem = {
            fecha: visitDate,
            hora: visitTime,
            visitador: visitResponsible,
            nuevoEstadoAnimico: visitStatus,
            nota: visitSummary,
            tipoVisita: visitType || "Visita en domicilio"
          };

          const updatedHistory = [newHistoryItem, ...currentHistory];

          await memberRef.update({
            estadoAnimico: visitStatus,
            status: visitStatus,
            ultimaVisita: visitDate,
            lastVisit: visitDate,
            historialVisitas: updatedHistory
          });
        }
      } catch (e) {
        console.error("Error actualizando miembro en createVisit:", e.message);
      }
    }

    // Invalidar cachés para forzar recarga limpia en todo el sistema
    cacheService.invalidateKeys('miembros', 'visitas', 'dashboard_stats');

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
