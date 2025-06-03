const sinon = require('sinon');
const jwt = require('jsonwebtoken');

// Mock per le funzioni di autenticazione
const authMock = {
  verifyToken: sinon.stub(),
  checkRole: (role) => sinon.stub(),
  registerUser: sinon.stub(),
  loginUser: sinon.stub()
};

// Funzione per simulare verifyToken con successo
function mockAuthenticatedUser(req, user = { id: 1, email: 'test@test.com', role: 'client' }) {
  req.user = user;
  authMock.verifyToken = (req, res, next) => {
    req.user = user;
    next();
  };
}

// Funzione per simulare fallimento dell'autenticazione
function mockUnauthenticatedUser(req) {
  req.user = null;
  authMock.verifyToken = (req, res, next) => {
    return res.status(401).json({ success: false, message: 'Token non valido o scaduto' });
  };
}

// Funzione per creare un token di test
function generateTestToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    'test_secret',
    { expiresIn: '1h' }
  );
}

module.exports = {
  auth: authMock,
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
  generateTestToken
}; 