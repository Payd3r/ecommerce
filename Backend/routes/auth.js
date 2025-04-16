// routes/auth.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../services/auth_functions');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const db = require('../models/db'); // Importo il pool di connessione

// Route di test
router.get('/test', (req, res) => {
  res.send('Auth route OK');
});

/**
 * @route   GET /auth/test-db
 * @desc    Testa la connessione al database
 * @access  Public
 */
router.get('/test-db', async (req, res) => {
  try {
    // Tenta di eseguire una query semplice
    const [result] = await db.query('SELECT 1 as test');
    
    res.status(200).json({
      success: true,
      message: 'Connessione al database riuscita!',
      data: result
    });
  } catch (error) {
    console.error('Errore connessione DB:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella connessione al database',
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * @route   POST /auth/register
 * @desc    Registrazione nuovo utente
 * @access  Public
 */
router.post('/register', async (req, res) => {
  console.log("entro");
  console.log('req.body', req.body);
  try {
    const userData = {
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
      role: req.body.role || 'client' // Default a client se non specificato
    };
    
    const newUser = await registerUser(userData);
    
    res.status(201).json({
      success: true,
      message: 'Utente registrato con successo',
      data: newUser
    });
  } catch (error) {
    if (error.message.includes('Email già registrata')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    console.error('Errore registrazione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la registrazione',
      error: error.message
    });
  }
});

/**
 * @route   POST /auth/login
 * @desc    Login utente
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const loginResult = await loginUser(email, password);
    res.status(200).json({
      success: true,
      message: 'Login effettuato con successo',
      data: loginResult
    });
  } catch (error) {
    console.error('Errore login:', error);
    
    if (error.message.includes('Credenziali non valide')) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Errore durante il login',
      error: error.message
    });
  }
});

/**
 * @route   GET /auth/profile
 * @desc    Ottieni profilo utente
 * @access  Private (solo utenti autenticati)
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // Recupera i dettagli completi dell'utente dal database
    const [user] = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profilo utente recuperato con successo',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Errore nel recupero del profilo:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero del profilo',
      error: error.message
    });
  }
});

/**
 * @route   GET /auth/admin
 * @desc    Route protetta solo per admin
 * @access  Private (solo admin)
 */
router.get('/admin', roleMiddleware(['admin']), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Area amministrativa',
    data: {
      message: 'Hai accesso all\'area amministrativa'
    }
  });
});

module.exports = router;
