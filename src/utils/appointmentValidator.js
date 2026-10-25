/**
 * Utilidad de validación y normalización para Citas Pastorales (Visitas)
 * Proyecto: WebVisitaHermanos
 */

function validateAppointment(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      isValid: false,
      error: 'Los datos de la cita deben ser un objeto válido'
    };
  }

  const {
    memberId,
    memberName,
    date,
    time,
    visitType,
    location,
    responsible,
    observations
  } = payload;

  // Validación de fecha obligatoria
  if (!date || typeof date !== 'string' || date.trim() === '') {
    return {
      isValid: false,
      error: 'La fecha de la cita es obligatoria'
    };
  }

  // Validación de hora obligatoria
  if (!time || typeof time !== 'string' || time.trim() === '') {
    return {
      isValid: false,
      error: 'La hora de la cita es obligatoria'
    };
  }

  // Retorno normalizado con reglas de negocio y valores por defecto
  return {
    isValid: true,
    data: {
      memberId: memberId ? String(memberId).trim() : '1',
      memberName: memberName ? String(memberName).trim() : 'Miembro Seleccionado',
      date: date.trim(),
      time: time.trim(),
      visitType: visitType ? String(visitType).trim() : 'Visita en domicilio',
      location: location ? String(location).trim() : 'Domicilio',
      responsible: responsible ? String(responsible).trim() : 'Coordinador',
      observations: observations ? String(observations).trim() : '',
      status: 'Pendiente'
    }
  };
}

module.exports = {
  validateAppointment
};
