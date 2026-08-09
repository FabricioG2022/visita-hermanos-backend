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

    const parseSpanishDate = (dateStr) => {
      if (!dateStr || typeof dateStr !== 'string') return 0;
      const lower = dateStr.toLowerCase().trim();
      if (lower.includes('sin visitas') || lower === 'n/a') return 0;
      const parts = lower.includes('/') ? lower.split('/') : lower.split('-');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        if (year && year.length === 4) {
          const d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
          return d.getTime() || 0;
        }
      }
      return new Date(dateStr).getTime() || 0;
    };

    const recentVisits = members
      .filter(m => m.lastVisit && m.lastVisit !== 'N/A' && m.lastVisit !== 'Sin visitas aún' && m.lastVisit !== 'Sin visitas')
      .map(m => ({
        id:         m.id,
        name:       m.name || m.nombre || '',
        date:       m.lastVisit,
        status:     m.status || m.estadoAnimico || 'Verde',
        fotoUrl:    m.fotoUrl || ''
      }))
      .sort((a, b) => parseSpanishDate(b.date) - parseSpanishDate(a.date))
      .slice(0, 10);

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
