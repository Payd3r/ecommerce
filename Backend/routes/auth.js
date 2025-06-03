// routes/auth.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../services/auth_functions');
const { verifyToken } = require('../middleware/auth');
const db = require('../models/db'); // Importo il pool di connessione
const jwt = require('jsonwebtoken');

/**
 * @route   POST /auth/register
 * @desc    Registrazione nuovo utente
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const userData = {
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
      role: req.body.role || 'client'
    };
    
    // Validazione del ruolo
    if (userData.role && !['client', 'artisan', 'admin'].includes(userData.role)) {
      return res.status(400).json({
        success: false,
        message: 'Ruolo non valido'
      });
    }
    
    const newUser = await registerUser(userData);
    
    // Recupera la foto profilo (se esiste)
    const [profileImg] = await db.query(
      'SELECT url FROM profile_image WHERE user_id = ? LIMIT 1',
      [newUser.id]
    );
    const image = profileImg.length > 0 ? profileImg[0].url : null;
    
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Utente registrato con successo',
      data: {
        token,
        user: { ...newUser, image }
      }
    });
  } catch (error) {
    if (error.message.includes('Email gia registrata')) {
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
    // Recupera la foto profilo (se esiste)
    const [profileImg] = await db.query(
      'SELECT url FROM profile_image WHERE user_id = ? LIMIT 1',
      [loginResult.user.id]
    );
    const image = profileImg.length > 0 ? profileImg[0].url : null;
    res.status(200).json({
      success: true,
      message: 'Login effettuato con successo',
      data: {
        token: loginResult.token,
        user: { ...loginResult.user, image }
      }
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
router.get('/profile', verifyToken, async (req, res) => {
  try {
    // Recupera i dettagli completi dell'utente dal database
    const [users] = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    const user = users[0];

    // Recupera la foto profilo (se esiste)
    const [profileImg] = await db.query(
      'SELECT url FROM profile_image WHERE user_id = ? LIMIT 1',
      [user.id]
    );
    const profile_image_url = profileImg.length > 0 ? profileImg[0].url : null;

    res.status(200).json({
      success: true,
      message: 'Profilo utente recuperato con successo',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        image: profile_image_url
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
 * @route   PUT /auth/profile
 * @desc    Aggiorna profilo utente (solo nome)
 * @access  Private (solo utenti autenticati)
 */
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Il nome è obbligatorio' });
    }
    await db.query('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
    res.json({ success: true, message: 'Profilo aggiornato con successo', data: { name } });
  } catch (error) {
    console.error('Errore durante l\'aggiornamento del profilo:', error);
    res.status(500).json({ success: false, message: 'Errore durante l\'aggiornamento del profilo', error: error.message });
  }
});

<<<<<<< Updated upstream
=======
/**
 * @swagger
 * /auth/artisan/bio:
 *   put:
 *     summary: Aggiorna la bio dell'artigiano
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bio
 *             properties:
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bio aggiornata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bio obbligatoria
 */
// PUT /auth/artisan/bio
router.put('/artisan/bio', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'artisan') {
      return res.status(403).json({ 
        success: false,
        error: 'Solo gli artigiani possono aggiornare la bio' 
      });
    }
    const { bio } = req.body;
    if (!bio) {
      return res.status(400).json({ 
        success: false,
        error: 'Bio obbligatoria' 
      });
    }
    await db.query('UPDATE extended_users SET bio = ? WHERE id_users = ?', [bio, req.user.id]);
    res.json({ success: true, message: 'Bio aggiornata' });
  } catch (error) {
    console.error('Errore aggiornamento bio:', error);
    res.status(500).json({ 
      success: false,
      error: 'Errore aggiornamento bio' 
    });
  }
});

>>>>>>> Stashed changes
module.exports = router;
