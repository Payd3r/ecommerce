const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { verifyToken } = require('../middleware/auth');

// GET /orders - Ottieni tutti gli ordini (admin o per test)
router.get('/', verifyToken, async (req, res) => {
    const clientId = req.query.clientId ? parseInt(req.query.clientId) : null;
    try {
        if (clientId) {
            // Solo l'utente stesso o un admin può vedere questi ordini
            if (req.user.role !== 'admin' && req.user.id !== clientId) {
                return res.status(403).json({ error: 'Non hai i permessi per visualizzare questi ordini' });
            }
            const [orders] = await db.query(
                `SELECT o.*, u.name as client_name FROM orders o JOIN users u ON o.client_id = u.id WHERE o.client_id = ? ORDER BY o.created_at DESC`,
                [clientId]
            );
            return res.json(orders);
        }
        const [orders] = await db.query(`
            SELECT o.*, u.name as client_name
            FROM orders o
            JOIN users u ON o.client_id = u.id
            ORDER BY o.created_at DESC
        `);
        res.json(orders);
    } catch (error) {
        console.error('Errore nel recupero degli ordini:', error);
        res.status(500).json({ error: 'Errore nel recupero degli ordini' });
    }
});

// POST /orders - Crea un nuovo ordine
router.post('/', async (req, res) => {
    const { client_id, total_price, status } = req.body;
    if (!client_id || !total_price) {
        return res.status(400).json({ error: 'client_id e total_price sono obbligatori' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO orders (client_id, total_price, status) VALUES (?, ?, ?)',
            [client_id, total_price, status || 'pending']
        );
        const [newOrder] = await db.query('SELECT * FROM orders WHERE id = ?', [result.insertId]);
        res.status(201).json(newOrder[0]);
    } catch (error) {
        console.error('Errore nella creazione dell\'ordine:', error);
        res.status(500).json({ error: 'Errore nella creazione dell\'ordine' });
    }
});

// POST /orders/checkout - Checkout: crea ordine dal carrello dell'utente
router.post('/checkout', verifyToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        // Usa userId dal body se presente, altrimenti da req.user
        const userId = req.body.userId || req.user.id;
        // Trova il carrello dell'utente
        const [carts] = await connection.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
        if (carts.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ error: 'Carrello vuoto o non trovato' });
        }
        const cartId = carts[0].id;
        // Prendi tutti gli item del carrello con info prodotto e sconto
        const [items] = await connection.query(`
            SELECT ci.product_id, ci.quantity, p.price, p.discount, p.name
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.cart_id = ?
        `, [cartId]);
        if (items.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ error: 'Carrello vuoto' });
        }
        // Controlla e aggiorna stock per ogni prodotto
        for (const item of items) {
            // Blocca la riga del prodotto per questa transazione
            const [prodRows] = await connection.query('SELECT stock FROM products WHERE id = ? FOR UPDATE', [item.product_id]);
            if (prodRows.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ error: `Prodotto non trovato: ${item.name}` });
            }
            if (prodRows[0].stock < item.quantity) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ error: `Scorte insufficienti per il prodotto: ${item.name}` });
            }
            // Aggiorna lo stock
            await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
        }
        // Calcola totale con sconti
        let total = 0;
        const orderItems = items.map(item => {
            let finalPrice = item.price;
            if (item.discount && item.discount > 0 && item.discount < 100) {
                finalPrice = finalPrice * (1 - item.discount / 100);
            }
            total += finalPrice * item.quantity;
            return {
                product_id: item.product_id,
                quantity: item.quantity,
                price: finalPrice
            };
        });
        // Crea ordine
        const [orderRes] = await connection.query(
            'INSERT INTO orders (client_id, total_price, status) VALUES (?, ?, ?)',
            [userId, total.toFixed(2), 'pending']
        );
        const orderId = orderRes.insertId;
        // Inserisci order_items
        for (const oi of orderItems) {
            await connection.query(
                'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
                [orderId, oi.product_id, oi.quantity, oi.price]
            );
        }
        // Svuota carrello
        await connection.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
        await connection.commit();
        connection.release();
        res.status(201).json({ message: 'Ordine creato', order_id: orderId, total });
    } catch (error) {
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        console.error('Errore nel checkout:', error);
        res.status(500).json({ error: 'Errore nel checkout', details: error.message });
    }
});

