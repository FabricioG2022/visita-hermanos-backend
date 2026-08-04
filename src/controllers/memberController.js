const { db } = require('../config/firebase');
const cacheService = require('../services/cacheService');

const CACHE_KEY_MEMBERS = 'miembros';

// Mapeadores: convierte el esquema de Firestore al del frontend
const toFrontend = (id, data) => ({
  id,
  name:        data.nombre        || data.name        || '',
  phone:       data.telefono      || data.phone       || '',
  email:       data.email         || '',
  address:     data.direccion     || data.address     || '',
  status:      data.estadoAnimico || data.status      || 'Verde',
  lastVisit:   data.ultimaVisita  || data.lastVisit   || 'Sin visitas aún',
  isFavorite:  Boolean(data.isFavorite),
  notes:       data.notas         || data.notes       || '',
  fotoUrl:     data.fotoUrl       || '',
  church_id:   data.church_id     || '',
  historialVisitas: data.historialVisitas || [],
  historialNotas:   data.historialNotas   || [],
  birthDate:   data.fechaNacimiento || data.birthDate || '',
  memberSince: data.miembroDesde    || data.memberSince|| '',
});

const toFirestore = (body) => {
  const data = {};
  if (body.name      !== undefined) data.nombre        = body.name;
  if (body.phone     !== undefined) data.telefono      = body.phone;
  if (body.email     !== undefined) data.email         = body.email;
  if (body.address   !== undefined) data.direccion     = body.address;
  if (body.status    !== undefined) data.estadoAnimico = body.status;
  if (body.lastVisit !== undefined) data.ultimaVisita  = body.lastVisit;
  if (body.isFavorite!== undefined) data.isFavorite    = Boolean(body.isFavorite);
  if (body.notes     !== undefined) data.notas         = body.notes;
  if (body.historialNotas !== undefined) data.historialNotas = body.historialNotas;
  if (body.fotoUrl   !== undefined) data.fotoUrl       = body.fotoUrl;
  if (body.birthDate !== undefined) data.fechaNacimiento = body.birthDate;
  if (body.memberSince!== undefined) data.miembroDesde = body.memberSince;
  return data;
};

// Función interna auxiliar para obtener todos los miembros (con caché centralizado)
const fetchAllMembersInternal = async () => {
  let cached = cacheService.get(CACHE_KEY_MEMBERS);
  if (cached) return cached;

  let list = [];
  try {
    const snapshot = await db.collection('miembros').get();
    snapshot.forEach(doc => {
      list.push(toFrontend(doc.id, doc.data()));
    });
    cacheService.set(CACHE_KEY_MEMBERS, list);
    return list;
  } catch (fsErr) {
    if (fsErr.code === 8 || fsErr.message?.includes('Quota exceeded')) {
      console.warn('⚠️ Cuota diaria gratuita de Firestore alcanzada. Sirviendo miembros desde cache local.');
      return cacheService.get(CACHE_KEY_MEMBERS) || [];
    }
    throw fsErr;
  }
};

// GET /api/members — lista de miembros con caché centralizado
const getMembers = async (req, res) => {
  try {
    const { search, status } = req.query;
    let list = await fetchAllMembersInternal();

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.email.toLowerCase().includes(q)
      );
    }

    if (status) {
      list = list.filter(m => m.status.toLowerCase() === status.toLowerCase());
    }

    res.json(list);
  } catch (error) {
    console.error('Error al consultar miembros de Firestore:', error.message);
    res.status(503).json({ 
      message: 'La cuota gratuita diaria de Firebase se ha superado temporalmente.' 
    });
  }
};

const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    const members = await fetchAllMembersInternal();
    const found = members.find(m => String(m.id) === String(id));
    if (found) return res.json(found);

    const doc = await db.collection('miembros').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Miembro no encontrado' });
    }
    res.json(toFrontend(doc.id, doc.data()));
  } catch (error) {
    res.status(503).json({ message: 'Límite de cuota de Firebase alcanzado temporalmente' });
  }
};

const createMember = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: 'El nombre y teléfono son obligatorios' });
    }

    const { randomUUID } = require('crypto');
    const newId = randomUUID();
    const fsData = {
      nombre:       name,
      telefono:     phone,
      email:        req.body.email       || '',
      direccion:    req.body.address     || '',
      estadoAnimico: req.body.status     || 'Verde',
      ultimaVisita: 'N/A',
      isFavorite:   false,
      notas:        req.body.notes       || '',
      fotoUrl:      req.body.fotoUrl     || '',
      church_id:    req.body.church_id   || '',
      historialVisitas: [],
      fechaNacimiento:  req.body.birthDate   || '',
      miembroDesde:     req.body.memberSince || new Date().toLocaleDateString('es-AR'),
      creadoEn:         new Date().toISOString()
    };

    await db.collection('miembros').doc(newId).set(fsData);
    const created = toFrontend(newId, fsData);

    // Actualizar caché de miembros e invalidar dashboard stats
    let cached = cacheService.get(CACHE_KEY_MEMBERS) || [];
    cached.unshift(created);
    cacheService.set(CACHE_KEY_MEMBERS, cached);
    cacheService.invalidateKeys('dashboard_stats', 'visitas');

    res.status(201).json(created);
  } catch (error) {
    console.error('Error al crear miembro en Firestore:', error.message);
    res.status(503).json({ message: 'Cuota de Firebase excedida temporalmente al guardar miembro.' });
  }
};

