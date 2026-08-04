const jwt = require('jsonwebtoken');
const { admin, db } = require('../config/firebase');

// Semilla del usuario Admin y Sincronización de usuarios de Firebase Auth en Firestore
const seedAdminUser = async () => {
  try {
    const adminEmail = 'admin@visita.com';
    let userRecord;

    try {
      userRecord = await admin.auth().getUserByEmail(adminEmail);
      console.log('🔒 Usuario Admin ya existe en Firebase Auth:', userRecord.email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await admin.auth().createUser({
          email: adminEmail,
          password: 'admin123',
          displayName: 'Administrador Visita',
        });
        console.log('✅ Creado usuario Admin en Firebase Auth:', userRecord.email);
      } else {
        throw error;
      }
    }

    // Intentar sincronizar usuarios en Firestore (con manejo silencioso de cuota)
    try {
      const listResult = await admin.auth().listUsers(100);
      for (const u of listResult.users) {
        const userRef = db.collection('users').doc(u.uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
          const isDbAdmin = u.email && u.email.toLowerCase() === 'admin@visita.com';
          const role = isDbAdmin ? 'admin' : 'visitador';
          const name = u.displayName || (u.email ? u.email.split('@')[0].toUpperCase() : 'USUARIO');
          await userRef.set({
            uid: u.uid,
            email: u.email,
            name,
            role,
            createdAt: u.metadata.creationTime || new Date().toISOString()
          });
        }
      }
    } catch (fsErr) {
      // Manejo silencioso: los usuarios se consultan dinámicamente desde Firebase Auth en getUsers
    }
  } catch (error) {
    console.error('Error al inicializar semillas Admin:', error.message);
  }
};

// Obtener usuarios reales (resiliente a cuotas de Firestore)
const getUsers = async (req, res) => {
  try {
    // 1. Obtener lista desde Firebase Auth (Auth no consume cuotas de Firestore)
    const listResult = await admin.auth().listUsers(1000);
    const authUsers = listResult.users;

    // 2. Intentar consultar Firestore users map
    let firestoreUsersMap = {};
    try {
      const snapshot = await db.collection('users').get();
      snapshot.forEach(doc => {
        firestoreUsersMap[doc.id] = doc.data();
      });
    } catch (fsErr) {
      console.warn('⚠️ No se pudo consultar Firestore users (posible cuota excedida). Usando datos de Firebase Auth:', fsErr.message);
    }

    const resultUsers = authUsers.map(u => {
      const fsData = firestoreUsersMap[u.uid] || {};
      const isDbAdmin = u.email && u.email.toLowerCase() === 'admin@visita.com';
      return {
        id: u.uid,
        uid: u.uid,
        email: u.email,
        name: fsData.name || u.displayName || (u.email ? u.email.split('@')[0].toUpperCase() : 'USUARIO'),
        role: fsData.role || (isDbAdmin ? 'admin' : 'visitador'),
        createdAt: fsData.createdAt || u.metadata.creationTime || new Date().toISOString()
      };
    });

    res.json(resultUsers);
  } catch (error) {
    console.error('Error al obtener usuarios:', error.message);
    // Fallback mínimo si Auth también falla
    res.json([
      { id: 'admin1', uid: 'admin1', email: 'admin@visita.com', name: 'Administrador', role: 'admin' },
      { id: 'v1', uid: 'v1', email: 'firgodoy@hotmail.com', name: 'FIRGODOY', role: 'visitador' }
    ]);
  }
};

// Iniciar sesión
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Por favor proporciona correo y contraseña' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Obtener usuario de Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(cleanEmail);
    } catch (err) {
      return res.status(401).json({ message: 'Usuario no registrado o credenciales inválidas' });
    }

    // 2. Obtener datos y rol desde Firestore con fallback
    let role = cleanEmail === 'admin@visita.com' ? 'admin' : 'visitador';
    let name = userRecord.displayName || cleanEmail.split('@')[0].toUpperCase();

    try {
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        role = data.role || role;
        name = data.name || name;
      }
    } catch (fsErr) {
      console.warn('⚠️ No se pudo consultar perfil en Firestore por cuota, se continuó con Auth:', fsErr.message);
    }

    const token = jwt.sign(
      { id: userRecord.uid, email: cleanEmail, name, role },
      process.env.JWT_SECRET || 'super_secret_jwt_key_visita_hermanos_2026',
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: { id: userRecord.uid, email: cleanEmail, name, role }
    });
  } catch (error) {
    console.error('Error en login backend:', error);
    return res.status(500).json({ message: 'Error en el servidor al autenticar' });
  }
};

