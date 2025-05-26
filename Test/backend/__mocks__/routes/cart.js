const express = require('express');
const router = express.Router();
const db = require('../../db');

// POST /cart - Crea carrello (se non esiste)
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verifica se esiste già
    const existingResult = await db.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
    
    if (existingResult[0].length > 0) {
      return res.status(200).json({ message: 'Carrello già esistente', cart_id: existingResult[0][0].id });
    }
    
    // Simula creazione carrello
    const result = await db.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
    
    res.status(201).json({ message: 'Carrello creato', cart_id: result[0].insertId });
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione del carrello', details: error.message });
  }
});

// POST /cart/items - Aggiungi prodotto al carrello
router.post('/items', async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity } = req.body;
    
    if (!product_id || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Dati non validi' });
    }
    
    // Trova o crea carrello
    let cartsResult = await db.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
    let cartId;
    
    if (cartsResult[0].length === 0) {
      const result = await db.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
      cartId = result[0].insertId;
    } else {
      cartId = cartsResult[0][0].id;
    }
    
    // Verifica se già presente
    const itemsResult = await db.query('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, product_id]);
    
    if (itemsResult[0].length > 0) {
      // Aggiorna quantità
      await db.query('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [quantity, itemsResult[0][0].id]);
    } else {
      // Inserisci nuovo
      await db.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)', [cartId, product_id, quantity]);
    }
    
    res.status(200).json({ message: 'Prodotto aggiunto/aggiornato nel carrello' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiunta al carrello', details: error.message });
  }
});

// GET /cart - Ottieni carrello
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cartsResult = await db.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
    
    if (cartsResult[0].length === 0) {
      return res.json({ items: [] });
    }
    
    const cartId = cartsResult[0][0].id;
    
    const itemsResult = await db.query(`
      SELECT ci.id as item_id, ci.product_id, ci.quantity, p.name, p.price, p.discount
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
    `, [cartId]);
    
    // Simula il recupero delle immagini
    const mockImages = {
      1: '/Media/product/1/image.webp',
      2: '/Media/product/2/image.webp',
      3: '/Media/product/3/image.webp'
    };
    
    const items = itemsResult[0].map(i => ({
      ...i,
      image: mockImages[i.product_id] || null,
      discount: i.discount || 0
    }));
    
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero del carrello', details: error.message });
  }
});

// PUT /cart/items/:item_id - Modifica quantità prodotto
router.put('/items/:item_id', async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.item_id;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Quantità non valida' });
    }
    
    // Verifica che l'item appartenga al carrello dell'utente
    const rowsResult = await db.query(`
      SELECT ci.id FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = ? AND c.user_id = ?
    `, [itemId, userId]);
    
    if (rowsResult[0].length === 0) {
      return res.status(404).json({ error: 'Item non trovato' });
    }
    
    await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, itemId]);
    
    res.json({ message: 'Quantità aggiornata' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento della quantità', details: error.message });
  }
});

// DELETE /cart/items/:item_id - Rimuovi prodotto dal carrello
router.delete('/items/:item_id', async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.item_id;
    
    // Verifica che l'item appartenga al carrello dell'utente
    const rowsResult = await db.query(`
      SELECT ci.id FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = ? AND c.user_id = ?
    `, [itemId, userId]);
    
    if (rowsResult[0].length === 0) {
      return res.status(404).json({ error: 'Item non trovato' });
    }
    
    await db.query('DELETE FROM cart_items WHERE id = ?', [itemId]);
    
    res.json({ message: 'Prodotto rimosso dal carrello' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nella rimozione dal carrello', details: error.message });
  }
});

// DELETE /cart - Svuota carrello
router.delete('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cartsResult = await db.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
    
    if (cartsResult[0].length === 0) {
      return res.json({ message: 'Carrello già vuoto' });
    }
    
    const cartId = cartsResult[0][0].id;
    
    await db.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    
    res.json({ message: 'Carrello svuotato' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nello svuotamento del carrello', details: error.message });
  }
});

module.exports = router; 