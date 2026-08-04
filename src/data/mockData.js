let members = [
  {
    id: "1",
    name: "Juan Pérez",
    phone: "1123456789",
    email: "juanperez@gmail.com",
    address: "Calle 123, La Plata",
    birthDate: "15/05/1985",
    memberSince: "01/01/2022",
    lastVisit: "12/06/2026",
    status: "Activo",
    isFavorite: true,
    notes: "Le gusta recibir visitas los fines de semana."
  },
  {
    id: "2",
    name: "María López",
    phone: "1198765432",
    email: "marialopez@gmail.com",
    address: "Av. 7 Nº 456, La Plata",
    birthDate: "20/08/1990",
    memberSince: "15/03/2023",
    lastVisit: "10/06/2026",
    status: "Activo",
    isFavorite: true,
    notes: "Prefiere contacto telefónico previo."
  },
  {
    id: "3",
    name: "Carlos Gómez",
    phone: "1145678901",
    email: "carlosgomez@gmail.com",
    address: "Calle 50 Nº 789, Berisso",
    birthDate: "10/12/1978",
    memberSince: "10/10/2021",
    lastVisit: "05/06/2026",
    status: "Activo",
    isFavorite: false,
    notes: "Visitas por la tarde únicamente."
  },
  {
    id: "4",
    name: "Ana Fernández",
    phone: "1134567890",
    email: "afernandez@gmail.com",
    address: "Calle 60 Nº 12, La Plata",
    birthDate: "04/04/1982",
    memberSince: "05/05/2022",
    lastVisit: "01/06/2026",
    status: "Activo",
    isFavorite: false,
    notes: "Citas en el centro congregacional."
  },
  {
    id: "5",
    name: "Pedro Martínez",
    phone: "1122334455",
    email: "pmartinez@gmail.com",
    address: "Diagonal 74 Nº 300, La Plata",
    birthDate: "30/01/1965",
    memberSince: "12/08/2020",
    lastVisit: "28/05/2026",
    status: "Inactivo",
    isFavorite: false,
    notes: "Revisar disponibilidad por salud."
  },
  {
    id: "6",
    name: "Roberto Díaz",
    phone: "1133445566",
    email: "robertodiaz@gmail.com",
    address: "Calle 12 Nº 890, Ensenada",
    birthDate: "18/07/1995",
    memberSince: "01/02/2024",
    lastVisit: "20/05/2026",
    status: "Activo",
    isFavorite: false,
    notes: "Nuevo miembro asignado."
  }
];

let appointments = [
  {
    id: "a1",
    memberId: "1",
    memberName: "Juan Pérez",
    date: "15/06/2026",
    time: "18:00",
    visitType: "Visita en domicilio",
    location: "Domicilio",
    responsible: "Leo Lautaron",
    observations: "Llevar la guía de estudio.",
    status: "Pendiente"
  },
  {
    id: "a2",
    memberId: "2",
    memberName: "María López",
    date: "17/06/2026",
    time: "17:00",
    visitType: "Visita en domicilio",
    location: "Domicilio",
    responsible: "Ana Fernández",
    observations: "Reunión de seguimiento mensual.",
    status: "Pendiente"
  },
  {
    id: "a3",
    memberId: "3",
    memberName: "Carlos Gómez",
    date: "19/06/2026",
    time: "10:00",
    visitType: "Visita en centro",
    location: "Centro",
    responsible: "Leo Lautaron",
    observations: "Coordinación de voluntariado.",
    status: "Pendiente"
  }
];

let visits = [
  {
    id: "v1",
    memberId: "1",
    memberName: "Juan Pérez",
    date: "12/06/2026",
    time: "16:30",
    responsible: "Leo Lautaron",
    summary: "Se conversó sobre la planificación de actividades familiares.",
    status: "Realizada"
  },
  {
    id: "v2",
    memberId: "2",
    memberName: "María López",
    date: "10/06/2026",
    time: "15:00",
    responsible: "Ana Fernández",
    summary: "Visita de acompañamiento completada con éxito.",
    status: "Realizada"
  },
  {
    id: "v3",
    memberId: "3",
    memberName: "Carlos Gómez",
    date: "05/06/2026",
    time: "18:00",
    responsible: "Pedro Martínez",
    summary: "Reunión breve de consulta.",
    status: "Realizada"
  }
];

let users = [
  {
    id: "u1",
    email: "admin@visita.com",
    passwordHash: "$2a$10$w8T0C1V1R2yS8z9f6y10u.e6C8R2Y3W4X5Z6A7B8C9D0E1F2G3H4I", // hashed password 'admin123'
    name: "Coordinador General",
    role: "admin"
  },
  {
    id: "u2",
    email: "voluntario@visita.com",
    passwordHash: "$2a$10$w8T0C1V1R2yS8z9f6y10u.e6C8R2Y3W4X5Z6A7B8C9D0E1F2G3H4I",
    name: "Leo Lautaron",
    role: "voluntario"
  }
];

module.exports = { members, appointments, visits, users };
