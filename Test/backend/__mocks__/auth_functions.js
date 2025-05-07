// Mock delle funzioni di autenticazione per i test
const jwt = require('jsonwebtoken');

// Chiave segreta per i test
const SECRET_KEY = 'chiave_segreta_per_test';

// Mock della funzione generateToken
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    SECRET_KEY,
    { expiresIn: '1h' }
  );
}

// Mock della funzione verifyToken
function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    throw new Error('Token non valido');
  }
}

module.exports = { generateToken, verifyToken }; 