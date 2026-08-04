const cacheService = require('../services/cacheService');
const { fetchAllMembersInternal } = require('./memberController');

const CACHE_KEY_DASHBOARD = 'dashboard_stats';

const getDashboardStats = async (req, res) => {
  try {
    // 1. Si existe caché de dashboard, responder de inmediato (0ms)
    const cachedStats = cacheService.get(CACHE_KEY_DASHBOARD);
    if (cachedStats) {
      return res.json(cachedStats);
    }

    // 2. Obtener miembros (desde la caché de miembros en memoria o 1 sola lectura a Firestore)
    const members = await fetchAllMembersInternal();

    const totalMembers = members.length;

    let totalVisits = 0;
    members.forEach(m => {
      const historial = m.historialVisitas || [];
      totalVisits += historial.length;
    });

    const estadoCount = { Verde: 0, Amarillo: 0, Rojo: 0 };
    members.forEach(m => {
      const estado = m.status || m.estadoAnimico || 'Verde';
      if (estadoCount[estado] !== undefined) {
        estadoCount[estado]++;
      }
    });

    const favorites = members.filter(m => Boolean(m.isFavorite)).length;

    const recentVisits = members
      .filter(m => m.lastVisit && m.lastVisit !== 'N/A' && m.lastVisit !== 'Sin visitas aún')
      .slice(0, 5)
      .map(m => ({
        id:         m.id,
        name:       m.name || m.nombre || '',
        date:       m.lastVisit,
        status:     m.status || m.estadoAnimico || 'Verde',
        fotoUrl:    m.fotoUrl || ''
      }));

    const result = {
      totalMembers,
      totalVisits,
      favorites,
      necesitanAtencion: estadoCount.Rojo || 0,
      estadoCount,
      recentVisits
    };

    cacheService.set(CACHE_KEY_DASHBOARD, result);
    res.json(result);
  } catch (error) {
    console.error('Error en getDashboardStats:', error.message);
    res.status(503).json({ message: 'Límite de cuota diaria de Firebase alcanzado temporalmente' });
  }
};

module.exports = { getDashboardStats };