// GET /orders/by-artisan/:artisanId - Ottieni tutti gli ordini relativi ai prodotti di un artigiano
router.get('/by-artisan/:artisanId', async (req, res) => {
    const artisanId = parseInt(req.params.artisanId);
    if (isNaN(artisanId)) {
        return res.status(400).json({ error: 'ID artigiano non valido' });
    }
    try {
        // Trova tutti gli ordini che contengono almeno un prodotto di questo artigiano
        const [orders] = await db.query(`
            SELECT DISTINCT o.*, u.name as client_name
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            JOIN users u ON o.client_id = u.id
            WHERE p.artisan_id = ?
            ORDER BY o.created_at DESC
        `, [artisanId]);
        res.json(orders);
    } catch (error) {
        console.error('Errore nel recupero degli ordini per artigiano:', error);
        res.status(500).json({ error: 'Errore nel recupero degli ordini per artigiano' });
    }
});

// GET /orders/stats/sales?artisanId=... - Vendite mensili per artigiano
router.get('/stats/sales', async (req, res) => {
    const artisanId = parseInt(req.query.artisanId);
    if (isNaN(artisanId)) {
        return res.status(400).json({ error: 'ID artigiano non valido' });
    }
    try {
        const [rows] = await db.query(`
            SELECT DATE_FORMAT(o.created_at, '%Y-%m') as month, SUM(oi.unit_price * oi.quantity) as total_sales
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE p.artisan_id = ?
            GROUP BY month
            ORDER BY month ASC
        `, [artisanId]);
        res.json(rows);
    } catch (error) {
        console.error('Errore nel recupero delle vendite mensili:', error);
        res.status(500).json({ error: 'Errore nel recupero delle vendite mensili' });
    }
});

// GET /orders/stats/orders?artisanId=... - Numero ordini mensili per artigiano
router.get('/stats/orders', async (req, res) => {
    const artisanId = parseInt(req.query.artisanId);
    if (isNaN(artisanId)) {
        return res.status(400).json({ error: 'ID artigiano non valido' });
    }
    try {
        const [rows] = await db.query(`
            SELECT DATE_FORMAT(o.created_at, '%Y-%m') as month, COUNT(DISTINCT o.id) as total_orders
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE p.artisan_id = ?
            GROUP BY month
            ORDER BY month ASC
        `, [artisanId]);
        res.json(rows);
    } catch (error) {
        console.error('Errore nel recupero del numero ordini mensili:', error);
        res.status(500).json({ error: 'Errore nel recupero del numero ordini mensili' });
    }
});

