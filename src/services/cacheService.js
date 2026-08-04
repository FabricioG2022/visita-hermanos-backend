// Servicio de Caché Centralizado en Memoria para Backend (Node.js/Express)
// Optimiza lecturas a Firestore y previene el consumo de la cuota diaria.

class CacheService {
  constructor() {
    this.cache = new Map();
    this.DEFAULT_TTL = 15 * 60 * 1000; // 15 minutos de tiempo de vida por defecto
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  set(key, data, ttlMs = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs
    });
  }

  invalidate(key) {
    this.cache.delete(key);
  }

  invalidateKeys(...keys) {
    keys.forEach(k => this.cache.delete(k));
  }

  clear() {
    this.cache.clear();
  }
}

const cacheService = new CacheService();

module.exports = cacheService;
