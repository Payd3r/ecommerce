const express = require('express');
const router = express.Router();
const db = require('../models/db');
const bcrypt = require('bcrypt');
const { verifyToken, checkRole } = require('../middleware/auth');

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

        // Aggiungi la condizione di ricerca per nome se presente
        if (req.query.name) {
            query += ' AND name LIKE ?';
            countQuery += ' AND name LIKE ?';
            queryParams.push(`%${req.query.name}%`);
        }

        // Aggiungi la condizione di ricerca per email se presente
        if (req.query.email) {
            query += ' AND email LIKE ?';
            countQuery += ' AND email LIKE ?';
            queryParams.push(`%${req.query.email}%`);
        }

        // Aggiungi il filtro per il ruolo se presente
        if (role) {
            query += ' AND role = ?';
            countQuery += ' AND role = ?';
            queryParams.push(role);
        }

        // Aggiungi ordinamento e paginazione
        query += ` ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);

        // Esegui le query
        const [users] = await db.query(query, queryParams);
        const [totalCount] = await db.query(countQuery, queryParams.slice(0, queryParams.length - 2));

        // Calcola la paginazione
        const total = totalCount[0].total;
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

// GET /users/artisans - Ottieni tutti gli artisani o uno specifico se viene passato id
router.get('/artisans', async (req, res) => {
    try {
        const id = req.query.id ? parseInt(req.query.id) : null;
        if (id) {
            // Restituisci solo l'artigiano con quell'id
            const [artisans] = await db.query('SELECT id, name, created_at FROM users WHERE role = "artisan" AND id = ?', [id]);
            if (artisans.length === 0) {
                return res.status(404).json({ error: 'Artigiano non trovato' });
            }
            return res.json({ data: artisans[0] });
        }
        // Procedi con la normale logica della route
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const searchTerm = req.query.search || '';

        // Costruisci la query di base per ottenere solo gli artisani
        let query = 'SELECT id, name, created_at FROM users WHERE role = "artisan"';
        let countQuery = 'SELECT COUNT(*) as total FROM users WHERE role = "artisan"';
        const queryParams = [];
        
        // Aggiungi la condizione di ricerca se presente
        if (searchTerm) {
            query += ' AND name LIKE ?';
            countQuery += ' AND name LIKE ?';
            queryParams.push(`%${searchTerm}%`);
        }

        // Aggiungi ordinamento e paginazione
        query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        // Esegui le query
        const [artisans] = await db.query(query, queryParams);
        const [totalCount] = await db.query(countQuery, searchTerm ? [`%${searchTerm}%`] : []);

        // Calcola la paginazione
        const total = totalCount[0].total;
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.json({
            data: artisans,
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
        console.error('Errore nel recupero degli artisani:', error);
        res.status(500).json({ 
            error: 'Errore nel recupero degli artisani',
            details: error.message 
        });
    }
});

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

module.exports = router;