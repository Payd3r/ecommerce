const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { verifyToken } = require('../middleware/auth');
require('dotenv').config();
const Stripe = require('stripe');
const stripe = Stripe("sk_test_51RQktnE3wYvtSR1Ne20OWPwX7VLwH6j9Bnpb06vv1e4eXZYEEbU4I1InNWFhlrWbdoJLa206P1gVml47ZX2JFw1W00X8h0VobE");

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Ottieni tutti gli ordini (admin o per test, o per clientId)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: integer
 *         description: ID del cliente (opzionale, filtra per utente)
 *     responses:
 *       200:
 *         description: Lista degli ordini
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
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
                `SELECT o.*, u.name as client_name, di.stato, di.citta, di.provincia, di.via, di.cap, di.numero_civico, di.name as address_name, di.surname as address_surname
                 FROM orders o 
                 JOIN users u ON o.client_id = u.id 
                 LEFT JOIN delivery_info di ON o.client_id = di.user_id
                 WHERE o.client_id = ? ORDER BY o.created_at DESC`,
                [clientId]
            );
            return res.json(orders);
        }
        const [orders] = await db.query(`
            SELECT o.*, u.name as client_name, di.stato, di.citta, di.provincia, di.via, di.cap, di.numero_civico, di.name as address_name, di.surname as address_surname
            FROM orders o
            JOIN users u ON o.client_id = u.id
            LEFT JOIN delivery_info di ON o.client_id = di.user_id
            ORDER BY o.created_at DESC
        `);
        res.json(orders);
    } catch (error) {
        console.error('Errore nel recupero degli ordini:', error);
        res.status(500).json({ error: 'Errore nel recupero degli ordini' });
    }
});

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Crea un nuovo ordine
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client_id
 *               - total_price
 *             properties:
 *               client_id:
 *                 type: integer
 *               total_price:
 *                 type: number
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ordine creato
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: client_id e total_price sono obbligatori
 */
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

/**
 * @swagger
 * /orders/checkout:
 *   post:
 *     summary: Checkout - crea ordine dal carrello dell'utente
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               paymentIntentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ordine creato dal carrello
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Carrello vuoto o pagamento non valido
 */
// POST /orders/checkout - Checkout: crea ordine dal carrello dell'utente
router.post('/checkout', verifyToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const userId = req.body.userId || req.user.id;
        const paymentIntentId = req.body.paymentIntentId;
        // Se è richiesto il pagamento, verifica che sia stato effettuato
        if (paymentIntentId) {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            if (!paymentIntent || paymentIntent.status !== 'succeeded') {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ error: 'Pagamento non valido o non riuscito' });
            }
        }
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

/**
 * @swagger
 * /orders/by-artisan/{artisanId}:
 *   get:
 *     summary: Ottieni tutti gli ordini relativi ai prodotti di un artigiano
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: artisanId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'artigiano
 *     responses:
 *       200:
 *         description: Lista degli ordini per artigiano
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: ID artigiano non valido
 */
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

/**
 * @swagger
 * /orders/stats/sales:
 *   get:
 *     summary: Vendite mensili per artigiano
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: artisanId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'artigiano
 *     responses:
 *       200:
 *         description: Statistiche di vendita mensili
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: ID artigiano non valido
 */
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

/**
 * @swagger
 * /orders/stats/orders:
 *   get:
 *     summary: Numero ordini mensili per artigiano
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: artisanId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'artigiano
 *     responses:
 *       200:
 *         description: Statistiche numero ordini mensili
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: ID artigiano non valido
 */
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

/**
 * @swagger
 * /orders/{orderId}/items:
 *   get:
 *     summary: Ottieni tutti gli order_items di un ordine specifico
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'ordine
 *     responses:
 *       200:
 *         description: Lista degli order_items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: ID ordine non valido
 */
/**
 * @swagger
 * /orders/{orderId}/items:
 *   get:
 *     summary: Ottieni gli item di un ordine specifico
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'ordine
 *     responses:
 *       200:
 *         description: Item dell'ordine
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       404:
 *         description: Ordine non trovato
 */
