const express = require('express');
const router = express.Router();
const db = require('../models/db');

/**
 * @swagger
 * /issues:
 *   get:
 *     summary: Restituisce le segnalazioni con paginazione
 *     tags: [Issues]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numero della pagina
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Numero di segnalazioni per pagina
 *     responses:
 *       200:
 *         description: Lista delle segnalazioni
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 issues:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 */
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

/**
 * @swagger
 * /issues:
 *   post:
 *     summary: Crea una nuova segnalazione
 *     tags: [Issues]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_client
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               created_at:
 *                 type: string
 *                 format: date-time
 *               id_client:
 *                 type: integer
 *               admin_note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Segnalazione creata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: id_client obbligatorio
 */
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

/**
 * @swagger
 * /issues/{id}:
 *   put:
 *     summary: Aggiorna una segnalazione
 *     tags: [Issues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID della segnalazione
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               created_at:
 *                 type: string
 *                 format: date-time
 *               admin_note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Segnalazione aggiornata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */
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
