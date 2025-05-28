// routes/auth.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../services/auth_functions');
const { verifyToken } = require('../middleware/auth');
const db = require('../models/db'); // Importo il pool di connessione
const jwt = require('jsonwebtoken');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { toPublicImageUrl } = require('../services/imageUrl');

// Multer per banner (usa memoria come per le altre immagini)
const bannerUpload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrazione nuovo utente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 description: Ruolo utente (client o artisan)
 *     responses:
 *       201:
 *         description: Utente registrato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Email già registrata o dati non validi
 */
router.post('/register', async (req, res) => {
  try {
    const userData = {
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
      role: req.body.role || 'client' // Default a client se non specificato
    };
    
    const newUser = await registerUser(userData);
    
    // Recupera la foto profilo (se esiste)
    const [profileImg] = await db.query(
      'SELECT url FROM profile_image WHERE user_id = ? LIMIT 1',
      [newUser.id]
    );
    const image = profileImg.length > 0 ? toPublicImageUrl(profileImg[0].url) : null;
    
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
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login utente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login effettuato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Credenziali non valide
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
    const image = profileImg.length > 0 ? toPublicImageUrl(profileImg[0].url) : null;
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
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Ottieni profilo utente
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profilo utente recuperato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Utente non trovato
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
    const profile_image_url = profileImg.length > 0 ? toPublicImageUrl(profileImg[0].url) : null;

    // Se l'utente è un artigiano, recupera anche i dati extended_users
    let extended_users = null;
    if (user.role === 'artisan') {
      const [ext] = await db.query(
        'SELECT * FROM extended_users WHERE id_users = ? LIMIT 1',
        [user.id]
      );
      if (ext.length > 0) {
        extended_users = ext[0];
      }
    }

    if (extended_users && extended_users.url_banner) {
      extended_users.url_banner = toPublicImageUrl(extended_users.url_banner);
    }

    res.status(200).json({
      success: true,
      message: 'Profilo utente recuperato con successo',
      data: {
        id: user.id,
        nickname: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        image: profile_image_url,
        ...(extended_users ? { extended_users } : {})
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
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Aggiorna profilo utente (solo nome o email)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profilo aggiornato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Nessun campo da aggiornare
 */
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { nickname, email } = req.body;
    if (!nickname && !email) {
      return res.status(400).json({ success: false, message: 'Nessun campo da aggiornare' });
    }
    const updates = [];
    const params = [];
    if (nickname) {
      updates.push('name = ?');
      params.push(nickname);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Nessun campo valido da aggiornare' });
    }
    params.push(req.user.id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Profilo aggiornato con successo', data: { nickname, email } });
  } catch (error) {
    console.error('Errore durante l\'aggiornamento del profilo:', error);
    res.status(500).json({ success: false, message: 'Errore durante l\'aggiornamento del profilo', error: error.message });
  }
});

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
    const { bio } = req.body;
    if (!bio) return res.status(400).json({ error: 'Bio obbligatoria' });
    await db.query('UPDATE extended_users SET bio = ? WHERE id_users = ?', [bio, req.user.id]);
    res.json({ success: true, message: 'Bio aggiornata' });
  } catch (error) {
    console.error('Errore aggiornamento bio:', error);
    res.status(500).json({ error: 'Errore aggiornamento bio' });
  }
});

module.exports = router;
