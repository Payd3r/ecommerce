const express = require('express');
const router = express.Router();
const db = require('../../db');

// GET /address/me - Ottieni indirizzo dell'utente loggato
router.get('/me', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM delivery_info WHERE user_id = ?', [req.user.id]);
    const address = result[0][0] || null;
    res.json({ success: true, data: address });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Errore nel recupero indirizzo' });
  }
});

// POST /address - Crea o aggiorna indirizzo dell'utente loggato
router.post('/', async (req, res) => {
  try {
    const { stato, citta, provincia, via, cap, numero_civico, name, surname } = req.body;
    
    if (![stato, citta, provincia, via, cap, numero_civico, name, surname].every(Boolean)) {
      return res.status(400).json({ success: false, message: 'Tutti i campi sono obbligatori' });
    }
    
    const result = await db.query('SELECT * FROM delivery_info WHERE user_id = ?', [req.user.id]);
    const existing = result[0][0];
    
    if (existing) {
      await db.query(
        'UPDATE delivery_info SET stato=?, citta=?, provincia=?, via=?, cap=?, numero_civico=?, name=?, surname=? WHERE user_id=?',
        [stato, citta, provincia, via, cap, numero_civico, name, surname, req.user.id]
      );
      res.json({ 
        success: true, 
        data: { ...existing, stato, citta, provincia, via, cap, numero_civico, name, surname } 
      });
    } else {
      await db.query(
        'INSERT INTO delivery_info (user_id, stato, citta, provincia, via, cap, numero_civico, name, surname) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, stato, citta, provincia, via, cap, numero_civico, name, surname]
      );
      res.json({ 
        success: true, 
        data: { user_id: req.user.id, stato, citta, provincia, via, cap, numero_civico, name, surname } 
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Errore nel salvataggio indirizzo' });
  }
});

// GET /address/user/:userId - Solo per admin o artigiano
router.get('/user/:userId', async (req, res) => {
  try {
    if (!['admin', 'artisan'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Non autorizzato' });
    }
    
    const result = await db.query('SELECT * FROM delivery_info WHERE user_id = ?', [req.params.userId]);
    const address = result[0][0] || null;
    res.json({ success: true, data: address });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Errore nel recupero indirizzo' });
  }
});

module.exports = router; 