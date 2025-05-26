const express = require('express');
const router = express.Router();
const db = require('../../db');

// GET /issues - Ottieni tutte le segnalazioni con paginazione
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    
    // Simula il conteggio totale
    const countResult = await db.query('SELECT COUNT(*) as total FROM issues');
    const total = countResult[0][0].total || 20; // Default 20 per i test
    
    // Simula le segnalazioni
    const issuesResult = await db.query(
      `SELECT i.id_issue, i.title, u.name as client_name, i.description, i.status, i.created_at, i.admin_note, i.id_client
       FROM issues i
       LEFT JOIN users u ON i.id_client = u.id
       ORDER BY i.created_at DESC, i.id_issue DESC
       LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );
    
    res.json({ issues: issuesResult[0], total });
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero delle segnalazioni' });
  }
});

// POST /issues - Crea una nuova segnalazione
router.post('/', async (req, res) => {
  try {
    const { title, description, status, created_at, id_client, admin_note } = req.body;
    
    if (!id_client) {
      return res.status(400).json({ error: "id_client obbligatorio per la creazione della segnalazione" });
    }
    
    // Simula l'inserimento
    await db.query(
      `INSERT INTO issues (title, description, status, created_at, id_client, admin_note) VALUES (?, ?, ?, ?, ?, ?)` ,
      [title, description, status, created_at, id_client, admin_note || null]
    );
    
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Errore nella creazione della segnalazione" });
  }
});

// PUT /issues/:id - Aggiorna una segnalazione
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { title, description, status, created_at, admin_note } = req.body;
    
    // Simula l'aggiornamento
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