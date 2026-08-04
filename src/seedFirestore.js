const { db } = require('./config/firebase');
const { members: initialMembers, appointments: initialAppointments, visits: initialVisits } = require('./data/mockData');

async function seedData() {
  console.log("🌱 Guardando miembros iniciales en Firestore...");
  for (const m of initialMembers) {
    await db.collection('members').doc(m.id).set(m);
    console.log(` + Miembro guardado en Firestore: ${m.name}`);
  }

  for (const a of initialAppointments) {
    await db.collection('appointments').doc(a.id).set(a);
  }

  for (const v of initialVisits) {
    await db.collection('visits').doc(v.id).set(v);
  }

  console.log("✅ ¡Datos sembrados exitosamente en Firestore!");
  process.exit(0);
}

seedData();
