const express = require('express');
const router = express.Router();
const db = require('../../db');
const Stripe = require('stripe');

// Mock di Stripe
const stripe = {
  paymentIntents: {
    create: jest.fn().mockResolvedValue({ client_secret: 'test_client_secret' }),
    retrieve: jest.fn().mockResolvedValue({ status: 'succeeded' })
  }
};

// GET /orders - Ottieni tutti gli ordini
router.get('/', async (req, res) => {
  const clientId = req.query.clientId ? parseInt(req.query.clientId) : null;
  
  try {
    if (clientId) {
      // Solo l'utente stesso o un admin può vedere questi ordini
      if (req.user.role !== 'admin' && req.user.id !== clientId) {
        return res.status(403).json({ error: 'Non hai i permessi per visualizzare questi ordini' });
      }
      
      const result = await db.query(
        `SELECT o.*, u.name as client_name, di.stato, di.citta, di.provincia, di.via, di.cap, di.numero_civico
         FROM orders o 
         JOIN users u ON o.client_id = u.id 
         LEFT JOIN delivery_info di ON o.client_id = di.user_id
         WHERE o.client_id = ? ORDER BY o.created_at DESC`,
        [clientId]
      );
      
      return res.json(result[0]);
    }
    
    const result = await db.query(`
      SELECT o.*, u.name as client_name, di.stato, di.citta, di.provincia, di.via, di.cap, di.numero_civico
      FROM orders o
      JOIN users u ON o.client_id = u.id
      LEFT JOIN delivery_info di ON o.client_id = di.user_id
      ORDER BY o.created_at DESC
    `);
    
    res.json(result[0]);
  } catch (error) {
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
    const result = await db.query(
      'INSERT INTO orders (client_id, total_price, status) VALUES (?, ?, ?)',
      [client_id, total_price, status || 'pending']
    );
    
    const newOrder = {
      id: result[0].insertId,
      client_id,
      total_price,
      status: status || 'pending',
      created_at: new Date().toISOString()
    };
    
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione dell\'ordine' });
  }
});

// POST /orders/checkout - Checkout: crea ordine dal carrello dell'utente
router.post('/checkout', async (req, res) => {
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
    const cartsResult = await connection.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
    const carts = cartsResult[0];
    
    if (carts.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: 'Carrello vuoto o non trovato' });
    }
    
    const cartId = carts[0].id;
    
    // Prendi tutti gli item del carrello con info prodotto e sconto
    const itemsResult = await connection.query(`
      SELECT ci.product_id, ci.quantity, p.price, p.discount, p.name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
    `, [cartId]);
    
    const items = itemsResult[0];
    
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
    const orderResult = await connection.query(
      'INSERT INTO orders (client_id, total_price, status) VALUES (?, ?, ?)',
      [userId, total.toFixed(2), 'pending']
    );
    
    const orderId = orderResult[0].insertId;
    
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
    res.status(500).json({ error: 'Errore nel checkout', details: error.message });
  }
});

// PUT /orders/:orderId - Aggiorna lo stato di un ordine
router.put('/:orderId', async (req, res) => {
  const orderId = parseInt(req.params.orderId);
  const { status } = req.body;
  
  if (isNaN(orderId) || !status) {
    return res.status(400).json({ error: 'ID ordine o stato non valido' });
  }
  
  try {
    // Recupera lo stato attuale e il client/artisan associato
    const orderResult = await db.query('SELECT status, client_id FROM orders WHERE id = ?', [orderId]);
    const order = orderResult[0][0];
    
    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    
    const currentStatus = order.status;
    
    // Se admin, può cambiare stato liberamente
    if (req.user.role === 'admin') {
      await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
      return res.json({ message: 'Stato ordine aggiornato (admin)' });
    }
    
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
    
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    res.json({ message: 'Stato ordine aggiornato' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento dello stato ordine' });
  }
});

// DELETE /orders/:orderId - Elimina un ordine
router.delete('/:orderId', async (req, res) => {
  const orderId = parseInt(req.params.orderId);
  
  if (isNaN(orderId)) {
    return res.status(400).json({ error: 'ID ordine non valido' });
  }
  
  try {
    // Recupera tutti gli order_items dell'ordine
    const itemsResult = await db.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
    const items = itemsResult[0];
    
    // Restituisci le quantità al magazzino
    for (const item of items) {
      await db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
    }
    
    // Elimina prima gli order_items
    await db.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
    
    // Poi elimina l'ordine
    const result = await db.query('DELETE FROM orders WHERE id = ?', [orderId]);
    
    if (result[0].affectedRows === 0) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    
    res.json({ message: 'Ordine eliminato' });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione dell\'ordine' });
  }
});

// POST /orders/create-payment-intent - Crea una PaymentIntent Stripe
router.post('/create-payment-intent', async (req, res) => {
  try {
    // Calcola il totale del carrello dell'utente
    const userId = req.body.userId || req.user.id;
    
    const cartsResult = await db.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
    
    if (cartsResult[0].length === 0) {
      return res.status(400).json({ error: 'Carrello vuoto o non trovato' });
    }
    
    const cartId = cartsResult[0][0].id;
    
    const itemsResult = await db.query(`
      SELECT ci.quantity, p.price, p.discount
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
    `, [cartId]);
    
    const items = itemsResult[0];
    
    if (items.length === 0) {
      return res.status(400).json({ error: 'Carrello vuoto' });
    }
    
    // Simulazione creazione paymentIntent
    const clientSecret = 'test_client_secret_' + Date.now();
    
    res.json({ clientSecret });
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione del pagamento', details: error.message });
  }
});

module.exports = router; 