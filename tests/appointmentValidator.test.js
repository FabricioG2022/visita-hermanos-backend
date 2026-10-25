const { validateAppointment } = require('../src/utils/appointmentValidator');

describe('Pruebas Unitarias: Regla de Negocio para Citas Pastorales (VisitaHermanos)', () => {

  // ==========================================
  // CASO 1: CAMINO FELIZ (Happy Path)
  // ==========================================
  describe('Camino Feliz: Datos válidos', () => {
    test('Debe validar exitosamente y normalizar una cita con todos sus campos completos', () => {
      // 1. Preparación de datos (Arrange)
      const inputCita = {
        memberId: 'm_45',
        memberName: 'Hermano Carlos Gómez',
        date: '2026-10-25',
        time: '18:30',
        visitType: 'Oración por salud',
        location: 'Hospital Central',
        responsible: 'Pastor Roberto',
        observations: 'Paciente en sala de recuperación'
      };

      // 2. Ejecución (Act)
      const resultado = validateAppointment(inputCita);

      // 3. Aserciones (Assert)
      expect(resultado.isValid).toBe(true);
      expect(resultado.data).toBeDefined();
      expect(resultado.data.memberId).toBe('m_45');
      expect(resultado.data.memberName).toBe('Hermano Carlos Gómez');
      expect(resultado.data.date).toBe('2026-10-25');
      expect(resultado.data.time).toBe('18:30');
      expect(resultado.data.status).toBe('Pendiente'); // Regla de negocio: estado inicial
      expect(resultado.data.location).toBe('Hospital Central');
    });

    test('Debe asignar valores por defecto coherentes cuando solo se envían los campos requeridos', () => {
      const inputMinimo = {
        date: '2026-11-02',
        time: '16:00'
      };

      const resultado = validateAppointment(inputMinimo);

      expect(resultado.isValid).toBe(true);
      expect(resultado.data.status).toBe('Pendiente');
      expect(resultado.data.visitType).toBe('Visita en domicilio');
      expect(resultado.data.location).toBe('Domicilio');
      expect(resultado.data.responsible).toBe('Coordinador');
    });
  });

  // ==========================================
  // CASO 2: CASOS DE BORDE Y ERROR (Edge & Error Cases)
  // ==========================================
  describe('Casos de Borde y Error: Datos inválidos o faltantes', () => {
    test('Debe fallar si no se proporciona la fecha o se envía una cadena vacía', () => {
      const inputSinFecha = {
        memberId: 'm_45',
        time: '18:30'
        // date no enviada
      };

      const resultado = validateAppointment(inputSinFecha);

      expect(resultado.isValid).toBe(false);
      expect(resultado.error).toBe('La fecha de la cita es obligatoria');
      expect(resultado.data).toBeUndefined();
    });

    test('Debe fallar si la hora solo contiene espacios en blanco', () => {
      const inputHoraEspacios = {
        date: '2026-10-25',
        time: '     '
      };

      const resultado = validateAppointment(inputHoraEspacios);

      expect(resultado.isValid).toBe(false);
      expect(resultado.error).toBe('La hora de la cita es obligatoria');
    });

    test('Debe responder de forma segura y controlada si el payload es null, undefined o no es un objeto', () => {
      expect(validateAppointment(null).isValid).toBe(false);
      expect(validateAppointment(undefined).isValid).toBe(false);
      expect(validateAppointment('cadena_invalida').isValid).toBe(false);
      expect(validateAppointment([]).isValid).toBe(false);
    });
  });

});
