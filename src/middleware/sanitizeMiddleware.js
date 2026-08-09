// Middleware para la prevención de Inyección NoSQL y Sanitización XSS

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  // Escapar caracteres peligrosos para prevención de XSS al renderizar
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

// Sanitizar recursivamente campos en req.body
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        const val = req.body[key];
        // Si el valor es una cadena, sanitizarlo
        if (typeof val === 'string') {
          req.body[key] = sanitizeString(val);
        }
      }
    }
  }
  next();
};

// Validar que los campos especificados sean estrictamente strings (previene objetos NoSQL maliciosos)
const validateStringTypes = (...fields) => {
  return (req, res, next) => {
    if (!req.body) return next();
    
    for (const field of fields) {
      const val = req.body[field];
      if (val !== undefined && val !== null) {
        if (typeof val !== 'string') {
          return res.status(400).json({ 
            message: `El campo '${field}' debe ser una cadena de texto válida. Se rechazó el tipo de dato recibido.` 
          });
        }
      }
    }
    next();
  };
};

module.exports = { sanitizeBody, validateStringTypes };
