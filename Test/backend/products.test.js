const request = require('supertest');
const app = require('../../Backend/app');
const db = require('../../Backend/db');

// Mock del database
jest.mock('../../Backend/db');

describe('Products API', () => {
  // Mock di un prodotto per i test
  const testProduct = {
    id: 1,
    artisan_id: 41,
    name: 'Prodotto Test',
    description: 'Descrizione del prodotto di test',
    price: 10.99,
    discount: 0,
    stock: 100,
    category_id: 21
  };

  // Test per ottenere tutti i prodotti
  describe('GET /products', () => {
    it('dovrebbe restituire la lista dei prodotti', async () => {
      // Mock della risposta del database
      db.query.mockResolvedValueOnce({
        rows: [testProduct, {
          id: 2,
          artisan_id: 42,
          name: 'Altro Prodotto',
          description: 'Altra descrizione',
          price: 20.50,
          discount: 5,
          stock: 50,
          category_id: 22
        }]
      });
      
      const res = await request(app).get('/products');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBeTruthy();
      expect(res.body.data.length).toEqual(2);
    });

    it('dovrebbe filtrare i prodotti per categoria', async () => {
      // Mock della risposta del database
      db.query.mockResolvedValueOnce({
        rows: [testProduct]
      });
      
      const res = await request(app).get('/products?category=21');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBeTruthy();
      expect(res.body.data.length).toEqual(1);
      expect(res.body.data[0].category_id).toEqual(21);
    });
  });

  // Test per ottenere un prodotto specifico
  describe('GET /products/:id', () => {
    it('dovrebbe restituire un prodotto specifico', async () => {
      // Mock della risposta del database per il prodotto
      db.query.mockResolvedValueOnce({
        rows: [testProduct]
      });
      // Mock della risposta per le immagini del prodotto
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          product_id: 1,
          url: '/path/to/image.jpg',
          alt_text: 'Immagine prodotto'
        }]
      });
      
      const res = await request(app).get('/products/1');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.id).toEqual(1);
      expect(res.body.data.name).toEqual('Prodotto Test');
      expect(res.body.data).toHaveProperty('images');
    });

    it('dovrebbe restituire 404 per prodotto non esistente', async () => {
      // Mock della risposta vuota del database
      db.query.mockResolvedValueOnce({ rows: [] });
      
      const res = await request(app).get('/products/999');
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  // Test per creare un nuovo prodotto
  describe('POST /products', () => {
    it('dovrebbe creare un nuovo prodotto', async () => {
      // Mock per l'inserimento del prodotto
      db.query.mockResolvedValueOnce({
        rows: [testProduct]
      });
      
      // Token mock per autenticazione
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQxLCJyb2xlIjoiYXJ0aXNhbiIsImlhdCI6MTYxNTQ3MDAwMH0.mock-signature';
      
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          name: 'Nuovo Prodotto',
          description: 'Descrizione del nuovo prodotto',
          price: 15.99,
          category_id: 21,
          stock: 50
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.name).toEqual('Prodotto Test');
    });

    it('dovrebbe richiedere autenticazione', async () => {
      const res = await request(app)
        .post('/products')
        .send({
          name: 'Nuovo Prodotto',
          description: 'Descrizione del nuovo prodotto',
          price: 15.99,
          category_id: 21,
          stock: 50
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  // Test per aggiornare un prodotto
  describe('PUT /products/:id', () => {
    it('dovrebbe aggiornare un prodotto esistente', async () => {
      // Mock per ottenere il prodotto esistente
      db.query.mockResolvedValueOnce({
        rows: [{ ...testProduct, artisan_id: 41 }]
      });
      // Mock per l'aggiornamento
      db.query.mockResolvedValueOnce({
        rows: [{ ...testProduct, name: 'Prodotto Aggiornato', price: 12.99 }]
      });
      
      // Token mock per autenticazione
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQxLCJyb2xlIjoiYXJ0aXNhbiIsImlhdCI6MTYxNTQ3MDAwMH0.mock-signature';
      
      const res = await request(app)
        .put('/products/1')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          name: 'Prodotto Aggiornato',
          price: 12.99
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.name).toEqual('Prodotto Aggiornato');
      expect(res.body.data.price).toEqual(12.99);
    });
  });

  // Test per eliminare un prodotto
  describe('DELETE /products/:id', () => {
    it('dovrebbe eliminare un prodotto', async () => {
      // Mock per ottenere il prodotto esistente
      db.query.mockResolvedValueOnce({
        rows: [{ ...testProduct, artisan_id: 41 }]
      });
      // Mock per l'eliminazione
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1 }]
      });
      
      // Token mock per autenticazione
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQxLCJyb2xlIjoiYXJ0aXNhbiIsImlhdCI6MTYxNTQ3MDAwMH0.mock-signature';
      
      const res = await request(app)
        .delete('/products/1')
        .set('Authorization', `Bearer ${mockToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.id).toEqual(1);
    });
  });
}); 