// GET /orders/:orderId/items - Ottieni tutti gli order_items di un ordine specifico
router.get('/:orderId/items', async (req, res) => {
    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) {
        return res.status(400).json({ error: 'ID ordine non valido' });
    }
    try {
        const [items] = await db.query(`
            SELECT oi.*, p.name as product_name, p.price as product_price, p.discount, p.artisan_id
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [orderId]);
        res.json(items);
    } catch (error) {
        console.error('Errore nel recupero degli order items:', error);
        res.status(500).json({ error: 'Errore nel recupero degli order items' });
    }
});

// GET /orders/by-artisan/:artisanId/filtered - Ordini con filtri e paginazione
router.get('/by-artisan/:artisanId/filtered', async (req, res) => {
    const artisanId = parseInt(req.params.artisanId);
    if (isNaN(artisanId)) {
        return res.status(400).json({ error: 'ID artigiano non valido' });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const startDate = req.query.startDate ? req.query.startDate : null;
    const endDate = req.query.endDate ? req.query.endDate : null;
    const status = req.query.status || null;
    const sort = req.query.sort === 'asc' ? 'ASC' : 'DESC';

    let where = 'WHERE p.artisan_id = ?';
    let params = [artisanId];
    if (minPrice !== null) { where += ' AND o.total_price >= ?'; params.push(minPrice); }
    if (maxPrice !== null) { where += ' AND o.total_price <= ?'; params.push(maxPrice); }
    if (startDate) { where += ' AND o.created_at >= ?'; params.push(startDate); }
    if (endDate) { where += ' AND o.created_at <= ?'; params.push(endDate); }
    if (status) { where += ' AND o.status = ?'; params.push(status); }

    // Query principale
    const query = `
        SELECT DISTINCT o.*, u.name as client_name
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        JOIN users u ON o.client_id = u.id
        ${where}
        ORDER BY o.created_at ${sort}
        LIMIT ? OFFSET ?
    `;
    // Query per il conteggio totale
    const countQuery = `
        SELECT COUNT(DISTINCT o.id) as total
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        ${where}
    `;
    try {
        const [orders] = await db.query(query, [...params, limit, offset]);
        const [countRes] = await db.query(countQuery, params);
        const total = countRes[0]?.total || 0;
        const totalPages = Math.ceil(total / limit) || 1;
        res.json({
            orders,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.error('Errore nel recupero degli ordini filtrati:', error);
        res.status(500).json({ error: 'Errore nel recupero degli ordini filtrati' });
    }
});

// DELETE /orders/:orderId - Elimina un ordine e i suoi order_items
router.delete('/:orderId', verifyToken, async (req, res) => {
    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) {
        return res.status(400).json({ error: 'ID ordine non valido' });
    }
    try {
        // Se admin, elimina sempre. Se artisan, elimina solo se almeno un prodotto dell'ordine è suo.
        if (req.user.role === 'artisan') {
            // Controlla se l'artigiano ha almeno un prodotto in questo ordine
            const [items] = await db.query(`
                SELECT oi.id FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ? AND p.artisan_id = ?
            `, [orderId, req.user.id]);
            if (!items.length) {
                return res.status(403).json({ error: 'Non hai i permessi per eliminare questo ordine' });
            }
        }
        // --- INIZIO LOGICA RESTITUZIONE SCORTE ---
        // Recupera tutti gli order_items dell'ordine
        const [orderItems] = await db.query(
            'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
            [orderId]
        );
        // Per ogni prodotto, restituisci la quantità alle scorte
        for (const item of orderItems) {
            await db.query(
                'UPDATE products SET stock = stock + ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }
        // --- FINE LOGICA RESTITUZIONE SCORTE ---
        // Elimina prima gli order_items
        await db.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
        // Poi elimina l'ordine
        const [result] = await db.query('DELETE FROM orders WHERE id = ?', [orderId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ordine non trovato' });
        }
        res.json({ message: 'Ordine eliminato' });
    } catch (error) {
        console.error('Errore nell\'eliminazione dell\'ordine:', error);
        res.status(500).json({ error: 'Errore nell\'eliminazione dell\'ordine' });
    }
});

// PUT /orders/:orderId - Aggiorna lo stato di un ordine
router.put('/:orderId', verifyToken, async (req, res) => {
    const orderId = parseInt(req.params.orderId);
    const { status } = req.body;
    if (isNaN(orderId) || !status) {
        return res.status(400).json({ error: 'ID ordine o stato non valido' });
    }
    try {
        // Recupera lo stato attuale e il client/artisan associato
        const [[order]] = await db.query('SELECT status, client_id FROM orders WHERE id = ?', [orderId]);
        if (!order) {
            return res.status(404).json({ error: 'Ordine non trovato' });
        }
        const currentStatus = order.status;
        // Definisci le transizioni valide
        const validTransitions = {
            pending: ['accepted', 'refused'],
            accepted: ['shipped'],
            shipped: ['delivered']
        };
        // Controlla se la transizione è valida
        if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
            return res.status(400).json({ error: `Transizione di stato non valida da '${currentStatus}' a '${status}'` });
        }
        // Se admin, può cambiare stato liberamente
        if (req.user.role === 'admin') {
            // Se da pending a refused, restituisci scorte
            if (currentStatus === 'pending' && status === 'refused') {
                const [orderItems] = await db.query(
                    'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
                    [orderId]
                );
                for (const item of orderItems) {
                    await db.query(
                        'UPDATE products SET stock = stock + ? WHERE id = ?',
                        [item.quantity, item.product_id]
                    );
                }
            }
            const [result] = await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Ordine non trovato' });
            }
            return res.json({ message: 'Stato ordine aggiornato (admin)' });
        }
        // Controlla permessi
        if (currentStatus === 'pending' && (status === 'accepted' || status === 'refused')) {
            if (req.user.role !== 'artisan') {
                return res.status(403).json({ error: 'Solo l\'artigiano può accettare o rifiutare l\'ordine' });
            }
        } else if (currentStatus === 'accepted' && status === 'shipped') {
            if (req.user.role !== 'artisan') {
                return res.status(403).json({ error: 'Solo l\'artigiano può spedire l\'ordine' });
            }
        } else if (currentStatus === 'shipped' && status === 'delivered') {
            if (req.user.role !== 'client' && req.user.role !== 'user' && req.user.id !== order.client_id) {
                return res.status(403).json({ error: 'Solo il cliente può segnare l\'ordine come ricevuto' });
            }
        }
        // Se rifiutato, restituisci le scorte
        if (currentStatus === 'pending' && status === 'refused') {
            const [orderItems] = await db.query(
                'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
                [orderId]
            );
            for (const item of orderItems) {
                await db.query(
                    'UPDATE products SET stock = stock + ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }
        }
        // Aggiorna lo stato
        const [result] = await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ordine non trovato' });
        }
        res.json({ message: 'Stato ordine aggiornato' });
    } catch (error) {
        console.error('Errore nell\'aggiornamento dello stato ordine:', error);
        res.status(500).json({ error: 'Errore nell\'aggiornamento dello stato ordine' });
    }
});

module.exports = router;
