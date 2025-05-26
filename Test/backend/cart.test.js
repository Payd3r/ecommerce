const request = require('supertest');
const app = require('../../Backend/app');
const db = require('../../Backend/db');

// Mock del database
jest.mock('../../Backend/db');

describe('Cart API', () => {
  // Mock di un token valido per i test
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ2LCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNjE1NDcwMDAwfQ.mock-signature';
  
  // Test per ottenere il carrello dell'utente
  describe('GET /cart', () => {
    it('dovrebbe restituire il carrello dell\'utente autenticato', async () => {
      // Mock per ottenere l'ID del carrello
      db.query.mockResolvedValueOnce({
        rows: [{ id: 11, user_id: 46 }]
      });
      // Mock per ottenere gli elementi del carrello
      db.query.mockResolvedValueOnce({
        rows: [
          { 
            id: 50, 
            cart_id: 11, 
            product_id: 27, 
            quantity: 2,
            product_name: 'Farina 00',
            product_price: 0.70,
            product_discount: 0
          },
          { 
            id: 51, 
            cart_id: 11, 
            product_id: 21, 
            quantity: 3,
            product_name: 'Tagliata',
            product_price: 15.00,
            product_discount: 0
          }
        ]
      });
      
      const res = await request(app)
        .get('/cart')
        .set('Authorization', `Bearer ${mockToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('items');
      expect(Array.isArray(res.body.data.items)).toBeTruthy();
      expect(res.body.data.items.length).toEqual(2);
      expect(res.body.data.items[0].product_id).toEqual(27);
      expect(res.body.data.items[1].product_id).toEqual(21);
    });

    it('dovrebbe richiedere autenticazione', async () => {
      const res = await request(app).get('/cart');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  // Test per aggiungere un prodotto al carrello
  describe('POST /cart/items', () => {
    it('dovrebbe aggiungere un prodotto al carrello', async () => {
      // Mock per ottenere l'ID del carrello
      db.query.mockResolvedValueOnce({
        rows: [{ id: 11, user_id: 46 }]
      });
      // Mock per verificare disponibilità prodotto
      db.query.mockResolvedValueOnce({
        rows: [{ id: 20, stock: 100, price: 20.00, discount: 0 }]
      });
      // Mock per verificare se il prodotto è già nel carrello
      db.query.mockResolvedValueOnce({ rows: [] });
      // Mock per l'aggiunta del prodotto
      db.query.mockResolvedValueOnce({
        rows: [{ 
          id: 62, 
          cart_id: 11, 
          product_id: 20, 
          quantity: 1 
        }]
      });
      
      const res = await request(app)
        .post('/cart/items')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          product_id: 20,
          quantity: 1
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id', 62);
      expect(res.body.data).toHaveProperty('product_id', 20);
      expect(res.body.data).toHaveProperty('quantity', 1);
    });

    it('dovrebbe aggiornare la quantità se il prodotto è già nel carrello', async () => {
      // Mock per ottenere l'ID del carrello
      db.query.mockResolvedValueOnce({
        rows: [{ id: 11, user_id: 46 }]
      });
      // Mock per verificare disponibilità prodotto
      db.query.mockResolvedValueOnce({
        rows: [{ id: 27, stock: 3, price: 0.70, discount: 0 }]
      });
      // Mock per verificare se il prodotto è già nel carrello
      db.query.mockResolvedValueOnce({
        rows: [{ id: 50, cart_id: 11, product_id: 27, quantity: 1 }]
      });
      // Mock per l'aggiornamento della quantità
      db.query.mockResolvedValueOnce({
        rows: [{ 
          id: 50, 
          cart_id: 11, 
          product_id: 27, 
          quantity: 2 
        }]
      });
      
      const res = await request(app)
        .post('/cart/items')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          product_id: 27,
          quantity: 1
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id', 50);
      expect(res.body.data).toHaveProperty('quantity', 2);
    });
  });

  // Test per aggiornare la quantità di un prodotto nel carrello
  describe('PUT /cart/items/:itemId', () => {
    it('dovrebbe aggiornare la quantità di un prodotto nel carrello', async () => {
      // Mock per ottenere l'elemento del carrello
      db.query.mockResolvedValueOnce({
        rows: [{ 
          id: 50, 
          cart_id: 11, 
          product_id: 27, 
          quantity: 2 
        }]
      });
      // Mock per verificare che il carrello appartiene all'utente
      db.query.mockResolvedValueOnce({
        rows: [{ user_id: 46 }]
      });
      // Mock per verificare disponibilità prodotto
      db.query.mockResolvedValueOnce({
        rows: [{ id: 27, stock: 3 }]
      });
      // Mock per l'aggiornamento della quantità
      db.query.mockResolvedValueOnce({
        rows: [{ 
          id: 50, 
          cart_id: 11, 
          product_id: 27, 
          quantity: 3 
        }]
      });
      
      const res = await request(app)
        .put('/cart/items/50')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          quantity: 3
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id', 50);
      expect(res.body.data).toHaveProperty('quantity', 3);
    });
  });

  // Test per rimuovere un prodotto dal carrello
  describe('DELETE /cart/items/:itemId', () => {
    it('dovrebbe rimuovere un prodotto dal carrello', async () => {
      // Mock per ottenere l'elemento del carrello
      db.query.mockResolvedValueOnce({
        rows: [{ id: 50, cart_id: 11, product_id: 27 }]
      });
      // Mock per verificare che il carrello appartiene all'utente
      db.query.mockResolvedValueOnce({
        rows: [{ user_id: 46 }]
      });
      // Mock per la rimozione dell'elemento
      db.query.mockResolvedValueOnce({
        rows: [{ id: 50 }]
      });
      
      const res = await request(app)
        .delete('/cart/items/50')
        .set('Authorization', `Bearer ${mockToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id', 50);
    });
  });
}); 