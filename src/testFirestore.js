const { db } = require('./config/firebase');

async function testConnection() {
  console.log("⏳ Probando conexión y consulta a Firestore...");
  try {
    const start = Date.now();
    const snapshot = await db.collection('members').get();
    console.log(`✅ Conexión exitosa a Firestore en ${Date.now() - start}ms`);
    console.log(`📊 Cantidad de documentos en 'members': ${snapshot.size}`);
    snapshot.forEach(doc => {
      console.log(` - ID: ${doc.id}, Nombre: ${doc.data().name}`);
    });
  } catch (error) {
    console.error("❌ Error al consultar Firestore:", error);
  } finally {
    process.exit(0);
  }
}

testConnection();
