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

let serviceAccount;

// 1. Intentar cargar desde variable de entorno con JSON completo (útil para Render / Heroku / Vercel)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccount && serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
  } catch (err) {
    console.error('❌ Error al parsear FIREBASE_SERVICE_ACCOUNT:', err.message);
  }
}

// 2. Intentar cargar desde variables individuales
if (!serviceAccount && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
}

// 3. Fallback a archivo local (desarrollo local)
if (!serviceAccount) {
  try {
    serviceAccount = require('./serviceAccountKey.json');
  } catch (err) {
    console.error('❌ Error: No se encontró serviceAccountKey.json ni variables de entorno para Firebase.');
  }
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  const projectId = serviceAccount.project_id || serviceAccount.projectId;
  console.log('🔥 Firebase Admin SDK inicializado correctamente para project_id:', projectId);
}

const db = admin.firestore();

module.exports = { admin, db };
