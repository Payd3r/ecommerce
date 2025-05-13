const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET /api/issues - restituisce le segnalazioni con paginazione
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    // Query per il totale
    const [countRows] = await db.query(
      `SELECT COUNT(*) as total FROM issues`
    );
    const total = countRows[0].total;
    // Query per la pagina
    const [rows] = await db.query(
      `SELECT i.id_issue, i.title, u.name as client_name, i.description, i.status, i.created_at, i.admin_note, i.id_client
       FROM issues i
       LEFT JOIN users u ON i.id_client = u.id
       ORDER BY i.created_at DESC, i.id_issue DESC
       LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );
    res.json({ issues: rows, total });
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero delle segnalazioni' });
  }
});

// POST /api/issues - crea una nuova segnalazione
router.post('/', async (req, res) => {
  try {
    const { title, description, status, created_at, id_client, admin_note } = req.body;
    console.log('POST /issues body:', req.body);
    if (!id_client) {
      return res.status(400).json({ error: "id_client obbligatorio per la creazione della segnalazione" });
    }
    console.log('Insert values:', [title, description, status, created_at, id_client, admin_note]);
    await db.query(
      `INSERT INTO issues (title, description, status, created_at, id_client, admin_note) VALUES (?, ?, ?, ?, ?, ?)` ,
      [title, description, status, created_at, id_client, admin_note || null]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Errore nella creazione della segnalazione:', err);
    res.status(500).json({ error: "Errore nella creazione della segnalazione" });
  }
});

// PUT /api/issues/:id - aggiorna una segnalazione
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { title, description, status, created_at, admin_note } = req.body;
    // Aggiorna solo i campi consentiti
    await db.query(
      `UPDATE issues SET title=?, description=?, status=?, created_at=?, admin_note=? WHERE id_issue=?`,
      [title, description, status, created_at, admin_note, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Errore nell'aggiornamento della segnalazione" });
  }
});

module.exports = router;
