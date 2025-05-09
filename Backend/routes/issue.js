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
      `SELECT i.id_issue, i.title, u.name as client_name, i.description, i.status, i.created_at
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

module.exports = router;
