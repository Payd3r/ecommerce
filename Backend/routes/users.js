const express = require('express');
const router = express.Router();
const db = require('../models/db');
const bcrypt = require('bcrypt');
const { verifyToken, checkRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { toPublicImageUrl } = require('../services/imageUrl');

const projectRoot = path.join(__dirname, '..', '..'); 

const profileUploadDir = path.join(__dirname, '../Media/profile');
const bannerUploadDir = path.join(__dirname, '../Media/banner');

if (!fs.existsSync(profileUploadDir)) {
    fs.mkdirSync(profileUploadDir, { recursive: true });
}
if (!fs.existsSync(bannerUploadDir)) {
    fs.mkdirSync(bannerUploadDir, { recursive: true });
}


// Helper function to check file type
function checkFileType(file, filetypes, cb) {
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Images Only! (jpeg, jpg, png, gif)'));
    }
}

// Multer upload instances
const artisanDetailsUpload = multer({
    storage: multer.memoryStorage(), // Process files from buffer
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, /jpeg|jpg|png|gif/, cb);
    }
}).fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'bannerImage', maxCount: 1 }
]);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Ottieni tutti gli utenti (solo admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numero della pagina
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Numero di utenti per pagina
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtro per nome
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filtro per email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filtro per ruolo
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *         description: Campo per ordinamento
 *       - in: query
 *         name: orderDir
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Direzione ordinamento
 *     responses:
 *       200:
 *         description: Lista utenti con paginazione
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 */
// GET /users - Ottieni tutti gli utenti con paginazione, ricerca e filtri
// Solo admin può vedere tutti gli utenti
router.get('/', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const role = req.query.role || '';

        // Leggi i parametri di ordinamento dalla query string
        const orderBy = req.query.orderBy || 'name';
        const orderDir = req.query.orderDir === 'desc' ? 'DESC' : 'ASC';

        // Costruisci la query di base
        let query = 'SELECT id, name, email, role, created_at FROM users WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        const queryParams = [];
        const countQueryParams = []; // Separate params for count query if they differ

        // Aggiungi la condizione di ricerca per nome se presente
        if (req.query.name) {
            query += ' AND name LIKE ?';
            countQuery += ' AND name LIKE ?';
            queryParams.push(`%${req.query.name}%`);
            countQueryParams.push(`%${req.query.name}%`);
        }

        // Aggiungi la condizione di ricerca per email se presente
        if (req.query.email) {
            query += ' AND email LIKE ?';
            countQuery += ' AND email LIKE ?';
            queryParams.push(`%${req.query.email}%`);
            countQueryParams.push(`%${req.query.email}%`);
        }

        // Aggiungi il filtro per il ruolo se presente
        if (role) {
            query += ' AND role = ?';
            countQuery += ' AND role = ?';
            queryParams.push(role);
            countQueryParams.push(role);
        }

        // Aggiungi ordinamento e paginazione
        query += ` ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);

        // Esegui le query
        const [users] = await db.query(query, queryParams);
        const [totalCountResult] = await db.query(countQuery, countQueryParams);
        const total = totalCountResult[0].total;
        
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.json({
            users,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage,
                hasPrevPage
            }
        });
    } catch (error) {
        console.error('Errore nel recupero degli utenti:', error);
        res.status(500).json({ 
            error: 'Errore nel recupero degli utenti',
            details: error.message 
        });
    }
});

/**
 * @swagger
 * /users/artisans:
 *   get:
 *     summary: Ottieni tutti gli artigiani approvati o uno specifico
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         description: ID dell'artigiano (opzionale)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numero della pagina
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Numero di artigiani per pagina
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filtro per nome
 *     responses:
 *       200:
 *         description: Lista artigiani o dettaglio artigiano
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
// GET /users/artisans - Ottieni tutti gli artisani o uno specifico se viene passato id
router.get('/artisans', async (req, res) => {
    try {
        const id = req.query.id ? parseInt(req.query.id) : null;
        if (id) {
            // Restituisci solo l'artigiano con quell'id
            // Join con profile_image e extended_users
            const [artisans] = await db.query(
                `SELECT u.id, u.name, u.created_at, pi.url as image, eu.url_banner, eu.bio, eu.approved_at 
                 FROM users u
                 LEFT JOIN profile_image pi ON u.id = pi.user_id
                 LEFT JOIN extended_users eu ON u.id = eu.id_users
                 WHERE u.role = "artisan" AND u.id = ? AND eu.approved = 1`, [id]
            );
            if (artisans.length === 0) {
                return res.status(404).json({ error: 'Artigiano non trovato o non approvato' });
            }
            const art = artisans[0];
            art.image = art.image ? toPublicImageUrl(art.image) : null;
            art.url_banner = art.url_banner ? toPublicImageUrl(art.url_banner) : null;
            return res.json({ data: art });
        }
        // Procedi con la normale logica della route
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const searchTerm = req.query.search || '';

        // Costruisci la query di base per ottenere solo gli artisani approvati
        let query = `SELECT u.id, u.name, u.created_at, pi.url as image, eu.url_banner, eu.bio, eu.approved_at
                     FROM users u
                     LEFT JOIN profile_image pi ON u.id = pi.user_id
                     LEFT JOIN extended_users eu ON u.id = eu.id_users
                     WHERE u.role = 'artisan' AND eu.approved = 1`;
        let countQuery = `SELECT COUNT(*) as total
                          FROM users u
                          LEFT JOIN extended_users eu ON u.id = eu.id_users
                          WHERE u.role = 'artisan' AND eu.approved = 1`;
        
        const queryParams = [];
        const countQueryParams = [];
        
        // Aggiungi la condizione di ricerca se presente
        if (searchTerm) {
            query += ' AND u.name LIKE ?';
            countQuery += ' AND u.name LIKE ?';
            queryParams.push(`%${searchTerm}%`);
            countQueryParams.push(`%${searchTerm}%`);
        }

        // Aggiungi ordinamento e paginazione
        query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [artisans] = await db.query(query, queryParams);
        // Applica toPublicImageUrl a image e url_banner
        const artisansWithUrls = artisans.map(a => ({
            ...a,
            image: a.image ? toPublicImageUrl(a.image) : null,
            url_banner: a.url_banner ? toPublicImageUrl(a.url_banner) : null
        }));
        const [totalCountResult] = await db.query(countQuery, countQueryParams);
        const total = totalCountResult[0].total;

        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.json({
            data: artisansWithUrls,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage,
                hasPrevPage
            }
        });
    } catch (error) {
        console.error('Errore API /users/artisans:', error);
        res.status(500).json({ error: 'Errore nel recupero degli artigiani.' });
    }
});

/**
 * @swagger
 * /users/counts:
 *   get:
 *     summary: Conta utenti per ruolo (solo admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conteggio utenti per ruolo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
// GET /users/counts - Conta utenti per ruolo
router.get('/counts', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const [[{ clients }]] = await db.query('SELECT COUNT(*) as clients FROM users WHERE role = "client"');
        const [[{ artisans }]] = await db.query('SELECT COUNT(*) as artisans FROM users WHERE role = "artisan"');
        const [[{ admins }]] = await db.query('SELECT COUNT(*) as admins FROM users WHERE role = "admin"');
        const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM users');
        res.json({ clients, artisans, admins, total });
    } catch (error) {
        console.error('Errore nel conteggio utenti per ruolo:', error);
        res.status(500).json({ error: 'Errore nel conteggio utenti per ruolo' });
    }
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Crea un nuovo utente (solo admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utente creato
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Dati non validi o email già registrata
 */
// POST /users - Crea un nuovo utente
// Solo admin può creare nuovi utenti (la registrazione normale va gestita separatamente)
router.post('/', verifyToken, checkRole('admin'), async (req, res) => {
    const { name, email, password, role } = req.body;

    // Validazione
    if (!name || !email || !password || !role) {
        return res.status(400).json({ 
            error: 'Nome, email, password e ruolo sono obbligatori' 
        });
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Email non valida' });
    }

    // Validazione ruolo
    const validRoles = ['admin', 'client', 'artisan'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Ruolo non valido' });
    }

    try {
        // Verifica se l'email è già in uso
        const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Email già registrata' });
        }

        // Hash della password (da implementare con bcrypt)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Inserisci il nuovo utente
        const [result] = await db.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );

        const [newUser] = await db.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(newUser[0]);
    } catch (error) {
        console.error('Errore nella creazione dell\'utente:', error);
        res.status(500).json({ error: 'Errore nella creazione dell\'utente' });
    }
});

/**
 * @swagger
 * /users/pending-artisans:
 *   get:
 *     summary: Artigiani in attesa di approvazione (solo admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Numero massimo di risultati
 *     responses:
 *       200:
 *         description: Lista artigiani da approvare
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
// GET /users/pending-artisans - Artigiani in attesa di approvazione (solo admin)
router.get('/pending-artisans', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const [pending] = await db.query(
            `SELECT u.id, u.name, u.email, u.created_at
             FROM users u
             LEFT JOIN extended_users eu ON u.id = eu.id_users
             WHERE u.role = 'client' AND eu.approved = 0
             ORDER BY u.created_at DESC
             LIMIT ?`, [limit]
        );
        res.json({ users: pending });
    } catch (error) {
        console.error('Errore nel recupero degli artigiani da approvare:', error);
        res.status(500).json({ error: 'Errore nel recupero degli artigiani da approvare' });
    }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Ottieni un utente specifico (solo admin o utente stesso)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'utente
 *     responses:
 *       200:
 *         description: Dettaglio utente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       403:
 *         description: Non hai i permessi per visualizzare questo profilo
 *       404:
 *         description: Utente non trovato
 */
// GET /users/:id - Ottieni un utente specifico
// Un utente può vedere solo il proprio profilo, admin può vedere tutti
router.get('/:id', verifyToken, async (req, res) => {
    console.log('req.user', req.user);
    try {
        // Verifica che l'utente stia accedendo al proprio profilo o sia admin
        if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
            return res.status(403).json({ 
                error: 'Non hai i permessi per visualizzare questo profilo' 
            });
        }

        const [user] = await db.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [req.params.id]
        );

        if (user.length === 0) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }

        res.json(user[0]);
    } catch (error) {
        console.error('Errore nel recupero dell\'utente:', error);
        res.status(500).json({ error: 'Errore nel recupero dell\'utente' });
    }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Aggiorna un utente esistente (solo admin o utente stesso)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'utente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Utente aggiornato
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Nessun campo da aggiornare o dati non validi
 *       403:
 *         description: Non hai i permessi per modificare questo profilo
 *       404:
 *         description: Utente non trovato
 */
// PUT /users/:id - Aggiorna un utente esistente
// Un utente può modificare solo il proprio profilo, admin può modificare tutti
router.put('/:id', verifyToken, async (req, res) => {
    const { name, email, role } = req.body;
    const userId = req.params.id;

    // LOG: info utente autenticato e richiesta
    console.log('[PUT /users/:id] user.id:', req.user.id, 'user.role:', req.user.role, 'userId param:', userId, 'body:', req.body);

    // Verifica che l'utente stia modificando il proprio profilo o sia admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
        console.log('[PUT /users/:id] BLOCCATO: non è admin e non modifica il proprio profilo');
        return res.status(403).json({ 
            error: 'Non hai i permessi per modificare questo profilo' 
        });
    }

    // Se non è admin, può cambiare solo da client ad artisan
    if (req.user.role !== 'admin') {
        if (role && role !== req.user.role) {
            // Permetti solo il cambio da client a artisan
            if (!(req.user.role === 'client' && role === 'artisan')) {
                console.log('[PUT /users/:id] BLOCCATO: tentativo di cambio ruolo non consentito', 'da', req.user.role, 'a', role);
                return res.status(403).json({ 
                    error: 'Non hai i permessi per modificare il ruolo' 
                });
            } else {
                console.log('[PUT /users/:id] CONSENTITO: cambio ruolo da client a artisan');
            }
        }
    }

    // Costruisci dinamicamente la query di update solo con i campi forniti
    const fields = [];
    const values = [];
    if (name !== undefined) {
        if (!name) return res.status(400).json({ error: 'Il nome non può essere vuoto' });
        fields.push('name = ?');
        values.push(name);
    }
    if (email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) return res.status(400).json({ error: 'L\'email non può essere vuota' });
        if (!emailRegex.test(email)) return res.status(400).json({ error: 'Email non valida' });
        fields.push('email = ?');
        values.push(email);
    }
    if (role !== undefined) {
        const validRoles = ['admin', 'client', 'artisan'];
        if (!validRoles.includes(role)) return res.status(400).json({ error: 'Ruolo non valido' });
        fields.push('role = ?');
        values.push(role);
    }
    if (fields.length === 0) {
        return res.status(400).json({ error: 'Nessun campo da aggiornare' });
    }

    try {
        // Verifica che l'utente esista
        const [existingUser] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (existingUser.length === 0) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }

        // Se si vuole aggiornare l'email, verifica che non sia già in uso
        if (email !== undefined) {
            const [emailUser] = await db.query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, userId]
            );
            if (emailUser.length > 0) {
                return res.status(400).json({ error: 'Email già in uso' });
            }
        }

        // Aggiorna solo i campi forniti
        await db.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            [...values, userId]
        );

        const [updatedUser] = await db.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [userId]
        );

        res.json(updatedUser[0]);
    } catch (error) {
        console.error('Errore nell\'aggiornamento dell\'utente:', error);
        res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'utente' });
    }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Elimina un utente (solo admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'utente
 *     responses:
 *       204:
 *         description: Utente eliminato
 *       404:
 *         description: Utente non trovato
 */
// DELETE /users/:id - Elimina un utente
// Solo admin può eliminare gli utenti
router.delete('/:id', verifyToken, checkRole('admin'), async (req, res) => {
    const userId = req.params.id;

    try {
        // Verifica che l'utente esista
        const [user] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (user.length === 0) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }

        // Elimina l'utente
        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        res.status(204).send();
    } catch (error) {
        console.error('Errore nell\'eliminazione dell\'utente:', error);
        res.status(500).json({ error: 'Errore nell\'eliminazione dell\'utente' });
    }
});

/**
 * @swagger
 * /users/artisan-details:
 *   post:
 *     summary: Aggiorna dettagli artigiano (solo autenticato)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dettagli artigiano aggiornati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
// NUOVA ROTTA: POST /users/artisan-details
router.post('/artisan-details', verifyToken, async (req, res, next) => {
    // Se la richiesta è multipart/form-data, passa al middleware multer (retrocompatibilità)
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        return next();
    }
    // Altrimenti gestisci solo dati testuali (bio, ecc.)
    const userId = req.user.id;
    const { bio } = req.body;
    try {
        if (bio !== undefined) {
            await db.query(
                'INSERT INTO extended_users (id_users, bio) VALUES (?, ?) ON DUPLICATE KEY UPDATE bio = VALUES(bio)',
                [userId, bio]
            );
        }
        res.status(200).json({
            message: 'Dettagli artigiano aggiornati con successo.',
            bio: bio
        });
    } catch (error) {
        console.error('Errore API /artisan-details (json):', error);
        res.status(500).json({ error: 'Errore server nell\'aggiornamento dei dettagli artigiano.', details: error.message });
    }
}, artisanDetailsUpload, async (req, res) => {
    // Questo blocco rimane per retrocompatibilità, ma ora le immagini non vengono più gestite qui
    res.status(400).json({ error: 'Upload immagini non più supportato qui. Usa le API /images/upload/profile e /images/upload/banner.' });
});

/**
 * @swagger
 * /users/{id}/approve:
 *   put:
 *     summary: Approva un artigiano (solo admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'utente
 *     responses:
 *       200:
 *         description: Utente approvato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
// PUT /users/:id/approve - Approva un artigiano (solo admin)
router.put('/:id/approve', verifyToken, checkRole('admin'), async (req, res) => {
    const userId = req.params.id;
    try {
        // Aggiorna il ruolo in 'artisan' nella tabella users
        await db.query('UPDATE users SET role = ? WHERE id = ?', ['artisan', userId]);
        // Imposta approved=1 in extended_users
        await db.query('UPDATE extended_users SET approved = 1 WHERE id_users = ?', [userId]);
        res.json({ message: 'Utente approvato con successo' });
    } catch (error) {
        console.error('Errore nell\'approvazione dell\'utente:', error);
        res.status(500).json({ error: 'Errore nell\'approvazione dell\'utente' });
    }
});

module.exports = router;