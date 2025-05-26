const request = require('supertest');
const app = require('../../Backend/app');
const db = require('../../Backend/db');

// Mock del database
jest.mock('../../Backend/db');

describe('Orders API', () => {
  // Mock di un token valido per i test
  const mockClientToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ2LCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNjE1NDcwMDAwfQ.mock-signature';
  const mockAdminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTYxNTQ3MDAwMH0.mock-signature';

  // Test per ottenere gli ordini dell'utente
  describe('GET /orders', () => {
    it('dovrebbe restituire gli ordini dell\'utente autenticato', async () => {
      // Mock per ottenere gli ordini
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 26,
            client_id: 46,
            total_price: '20.00',
            status: 'pending',
            created_at: '2025-05-20T14:49:23.000Z'
          }
        ]
      });
      
      const res = await request(app)
        .get('/orders?clientId=46')
        .set('Authorization', `Bearer ${mockClientToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBeTruthy();
      expect(res.body.data.length).toEqual(1);
      expect(res.body.data[0].id).toEqual(26);
      expect(res.body.data[0].client_id).toEqual(46);
    });

    it('non dovrebbe permettere all\'utente di vedere ordini di altri clienti', async () => {
      const res = await request(app)
        .get('/orders?clientId=47')
        .set('Authorization', `Bearer ${mockClientToken}`);
      
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('error');
    });

    it('dovrebbe permettere all\'admin di vedere tutti gli ordini', async () => {
      // Mock per ottenere tutti gli ordini
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 22,
            client_id: 47,
            total_price: '54.00',
            status: 'accepted',
            created_at: '2025-05-20T14:38:39.000Z'
          },
          {
            id: 26,
            client_id: 46,
            total_price: '20.00',
            status: 'pending',
            created_at: '2025-05-20T14:49:23.000Z'
          }
        ]
      });
      
      const res = await request(app)
        .get('/orders')
        .set('Authorization', `Bearer ${mockAdminToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBeTruthy();
      expect(res.body.data.length).toEqual(2);
    });
  });

  // Test per ottenere un ordine specifico
  describe('GET /orders/:id', () => {
    it('dovrebbe restituire i dettagli di un ordine', async () => {
      // Mock per ottenere l'ordine
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 26,
          client_id: 46,
          total_price: '20.00',
          status: 'pending',
          created_at: '2025-05-20T14:49:23.000Z'
        }]
      });
      // Mock per ottenere gli elementi dell'ordine
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 26,
          order_id: 26,
          product_id: 20,
          quantity: 1,
          unit_price: '20.00',
          product_name: 'Costine'
        }]
      });
      
      const res = await request(app)
        .get('/orders/26')
        .set('Authorization', `Bearer ${mockClientToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id', 26);
      expect(res.body.data).toHaveProperty('items');
      expect(Array.isArray(res.body.data.items)).toBeTruthy();
      expect(res.body.data.items.length).toEqual(1);
      expect(res.body.data.items[0].product_id).toEqual(20);
    });

    it('non dovrebbe permettere all\'utente di vedere ordini di altri clienti', async () => {
      // Mock per ottenere l'ordine di un altro cliente
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 22,
          client_id: 47,
          total_price: '54.00',
          status: 'accepted',
          created_at: '2025-05-20T14:38:39.000Z'
        }]
      });
      
      const res = await request(app)
        .get('/orders/22')
        .set('Authorization', `Bearer ${mockClientToken}`);
      
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('error');
    });
  });

  // Test per creare un nuovo ordine
  describe('POST /orders', () => {
    it('dovrebbe creare un nuovo ordine dal carrello', async () => {
      // Mock per ottenere il carrello
      db.query.mockResolvedValueOnce({
        rows: [{ id: 11, user_id: 46 }]
      });
      // Mock per ottenere gli elementi del carrello
      db.query.mockResolvedValueOnce({
        rows: [
          { 
            id: 62, 
            cart_id: 11, 
            product_id: 20, 
            quantity: 1,
            product_name: 'Costine',
            product_price: 20.00,
            product_discount: 0
          }
        ]
      });
      // Mock per verificare disponibilità prodotto
      db.query.mockResolvedValueOnce({
        rows: [{ id: 20, stock: 100 }]
      });
      // Mock per creare l'ordine
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 27,
          client_id: 46,
          total_price: '20.00',
          status: 'pending',
          created_at: '2025-05-20T15:00:00.000Z'
        }]
      });
      // Mock per creare gli elementi dell'ordine
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 27,
          order_id: 27,
          product_id: 20,
          quantity: 1,
          unit_price: '20.00'
        }]
      });
      // Mock per aggiornare lo stock
      db.query.mockResolvedValueOnce({ rows: [{ id: 20 }] });
      // Mock per svuotare il carrello
      db.query.mockResolvedValueOnce({ rows: [] });
      
      const res = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${mockClientToken}`)
        .send({
          delivery_info_id: 4
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id', 27);
      expect(res.body.data).toHaveProperty('status', 'pending');
      expect(res.body.data).toHaveProperty('total_price', '20.00');
    });

    it('dovrebbe restituire errore se il carrello è vuoto', async () => {
      // Mock per ottenere il carrello
      db.query.mockResolvedValueOnce({
        rows: [{ id: 11, user_id: 46 }]
      });
      // Mock per ottenere gli elementi del carrello (vuoto)
      db.query.mockResolvedValueOnce({
        rows: []
      });
      
      const res = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${mockClientToken}`)
        .send({
          delivery_info_id: 4
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  // Test per aggiornare lo stato di un ordine
  describe('PUT /orders/:id/status', () => {
    it('dovrebbe permettere all\'admin di aggiornare lo stato dell\'ordine', async () => {
      // Mock per ottenere l'ordine
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 26,
          client_id: 46,
          total_price: '20.00',
          status: 'pending',
          created_at: '2025-05-20T14:49:23.000Z'
        }]
      });
      // Mock per aggiornare lo stato
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 26,
          status: 'accepted'
        }]
      });
      
      const res = await request(app)
        .put('/orders/26/status')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({
          status: 'accepted'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id', 26);
      expect(res.body.data).toHaveProperty('status', 'accepted');
    });

    it('non dovrebbe permettere al cliente di aggiornare lo stato dell\'ordine', async () => {
      const res = await request(app)
        .put('/orders/26/status')
        .set('Authorization', `Bearer ${mockClientToken}`)
        .send({
          status: 'accepted'
        });
      
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('error');
    });
  });
}); 