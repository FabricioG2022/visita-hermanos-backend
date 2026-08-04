// Polyfill global Headers, fetch, Request y Response para Node v16
if (!global.Headers) {
  try {
    const fetch = require('node-fetch');
    global.Headers = fetch.Headers;
    global.fetch = fetch;
    global.Request = fetch.Request;
    global.Response = fetch.Response;
  } catch (e) {
    console.warn('node-fetch polyfill warning:', e.message);
  }
}

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('🔥 Firebase Admin SDK inicializado correctamente para project_id:', serviceAccount.project_id);
}

const db = admin.firestore();

module.exports = { admin, db };
