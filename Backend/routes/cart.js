const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Assicurati che sia la tua connessione al DB
const { verifyToken } = require('../middleware/auth');
const { toPublicImageUrl } = require('../services/imageUrl');

/**
 * @swagger
 * /cart:
 *   post:
 *     summary: Crea un carrello per l'utente autenticato (se non esiste)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Carrello creato
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       200:
 *         description: Carrello già esistente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
// 1. Crea carrello (se non esiste)
router.post('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // Verifica se esiste già
        const [existing] = await db.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
        if (existing.length > 0) {
            return res.status(200).json({ message: 'Carrello già esistente', cart_id: existing[0].id });
        }
        const [result] = await db.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
        res.status(201).json({ message: 'Carrello creato', cart_id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Errore nella creazione del carrello', details: error.message });
    }
});

/**
 * @swagger
 * /cart/items:
 *   post:
 *     summary: Aggiungi prodotto al carrello o aggiorna quantità
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Prodotto aggiunto/aggiornato nel carrello
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Dati non validi
 */
// 2. Aggiungi prodotto al carrello (o aggiorna quantità)
router.post('/items', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id, quantity } = req.body;
        if (!product_id || !quantity || quantity < 1) {
            return res.status(400).json({ error: 'Dati non validi' });
        }
        // Trova o crea carrello
        let [carts] = await db.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
        let cartId;
        if (carts.length === 0) {
            const [result] = await db.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
            cartId = result.insertId;
        } else {
            cartId = carts[0].id;
        }
        // Verifica se già presente
        const [items] = await db.query('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, product_id]);
        if (items.length > 0) {
            // Aggiorna quantità
            await db.query('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [quantity, items[0].id]);
        } else {
            // Inserisci nuovo
            await db.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)', [cartId, product_id, quantity]);
        }
        res.status(200).json({ message: 'Prodotto aggiunto/aggiornato nel carrello' });
    } catch (error) {
        res.status(500).json({ error: 'Errore nell\'aggiunta al carrello', details: error.message });
    }
});

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Ottieni il carrello dell'utente autenticato
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrello dell'utente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
// 3. Ottieni carrello
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [carts] = await db.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
        if (carts.length === 0) {
            return res.json({ items: [] });
        }
        const cartId = carts[0].id;
        const [items] = await db.query(`
            SELECT ci.id as item_id, ci.product_id, ci.quantity, p.name, p.price, p.discount
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.cart_id = ?
        `, [cartId]);
        // Recupera la prima immagine per ogni prodotto
        const productIds = items.map(i => i.product_id);
        let imagesMap = {};
        if (productIds.length > 0) {
            const [images] = await db.query(
                'SELECT id, product_id, url FROM product_images WHERE product_id IN (?) GROUP BY product_id',
                [productIds]
            );
            images.forEach(img => {
                imagesMap[img.product_id] = toPublicImageUrl(img.url);
            });
        }
        const itemsWithImage = items.map(i => ({
            ...i,
            image: imagesMap[i.product_id] || null,
            discount: i.discount || 0
        }));
        res.json({ items: itemsWithImage });
    } catch (error) {
        console.error('Errore nel recupero del carrello:', error);
        res.status(500).json({ error: 'Errore nel recupero del carrello', details: error.message });
    }
});

/**
 * @swagger
 * /cart/items/{item_id}:
 *   put:
 *     summary: Modifica la quantità di un prodotto nel carrello
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: item_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'item nel carrello
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Quantità aggiornata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Quantità non valida
 *       404:
 *         description: Item non trovato
 */
// 4. Modifica quantità prodotto
router.put('/items/:item_id', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const itemId = req.params.item_id;
        const { quantity } = req.body;
        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Quantità non valida' });
        }
        // Verifica che l'item appartenga al carrello dell'utente
        const [rows] = await db.query(`
            SELECT ci.id FROM cart_items ci
            JOIN carts c ON ci.cart_id = c.id
            WHERE ci.id = ? AND c.user_id = ?
        `, [itemId, userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Item non trovato' });
        await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, itemId]);
        res.json({ message: 'Quantità aggiornata' });
    } catch (error) {
        res.status(500).json({ error: 'Errore nell\'aggiornamento della quantità', details: error.message });
    }
});

/**
 * @swagger
 * /cart/items/{item_id}:
 *   delete:
 *     summary: Rimuovi un prodotto dal carrello
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: item_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'item nel carrello
 *     responses:
 *       200:
 *         description: Prodotto rimosso dal carrello
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Item non trovato
 */
// 5. Rimuovi prodotto dal carrello
router.delete('/items/:item_id', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const itemId = req.params.item_id;
        // Verifica che l'item appartenga al carrello dell'utente
        const [rows] = await db.query(`
            SELECT ci.id FROM cart_items ci
            JOIN carts c ON ci.cart_id = c.id
            WHERE ci.id = ? AND c.user_id = ?
        `, [itemId, userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Item non trovato' });
        await db.query('DELETE FROM cart_items WHERE id = ?', [itemId]);
        res.json({ message: 'Prodotto rimosso dal carrello' });
    } catch (error) {
        res.status(500).json({ error: 'Errore nella rimozione dal carrello', details: error.message });
    }
});

/**
 * @swagger
 * /cart:
 *   delete:
 *     summary: Svuota il carrello dell'utente autenticato
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrello svuotato
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
// 6. Svuota carrello
router.delete('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [carts] = await db.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
        if (carts.length === 0) return res.json({ message: 'Carrello già vuoto' });
        const cartId = carts[0].id;
        // Controlla se ci sono items nel carrello
        const [items] = await db.query('SELECT COUNT(*) as count FROM cart_items WHERE cart_id = ?', [cartId]);
        if (items[0].count === 0) {
            return res.json({ message: 'Carrello già vuoto' });
        }
        await db.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
        res.json({ message: 'Carrello svuotato' });
    } catch (error) {
        res.status(500).json({ error: 'Errore nello svuotamento del carrello', details: error.message });
    }
});

module.exports = router;
