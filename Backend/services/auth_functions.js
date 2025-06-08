const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models/db'); // Utilizzo il pool di connessioni del progetto
require('dotenv').config();

/**
 * Registra un nuovo utente
 */
async function registerUser(userData) {
  const { email, password, name, role } = userData;
  
  // Controlli di validazione
  if (!email || !password || !name || !role) {
    throw new Error('Tutti i campi sono obbligatori');
  }
  
  // Verifica che il ruolo sia valido
  if (!['artisan', 'client', 'admin'].includes(role)) {
    throw new Error('Ruolo non valido');
  }

  try {
    // Verifica se l'email esiste gia
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ?', 
      [email]
    );
    
    if (existingUsers.length > 0) {
      throw new Error('Email gia registrata');
    }
    
    // Hash della password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Inserimento nuovo utente
    const [result] = await db.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [email, passwordHash, name, role]
    );
    
    return {
      id: result.insertId,
      email,
      name,
      role
    };
  } catch (error) {
    if (error.message === 'Email gia registrata') {
      throw error;
    }
    throw new Error(`Errore durante la registrazione: ${error.message}`);
  }
}

/**
 * Effettua il login di un utente
 */
async function loginUser(email, password) {
  if (!email || !password) {
    throw new Error('Email e password sono richieste');
  }
  
  try {
    // Cerca l'utente con l'email specificata
    const [users] = await db.query(
      'SELECT id, email, password_hash, name, role FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      throw new Error('Credenziali non valide');
    }
    
    const user = users[0];
    
    // Verifica della password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      throw new Error('Credenziali non valide');
    }
    
    // Crea token JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    };
  } catch (error) {
    throw new Error(`Errore durante il login: ${error.message}`);
  }
}

module.exports = {
  registerUser,
  loginUser
};
