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

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

let serviceAccount;

// 1. Intentar cargar desde variable de entorno con JSON completo
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : process.env.FIREBASE_SERVICE_ACCOUNT;
  } catch (err) {
    console.error('❌ Error al parsear FIREBASE_SERVICE_ACCOUNT:', err.message);
  }
}

// 2. Intentar cargar desde Secret Files de Render (/etc/secrets/serviceAccountKey.json)
if (!serviceAccount) {
  const renderSecretPath = '/etc/secrets/serviceAccountKey.json';
  if (fs.existsSync(renderSecretPath)) {
    try {
      const fileContent = fs.readFileSync(renderSecretPath, 'utf8');
      serviceAccount = JSON.parse(fileContent);
      console.log('🔑 Credenciales cargadas exitosamente desde Render Secret File (/etc/secrets/serviceAccountKey.json)');
    } catch (err) {
      console.error('❌ Error al leer el Secret File de Render:', err.message);
    }
  }
}

// 3. Intentar cargar desde variables individuales
if (!serviceAccount && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
}

// 4. Fallback a archivo local (desarrollo local en src/config/serviceAccountKey.json)
if (!serviceAccount) {
  try {
    serviceAccount = require('./serviceAccountKey.json');
  } catch (err) {
    console.error('❌ Error: No se encontró serviceAccountKey.json en local ni en Render Secret Files (/etc/secrets/) ni en variables de entorno.');
  }
}

if (!admin.apps.length && serviceAccount) {
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  const projectId = serviceAccount.project_id || serviceAccount.projectId;
  console.log('🔥 Firebase Admin SDK inicializado correctamente para project_id:', projectId);
}

const db = admin.firestore();

module.exports = { admin, db };
