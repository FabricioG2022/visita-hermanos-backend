const { db } = require('./config/firebase');
const fs = require('fs');
const path = require('path');

async function inspectFirestore() {
  const snapshot = await db.collection('miembros').get();
  const results = [];
  snapshot.forEach(doc => {
    results.push({ id: doc.id, ...doc.data() });
  });
  const output = JSON.stringify(results, null, 2);
  fs.writeFileSync(path.join(__dirname, '../miembros_dump.json'), output);
  console.log(`✅ Guardado miembros_dump.json con ${results.length} documentos`);
  process.exit(0);
}
inspectFirestore().catch(err => { console.error(err.message); process.exit(1); });
