// Script para limpiar los miembros de prueba que fueron sembrados automáticamente
const { db } = require('./config/firebase');

// IDs que fueron creados por el script seedFirestore.js (datos de prueba hardcodeados)
const MOCK_IDS_TO_DELETE = ['1', '2', '3', '4', '5', '6'];

async function cleanMockMembers() {
  console.log("🗑️  Eliminando miembros de prueba de Firestore...");
  for (const id of MOCK_IDS_TO_DELETE) {
    const docRef = db.collection('members').doc(id);
    const doc = await docRef.get();
    if (doc.exists) {
      await docRef.delete();
      console.log(` ✓ Eliminado: ID ${id} (${doc.data().name})`);
    } else {
      console.log(` - ID ${id}: no existe, omitiendo.`);
    }
  }

  // Verificar cuántos miembros quedan (los reales de la app)
  const remaining = await db.collection('members').get();
  console.log(`\n📊 Miembros restantes en Firestore: ${remaining.size}`);
  remaining.forEach(doc => {
    console.log(`  - ${doc.id}: ${doc.data().name || '(sin nombre)'}`);
  });

  console.log("\n✅ Limpieza completada. Ahora Firestore refleja solo tus datos reales.");
  process.exit(0);
}

cleanMockMembers().catch(err => {
  console.error("❌ Error al limpiar:", err.message);
  process.exit(1);
});
