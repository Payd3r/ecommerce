const request = require('supertest');
const app = require('../../Backend/app');
const db = require('../../Backend/db');

// Mock del database
jest.mock('../../Backend/db');

describe('Flusso di Checkout', () => {
  let authToken;
  let cartId;
  let userId = 46;
  
  // Prima dei test, effettua il login
  beforeAll(async () => {
    // Mock per la risposta del login
    db.query.mockResolvedValueOnce({
      rows: [{
        id: userId,
        email: 'antonio@example.com',
        name: 'Antonio',
        role: 'client'
      }]
    });
    
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: 'antonio@example.com',
        password: 'password123'
      });
    
    authToken = loginRes.body.data.token;
  });
  
  // Test del flusso completo
  it('dovrebbe completare l\'intero processo di checkout', async () => {
    // 1. Ottieni il carrello dell'utente
    db.query.mockResolvedValueOnce({
      rows: [{ id: 11, user_id: userId }]
    });
    db.query.mockResolvedValueOnce({ rows: [] }); // Carrello vuoto inizialmente
    
    const cartRes = await request(app)
      .get('/cart')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(cartRes.statusCode).toEqual(200);
    cartId = cartRes.body.data.id;
    
    // 2. Aggiungi un prodotto al carrello
    db.query.mockResolvedValueOnce({
      rows: [{ id: cartId, user_id: userId }]
    });
    db.query.mockResolvedValueOnce({
      rows: [{ id: 20, name: 'Costine', price: 20.00, discount: 0, stock: 100 }]
    });
    db.query.mockResolvedValueOnce({ rows: [] }); // Prodotto non presente nel carrello
    db.query.mockResolvedValueOnce({
      rows: [{ id: 62, cart_id: cartId, product_id: 20, quantity: 1 }]
    });
    
    const addToCartRes = await request(app)
      .post('/cart/items')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        product_id: 20,
        quantity: 1
      });
    
    expect(addToCartRes.statusCode).toEqual(200);
    expect(addToCartRes.body.data.product_id).toEqual(20);
    
    // 3. Verifica l'indirizzo di consegna esistente
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 4,
        user_id: userId,
        name: 'Antonio',
        surname: 'Rossi',
        stato: 'Italia',
        citta: 'Milano',
        provincia: 'MI',
        via: 'Via Monte Napoleone',
        cap: '20121',
        numero_civico: 12
      }]
    });
    
    const addressRes = await request(app)
      .get('/address')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(addressRes.statusCode).toEqual(200);
    expect(addressRes.body.data[0].id).toEqual(4);
    
    // 4. Crea un ordine
    db.query.mockResolvedValueOnce({
      rows: [{ id: cartId, user_id: userId }]
    });
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 62,
        cart_id: cartId,
        product_id: 20,
        quantity: 1,
        product_name: 'Costine',
        product_price: 20.00,
        product_discount: 0
      }]
    });
    db.query.mockResolvedValueOnce({
      rows: [{ id: 20, stock: 100 }]
    });
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 27,
        client_id: userId,
        total_price: '20.00',
        status: 'pending',
        created_at: '2025-05-20T15:00:00.000Z'
      }]
    });
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 27,
        order_id: 27,
        product_id: 20,
        quantity: 1,
        unit_price: '20.00'
      }]
    });
    db.query.mockResolvedValueOnce({ rows: [{ id: 20 }] }); // Aggiornamento stock
    db.query.mockResolvedValueOnce({ rows: [] }); // Svuotamento carrello
    
    const createOrderRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        delivery_info_id: 4
      });
    
    expect(createOrderRes.statusCode).toEqual(201);
    expect(createOrderRes.body.data.id).toEqual(27);
    expect(createOrderRes.body.data.status).toEqual('pending');
    
    const orderId = createOrderRes.body.data.id;
    
    // 5. Verifica lo stato dell'ordine
    db.query.mockResolvedValueOnce({
      rows: [{
        id: orderId,
        client_id: userId,
        total_price: '20.00',
        status: 'pending',
        created_at: '2025-05-20T15:00:00.000Z'
      }]
    });
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 27,
        order_id: orderId,
        product_id: 20,
        quantity: 1,
        unit_price: '20.00',
        product_name: 'Costine'
      }]
    });
    
    const orderDetailsRes = await request(app)
      .get(`/orders/${orderId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(orderDetailsRes.statusCode).toEqual(200);
    expect(orderDetailsRes.body.data.id).toEqual(orderId);
    expect(orderDetailsRes.body.data.status).toEqual('pending');
    expect(orderDetailsRes.body.data.items.length).toEqual(1);
    expect(orderDetailsRes.body.data.items[0].product_name).toEqual('Costine');
  });
}); 