const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('miembros').doc(id);
    const updateData = { ...toFirestore(req.body), actualizadoEn: new Date().toISOString() };
    await docRef.update(updateData);
    const updated = await docRef.get();
    const result = toFrontend(updated.id, updated.data());

    // Actualizar caché
    let cached = cacheService.get(CACHE_KEY_MEMBERS) || [];
    const idx = cached.findIndex(m => String(m.id) === String(id));
    if (idx !== -1) cached[idx] = result;
    else cached.unshift(result);

    cacheService.set(CACHE_KEY_MEMBERS, cached);
    cacheService.invalidateKeys('dashboard_stats', 'visitas');

    res.json(result);
  } catch (error) {
    res.status(503).json({ message: 'Cuota de Firebase excedida temporalmente al actualizar.' });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('miembros').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Miembro no encontrado' });

    const current = Boolean(doc.data().isFavorite);
    await docRef.update({ isFavorite: !current });
    const updated = await docRef.get();
    const result = toFrontend(updated.id, updated.data());

    let cached = cacheService.get(CACHE_KEY_MEMBERS) || [];
    const idx = cached.findIndex(m => String(m.id) === String(id));
    if (idx !== -1) cached[idx] = result;
    cacheService.set(CACHE_KEY_MEMBERS, cached);
    cacheService.invalidateKeys('dashboard_stats');

    res.json(result);
  } catch (error) {
    res.status(503).json({ message: 'Cuota de Firebase excedida temporalmente al modificar favorito.' });
  }
};

const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('miembros').doc(id);
    await docRef.delete();

    let cached = cacheService.get(CACHE_KEY_MEMBERS) || [];
    cached = cached.filter(m => String(m.id) !== String(id));
    cacheService.set(CACHE_KEY_MEMBERS, cached);
    cacheService.invalidateKeys('dashboard_stats', 'visitas');

    res.json({ message: 'Miembro eliminado con éxito' });
  } catch (error) {
    res.status(503).json({ message: 'Cuota de Firebase excedida temporalmente al eliminar.' });
  }
};

const addMemberNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { texto, note } = req.body;
    const noteText = texto || note;
    if (!noteText || !noteText.trim()) {
      return res.status(400).json({ message: 'El texto de la nota es obligatorio' });
    }

    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('es-AR')} ${now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs`;

    const newNoteObj = {
      id: `n_${Date.now()}`,
      texto: noteText.trim(),
      fecha: dateFormatted,
      createdAt: now.toISOString(),
      autor: req.user ? (req.user.name || req.user.email) : 'Visitador'
    };

    try {
      const docRef = db.collection('miembros').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) {
        return res.status(404).json({ message: 'Miembro no encontrado' });
      }

      const currentData = doc.data();
      const currentHistorial = currentData.historialNotas || [];
      const updatedHistorial = [newNoteObj, ...currentHistorial];

      await docRef.update({
        historialNotas: updatedHistorial,
        notas: noteText.trim(),
        actualizadoEn: now.toISOString()
      });

      const updated = await docRef.get();
      const result = toFrontend(updated.id, updated.data());

      let cached = cacheService.get(CACHE_KEY_MEMBERS) || [];
      const idx = cached.findIndex(m => String(m.id) === String(id));
      if (idx !== -1) cached[idx] = result;
      cacheService.set(CACHE_KEY_MEMBERS, cached);

      return res.status(200).json(result);
    } catch (fsErr) {
      if (fsErr.code === 8 || fsErr.message?.includes('Quota exceeded')) {
        console.warn('⚠️ Cuota diaria de Firestore alcanzada en addMemberNote. Guardando en cache local.');
        let cached = cacheService.get(CACHE_KEY_MEMBERS) || [];
        const idx = cached.findIndex(m => String(m.id) === String(id));
        if (idx !== -1) {
          const currentHistorial = cached[idx].historialNotas || [];
          cached[idx].historialNotas = [newNoteObj, ...currentHistorial];
          cached[idx].notes = noteText.trim();
          cacheService.set(CACHE_KEY_MEMBERS, cached);
          return res.json(cached[idx]);
        }
      }
      throw fsErr;
    }
  } catch (error) {
    console.error('Error al agregar nota:', error.message);
    res.status(503).json({ message: 'Error al guardar la nota en el servidor' });
  }
};

module.exports = {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  toggleFavorite,
  deleteMember,
  addMemberNote,
  fetchAllMembersInternal
};
