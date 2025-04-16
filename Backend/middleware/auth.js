const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware per verificare il token JWT
 * Può essere usato su qualsiasi route che richiede autenticazione
 */
function authMiddleware(req, res, next) {
  // Controlla l'header Authorization
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Accesso negato. Token non fornito o formato non valido.'
    });
  }
  
  // Estrai il token
  const token = authHeader.split(' ')[1];
  
  try {
    // Verifica il token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Aggiungi i dati dell'utente alla richiesta
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Errore verifica token:', error);
    return res.status(401).json({
      success: false,
      message: 'Token non valido o scaduto'
    });
  }
}

/**
 * Middleware per verificare i ruoli
 * Può essere usato per limitare l'accesso in base al ruolo
 * @param {string[]} roles - Array di ruoli autorizzati
 */
function roleMiddleware(roles) {
  return (req, res, next) => {
    // Prima verifica se l'utente è autenticato
    authMiddleware(req, res, () => {
      // Verifica se il ruolo dell'utente è tra quelli autorizzati
      if (roles.includes(req.user.role)) {
        next();
      } else {
        res.status(403).json({
          success: false,
          message: 'Non hai i permessi necessari per accedere a questa risorsa'
        });
      }
    });
  };
}

module.exports = {
  authMiddleware,
  roleMiddleware
}; 