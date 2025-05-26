/**
 * Test di integrazione per le API degli ordini
 * Questi test si connettono al backend reale in esecuzione su localhost:3015
 */
const request = require('supertest');
const { setupTestEnvironment, teardownTestEnvironment, getAuthToken } = require('./config');

let app;
let adminToken;
let clientToken;
let artisanToken;

describe('Orders API Integration Tests', () => {
  // Setup e teardown dell'ambiente di test
  beforeAll(async () => {
    // Inizializza l'ambiente di test con database reale
    app = await setupTestEnvironment();
    
    // Ottieni token di autenticazione
    adminToken = await getAuthToken(app, 'admin@example.com', 'adminpassword');
    clientToken = await getAuthToken(app, 'client@example.com', 'clientpassword');
    artisanToken = await getAuthToken(app, 'artisan@example.com', 'artisanpassword');
  });
  
  afterAll(async () => {
    await teardownTestEnvironment();
  });
  
  // Variabili per i test
  let orderId;
  let cartId;
  let productId;
  
  // Test del flusso completo di ordini
  describe('Flusso completo ordini', () => {
    test('Dovrebbe creare un carrello per il cliente', async () => {
      const response = await request(app)
        .post('/cart')
        .set('Authorization', `Bearer ${clientToken}`);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Carrello creato');
      expect(response.body).toHaveProperty('cart_id');
      
      cartId = response.body.cart_id;
    });
    
    test('Dovrebbe trovare un prodotto da aggiungere al carrello', async () => {
      const response = await request(app)
        .get('/products?limit=1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBeGreaterThan(0);
      
      productId = response.body.data[0].id;
    });
    
    test('Dovrebbe aggiungere un prodotto al carrello', async () => {
      const response = await request(app)
        .post('/cart/items')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          product_id: productId,
          quantity: 2
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Prodotto aggiunto/aggiornato nel carrello');
    });
    
    test('Dovrebbe creare un PaymentIntent', async () => {
      const response = await request(app)
        .post('/orders/create-payment-intent')
        .set('Authorization', `Bearer ${clientToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('clientSecret');
    });
    
    test('Dovrebbe creare un ordine dal carrello', async () => {
      const response = await request(app)
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${clientToken}`);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('order_id');
      expect(response.body).toHaveProperty('message', 'Ordine creato');
      
      orderId = response.body.order_id;
    });
    
    test('Dovrebbe recuperare gli ordini del cliente', async () => {
      const response = await request(app)
        .get('/orders?clientId=2')
        .set('Authorization', `Bearer ${clientToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.some(order => order.id === orderId)).toBe(true);
    });
    
    test('Dovrebbe recuperare gli item dell\'ordine', async () => {
      const response = await request(app)
        .get(`/orders/${orderId}/items`)
        .set('Authorization', `Bearer ${clientToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('product_id', productId);
      expect(response.body[0]).toHaveProperty('quantity', 2);
    });
    
    test('Dovrebbe permettere all\'admin di accettare l\'ordine', async () => {
      const response = await request(app)
        .put(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'accepted'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Stato ordine aggiornato (admin)');
    });
    
    test('Dovrebbe permettere all\'admin di aggiornare l\'ordine a spedito', async () => {
      const response = await request(app)
        .put(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'shipped'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Stato ordine aggiornato (admin)');
    });
    
    test('Dovrebbe permettere al cliente di confermare la consegna', async () => {
      const response = await request(app)
        .put(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          status: 'delivered'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Stato ordine aggiornato');
    });
  });
  
  // Test per statistiche
  describe('Statistiche ordini', () => {
    test('Dovrebbe recuperare le statistiche delle vendite per un artigiano', async () => {
      const response = await request(app)
        .get('/orders/stats/sales?artisanId=3')
        .set('Authorization', `Bearer ${artisanToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Verifica la struttura delle statistiche
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('month');
        expect(response.body[0]).toHaveProperty('total_sales');
      }
    });
    
    test('Dovrebbe recuperare le statistiche degli ordini per un artigiano', async () => {
      const response = await request(app)
        .get('/orders/stats/orders?artisanId=3')
        .set('Authorization', `Bearer ${artisanToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Verifica la struttura delle statistiche
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('month');
        expect(response.body[0]).toHaveProperty('total_orders');
      }
    });
  });
  
  // Test per gli errori
  describe('Gestione degli errori', () => {
    test('Dovrebbe restituire 404 per un ordine inesistente', async () => {
      const response = await request(app)
        .get('/orders/9999/items')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(404);
    });
    
    test('Dovrebbe restituire 403 se un cliente tenta di vedere gli ordini di un altro cliente', async () => {
      const response = await request(app)
        .get('/orders?clientId=3')
        .set('Authorization', `Bearer ${clientToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Non hai i permessi per visualizzare questi ordini');
    });
    
    test('Dovrebbe restituire 400 per una transizione di stato non valida', async () => {
      // Crea un nuovo ordine per testare
      const createResponse = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          client_id: 2,
          total_price: 100.00,
          status: 'pending'
        });
      
      const newOrderId = createResponse.body.id;
      
      // Tenta una transizione non valida
      const response = await request(app)
        .put(`/orders/${newOrderId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          status: 'delivered' // Non valido da pending a delivered
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 