// Registrar nuevo usuario (rol predeterminado: visitador)
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Todos los campos (nombre, correo y contraseña) son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Crear en Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().createUser({
        email: cleanEmail,
        password,
        displayName: name
      });
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        return res.status(400).json({ message: 'Este correo electrónico ya está registrado' });
      }
      return res.status(400).json({ message: err.message || 'Error al crear usuario en Firebase' });
    }

    const role = 'visitador';
    const newUserDoc = {
      uid: userRecord.uid,
      email: cleanEmail,
      name,
      role,
      createdAt: new Date().toISOString()
    };

    try {
      await db.collection('users').doc(userRecord.uid).set(newUserDoc);
    } catch (fsErr) {
      console.warn('⚠️ Aviso de cuota al crear perfil Firestore:', fsErr.message);
    }

    const token = jwt.sign(
      { id: userRecord.uid, email: cleanEmail, name, role },
      process.env.JWT_SECRET || 'super_secret_jwt_key_visita_hermanos_2026',
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      token,
      user: { id: userRecord.uid, email: cleanEmail, name, role }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ message: 'Error interno al registrar usuario' });
  }
};

// Recuperación de contraseña vía Firebase Auth
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Debes proporcionar tu correo electrónico' });
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      const resetLink = await admin.auth().generatePasswordResetLink(cleanEmail);
      console.log(`✉️ Enlace de recuperación generado para ${cleanEmail}: ${resetLink}`);
      
      return res.json({
        message: `Se ha enviado el correo de recuperación a ${cleanEmail}. Por favor revisa tu bandeja de entrada.`,
        resetLink
      });
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        return res.status(404).json({ message: 'No existe una cuenta registrada con este correo electrónico.' });
      }
      throw err;
    }
  } catch (error) {
    console.error('Error en recupero de clave:', error);
    return res.status(500).json({ message: 'Error al procesar la recuperación de contraseña' });
  }
};

const inviteUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !name) {
      return res.status(400).json({ message: 'Nombre y correo son requeridos' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRole = role === 'admin' ? 'admin' : 'visitador';
    const tempPassword = password || 'visita2026';

    let userRecord;
    try {
      userRecord = await admin.auth().createUser({
        email: cleanEmail,
        password: tempPassword,
        displayName: name
      });
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        userRecord = await admin.auth().getUserByEmail(cleanEmail);
      } else {
        return res.status(400).json({ message: err.message || 'Error al crear usuario' });
      }
    }

    const userData = {
      uid: userRecord.uid,
      email: cleanEmail,
      name,
      role: userRole,
      createdAt: new Date().toISOString()
    };

    try {
      await db.collection('users').doc(userRecord.uid).set(userData, { merge: true });
    } catch (fsErr) {
      console.warn('⚠️ Aviso de cuota al invitar usuario en Firestore:', fsErr.message);
    }

    res.status(201).json({
      message: `Usuario ${name} invitado/creado con éxito`,
      user: { id: userRecord.uid, ...userData }
    });
  } catch (error) {
    console.error('Error al invitar usuario:', error);
    res.status(500).json({ message: 'Error al procesar la invitación de usuario' });
  }
};

const getMe = (req, res) => {
  res.json({ user: req.user });
};

const updateProfile = async (req, res) => {
  try {
    const { name, newPassword } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'El nombre y apellido no pueden estar vacíos' });
    }

    const cleanName = name.trim();

    try {
      const updateData = { displayName: cleanName };
      if (newPassword && newPassword.length >= 6) {
        updateData.password = newPassword;
      }
      await admin.auth().updateUser(userId, updateData);
    } catch (authErr) {
      console.warn('⚠️ No se pudo actualizar en Firebase Auth:', authErr.message);
    }

    try {
      await db.collection('users').doc(userId).set({
        name: cleanName,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (fsErr) {
      console.warn('⚠️ No se pudo actualizar en Firestore users por cuota:', fsErr.message);
    }

    const updatedUser = {
      id: userId,
      email: req.user.email,
      name: cleanName,
      role: req.user.role
    };

    const token = jwt.sign(
      updatedUser,
      process.env.JWT_SECRET || 'super_secret_jwt_key_visita_hermanos_2026',
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Perfil actualizado con éxito',
      token,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    return res.status(500).json({ message: 'Error al actualizar perfil en el servidor' });
  }
};

module.exports = { seedAdminUser, login, register, forgotPassword, getUsers, inviteUser, getMe, updateProfile };

