const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Assicurati che sia la tua connessione al DB
const { verifyToken } = require('../middleware/auth');

// GET /address/me - Ottieni indirizzo dell'utente loggato
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const [rows] = await db.query('SELECT * FROM delivery_info WHERE user_id = ?', [user_id]);
    const address = rows[0] || null; // Se non ci sono dati, address sarà null
    res.json({ success: true, data: address });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Errore nel recupero indirizzo' });
  }
});

// POST /address - Crea o aggiorna indirizzo dell'utente loggato
router.post('/', verifyToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { stato, citta, provincia, via, cap, numero_civico, name, surname } = req.body;
    // Validazione semplice
    if (![stato, citta, provincia, via, cap, numero_civico, name, surname].every(Boolean)) {
      return res.status(400).json({ success: false, message: 'Tutti i campi sono obbligatori' });
    }
    const [rows] = await db.query('SELECT * FROM delivery_info WHERE user_id = ?', [user_id]);
    const existing = rows[0]
    if (existing) {
      await db.query(
        'UPDATE delivery_info SET stato=?, citta=?, provincia=?, via=?, cap=?, numero_civico=?, name=?, surname=? WHERE user_id=?',
        [stato, citta, provincia, via, cap, numero_civico, name, surname, user_id]
      );
      const address = { ...existing, stato, citta, provincia, via, cap, numero_civico, name, surname };
      res.json({ success: true, data: address });
    } else {
      await db.query(
        'INSERT INTO delivery_info (user_id, stato, citta, provincia, via, cap, numero_civico, name, surname) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user_id, stato, citta, provincia, via, cap, numero_civico, name, surname]
      );
      const address = { user_id, stato, citta, provincia, via, cap, numero_civico, name, surname };
      res.json({ success: true, data: address });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Errore nel salvataggio indirizzo' });
  }
});

// GET /address/user/:userId - Solo per admin o artigiano
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    // Consenti solo ad admin o artigiani
    if (!['admin', 'artisan'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Non autorizzato' });
    }
    const user_id = req.params.userId;
    const [rows] = await db.query('SELECT * FROM delivery_info WHERE user_id = ?', [user_id]);
    const address = rows[0] || null;
    res.json({ success: true, data: address });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Errore nel recupero indirizzo' });
  }
});

module.exports = router; 