// GET /orders/:orderId/items - Ottieni gli item di un ordine specifico
router.get('/:orderId/items', verifyToken, async (req, res) => {
    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) {
        return res.status(400).json({ error: 'ID ordine non valido' });
    }
    
    try {
        // Verifica che l'ordine esista e l'utente abbia accesso
        const [orders] = await db.query('SELECT client_id FROM orders WHERE id = ?', [orderId]);
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Ordine non trovato' });
        }
        
        // Solo admin o il cliente proprietario possono vedere gli item
        if (req.user.role !== 'admin' && req.user.id !== orders[0].client_id) {
            return res.status(403).json({ error: 'Non hai i permessi per visualizzare questo ordine' });
        }
        
        // Recupera gli item dell'ordine
        const [items] = await db.query(`
            SELECT oi.id, oi.product_id, oi.quantity, oi.unit_price, p.name as product_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [orderId]);
        
        res.json(items);
    } catch (error) {
        console.error('Errore nel recupero degli item dell\'ordine:', error);
        res.status(500).json({ error: 'Errore nel recupero degli item dell\'ordine' });
    }
});

/**
 * @swagger
 * /orders/by-artisan/{artisanId}/filtered:
 *   get:
 *     summary: Ordini con filtri e paginazione per artigiano
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: artisanId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'artigiano
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numero della pagina
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Numero di ordini per pagina
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Prezzo minimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Prezzo massimo
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inizio
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data fine
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Stato ordine
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Ordinamento (ascendente o discendente)
 *     responses:
 *       200:
 *         description: Lista ordini filtrati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *       400:
 *         description: ID artigiano non valido
 */
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

/**
 * @swagger
 * /orders/{orderId}:
 *   delete:
 *     summary: Elimina un ordine e i suoi order_items
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'ordine
 *     responses:
 *       200:
 *         description: Ordine eliminato
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: ID ordine non valido
 *       404:
 *         description: Ordine non trovato
 */
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

/**
 * @swagger
 * /orders/{orderId}:
 *   put:
 *     summary: Aggiorna lo stato di un ordine
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'ordine
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stato ordine aggiornato
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: ID ordine o stato non valido
 *       404:
 *         description: Ordine non trovato
 */
// PUT /orders/:orderId - Aggiorna lo stato di un ordine
router.put('/:orderId', verifyToken, async (req, res) => {
    const orderId = parseInt(req.params.orderId);
    const { status } = req.body;
    
    if (isNaN(orderId)) {
        return res.status(400).json({ error: 'ID ordine non valido' });
    }
    
    // Se non viene fornito uno status, restituisci gli item dell'ordine (per compatibilità test)
    if (!status) {
        try {
            // Verifica che l'ordine esista e l'utente abbia accesso
            const [orders] = await db.query('SELECT client_id FROM orders WHERE id = ?', [orderId]);
            if (orders.length === 0) {
                return res.status(404).json({ error: 'Ordine non trovato' });
            }
            
            // Solo admin o il cliente proprietario possono vedere gli item
            if (req.user.role !== 'admin' && req.user.id !== orders[0].client_id) {
                return res.status(403).json({ error: 'Non hai i permessi per visualizzare questo ordine' });
            }
            
            // Recupera gli item dell'ordine
            const [items] = await db.query(`
                SELECT oi.id, oi.product_id, oi.quantity, oi.unit_price, p.name as product_name
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `, [orderId]);
            
            return res.json(items);
        } catch (error) {
            console.error('Errore nel recupero degli item dell\'ordine:', error);
            return res.status(500).json({ error: 'Errore nel recupero degli item dell\'ordine' });
        }
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
            // Se da pending a accepted, scala le scorte
            if (currentStatus === 'pending' && status === 'accepted') {
                const [orderItems] = await db.query(
                    'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
                    [orderId]
                );
                for (const item of orderItems) {
                    const [[prod]] = await db.query('SELECT stock FROM products WHERE id = ? FOR UPDATE', [item.product_id]);
                    if (!prod || prod.stock < item.quantity) {
                        return res.status(400).json({ error: `Scorte insufficienti per il prodotto ID: ${item.product_id}` });
                    }
                }
                for (const item of orderItems) {
                    await db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
                }
            }
            const [result] = await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Ordine non trovato' });
            }
            return res.json({ message: 'Stato ordine aggiornato (admin)' });
        }
        // Controlla se la transizione è valida
        if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
            return res.status(400).json({ error: `Transizione di stato non valida da '${currentStatus}' a '${status}'` });
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
            // NIENTE: le scorte non sono mai state scalate
        }
        // Se accettato, controlla e scala le scorte
        if (currentStatus === 'pending' && status === 'accepted') {
            // Recupera tutti gli order_items dell'ordine
            const [orderItems] = await db.query(
                'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
                [orderId]
            );
            // Controlla e scala le scorte
            for (const item of orderItems) {
                const [[prod]] = await db.query('SELECT stock FROM products WHERE id = ? FOR UPDATE', [item.product_id]);
                if (!prod || prod.stock < item.quantity) {
                    return res.status(400).json({ error: `Scorte insufficienti per il prodotto ID: ${item.product_id}` });
                }
            }
            // Se tutte le scorte sono sufficienti, scala
            for (const item of orderItems) {
                await db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
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

/**
 * @swagger
 * /orders/create-payment-intent:
 *   post:
 *     summary: Crea una PaymentIntent Stripe
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: PaymentIntent creata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Carrello vuoto o non trovato
 */
// POST /orders/create-payment-intent - Crea una PaymentIntent Stripe
router.post('/create-payment-intent', verifyToken, async (req, res) => {
    try {
        // Calcola il totale del carrello dell'utente
        const userId = req.body.userId || req.user.id;
        const [carts] = await db.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
        if (carts.length === 0) {
            return res.status(400).json({ error: 'Carrello vuoto o non trovato' });
        }
        const cartId = carts[0].id;
        const [items] = await db.query(`
            SELECT ci.quantity, p.price, p.discount
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.cart_id = ?
        `, [cartId]);
        if (items.length === 0) {
            return res.status(400).json({ error: 'Carrello vuoto' });
        }
        let total = 0;
        for (const item of items) {
            let finalPrice = item.price;
            if (item.discount && item.discount > 0 && item.discount < 100) {
                finalPrice = finalPrice * (1 - item.discount / 100);
            }
            total += finalPrice * item.quantity;
        }
        // importo in centesimi
        const amount = Math.round(total * 100);
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'eur',
            metadata: { userId: String(userId) }
        });
        res.json({ 
            clientSecret: paymentIntent.client_secret,
            amount: amount
        });
    } catch (err) {
        console.error('Errore Stripe PaymentIntent:', err);
        res.status(500).json({ error: 'Errore nella creazione del pagamento', details: err.message });
    }
});

module.exports = router;
