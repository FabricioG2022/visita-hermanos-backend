const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Acceso denegado: No se proporcionó Token de seguridad' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_visita_hermanos_2026');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'No tienes permisos suficientes para realizar esta acción' });
    }
    const userRole = (req.user.role || '').toLowerCase();
    const userEmail = (req.user.email || '').toLowerCase();
    
    if (
      userRole === 'superadmin' || 
      userRole === 'super_admin' || 
      userEmail === 'fabrigo2015@gmail.com' || 
      roles.includes(req.user.role)
    ) {
      return next();
    }
    
    return res.status(403).json({ message: 'No tienes permisos suficientes para realizar esta acción' });
  };
};

module.exports = { verifyToken, requireRole };
