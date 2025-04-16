const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { verifyToken, checkRole } = require('../middleware/auth');

// GET /users - Ottieni tutti gli utenti con paginazione e ricerca
// Solo admin può vedere tutti gli utenti
router.get('/', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const searchTerm = req.query.search_term || '';

        // Costruisci la query di base
        let query = 'SELECT id, name, email, role, created_at FROM users';
        let countQuery = 'SELECT COUNT(*) as total FROM users';
        const queryParams = [];
        
        // Aggiungi la condizione di ricerca se presente
        if (searchTerm) {
            query += ' WHERE name LIKE ?';
            countQuery += ' WHERE name LIKE ?';
            queryParams.push(`%${searchTerm}%`);
        }

        // Aggiungi ordinamento e paginazione
        query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        // Esegui le query
        const [users] = await db.query(query, queryParams);
        const [totalCount] = await db.query(countQuery, searchTerm ? [`%${searchTerm}%`] : []);

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
        // const hashedPassword = await bcrypt.hash(password, 10);

        // Inserisci il nuovo utente
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, password, role]
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

// PUT /users/:id - Aggiorna un utente esistente
// Un utente può modificare solo il proprio profilo, admin può modificare tutti
router.put('/:id', verifyToken, async (req, res) => {
    const { name, email, role } = req.body;
    const userId = req.params.id;

    // Verifica che l'utente stia modificando il proprio profilo o sia admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
        return res.status(403).json({ 
            error: 'Non hai i permessi per modificare questo profilo' 
        });
    }

    // Se non è admin, non può modificare il ruolo
    if (req.user.role !== 'admin' && role !== req.user.role) {
        return res.status(403).json({ 
            error: 'Non hai i permessi per modificare il ruolo' 
        });
    }

    // Validazione
    if (!name || !email || !role) {
        return res.status(400).json({ 
            error: 'Nome, email e ruolo sono obbligatori' 
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
        // Verifica che l'utente esista
        const [existingUser] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (existingUser.length === 0) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }

        // Verifica se l'email è già in uso da un altro utente
        const [emailUser] = await db.query(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, userId]
        );
        if (emailUser.length > 0) {
            return res.status(400).json({ error: 'Email già in uso' });
        }

        // Aggiorna l'utente
        await db.query(
            'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
            [name, email, role, userId]
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