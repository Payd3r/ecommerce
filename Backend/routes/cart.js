const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Assicurati che sia la tua connessione al DB
const { verifyToken } = require('../middleware/auth');

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
                imagesMap[img.product_id] = img.url;
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

// 6. Svuota carrello
router.delete('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [carts] = await db.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
        if (carts.length === 0) return res.json({ message: 'Carrello già vuoto' });
        const cartId = carts[0].id;
        await db.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
        res.json({ message: 'Carrello svuotato' });
    } catch (error) {
        res.status(500).json({ error: 'Errore nello svuotamento del carrello', details: error.message });
    }
});

module.exports = router;
