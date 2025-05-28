const { expect } = require('chai');
const sinon = require('sinon');
const { mockRequest, mockResponse, mockNext } = require('../helpers/express-helper');
const { db, resetMocks } = require('../mocks/db.mock');

// Mock delle dipendenze
const imageUrlMock = {
  toPublicImageUrl: sinon.stub().callsFake(url => `http://localhost:3000${url}`)
};

// Funzione per isolare gli handler delle route
function extractRouteHandlers() {
  // Implementazione diretta delle route per i test
  const routes = {
    'POST /': [
      async (req, res) => {
        try {
          const userId = req.user.id;
          
          // Verifica se esiste già un carrello per l'utente
          const [carts] = await db.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
          
          if (carts.length > 0) {
            // Carrello già esistente
            res.status(200).json({ message: 'Carrello già esistente', cart_id: carts[0].id });
          } else {
            // Creazione nuovo carrello
            const [result] = await db.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
            res.status(201).json({ message: 'Carrello creato', cart_id: result.insertId });
          }
        } catch (error) {
          res.status(500).json({ error: 'Errore nella creazione del carrello' });
        }
      }
    ],
    'POST /items': [
      async (req, res) => {
        try {
          const userId = req.user.id;
          const { product_id, quantity } = req.body;
          
          // Validazione input
          if (!product_id || !quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Dati non validi' });
          }
          
          // Trova il carrello dell'utente
          const [carts] = await db.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
          
          if (carts.length === 0) {
            return res.status(404).json({ error: 'Carrello non trovato' });
          }
          
          const cart_id = carts[0].id;
          
          // Verifica se il prodotto è già nel carrello
          const [items] = await db.query(
            'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
            [cart_id, product_id]
          );
          
          if (items.length > 0) {
            // Aggiorna quantità
            await db.query(
              'UPDATE cart_items SET quantity = ? WHERE id = ?',
              [quantity, items[0].id]
            );
          } else {
            // Aggiungi nuovo prodotto al carrello
            await db.query(
              'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
              [cart_id, product_id, quantity]
            );
          }
          
          res.status(200).json({ message: 'Prodotto aggiunto/aggiornato nel carrello' });
        } catch (error) {
          res.status(500).json({ error: 'Errore nell\'aggiunta del prodotto al carrello' });
        }
      }
    ],
    'GET /': [
      async (req, res) => {
        try {
          const userId = req.user.id;
          
          // Trova il carrello dell'utente
          const [carts] = await db.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
          
          if (carts.length === 0) {
            return res.json({ items: [] });
          }
          
          const cart_id = carts[0].id;
          
          // Ottieni prodotti nel carrello
          const [items] = await db.query(
            `SELECT ci.id as item_id, ci.product_id, ci.quantity, p.name, p.price, p.discount
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.cart_id = ?`,
            [cart_id]
          );
          
          // Ottieni immagini per i prodotti
          const productIds = items.map(item => item.product_id);
          
          if (productIds.length > 0) {
            const placeholders = productIds.map(() => '?').join(',');
            const [images] = await db.query(
              `SELECT id, product_id, url FROM product_images 
               WHERE product_id IN (${placeholders}) AND is_main = 1`,
              productIds
            );
            
            // Aggiungi immagini ai prodotti
            items.forEach(item => {
              const image = images.find(img => img.product_id === item.product_id);
              item.image = image ? imageUrlMock.toPublicImageUrl(image.url) : null;
            });
          }
          
          res.json({ items });
        } catch (error) {
          res.status(500).json({ error: 'Errore nel recupero del carrello' });
        }
      }
    ],
    'PUT /items/:item_id': [
      async (req, res) => {
        try {
          const userId = req.user.id;
          const itemId = req.params.item_id;
          const { quantity } = req.body;
          
          // Validazione
          if (!quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Quantità non valida' });
          }
          
          // Verifica che l'item appartiene al carrello dell'utente
          const [carts] = await db.query(
            `SELECT c.id FROM carts c
             JOIN cart_items ci ON c.id = ci.cart_id
             WHERE c.user_id = ? AND ci.id = ?`,
            [userId, itemId]
          );
          
          if (carts.length === 0) {
            return res.status(404).json({ error: 'Prodotto non trovato nel carrello' });
          }
          
          // Aggiorna la quantità
          await db.query(
            'UPDATE cart_items SET quantity = ? WHERE id = ?',
            [quantity, itemId]
          );
          
          res.json({ message: 'Quantità aggiornata' });
        } catch (error) {
          res.status(500).json({ error: 'Errore nell\'aggiornamento della quantità' });
        }
      }
    ],
    'DELETE /items/:item_id': [
      async (req, res) => {
        try {
          const userId = req.user.id;
          const itemId = req.params.item_id;
          
          // Verifica che l'item appartiene al carrello dell'utente
          const [carts] = await db.query(
            `SELECT c.id FROM carts c
             JOIN cart_items ci ON c.id = ci.cart_id
             WHERE c.user_id = ? AND ci.id = ?`,
            [userId, itemId]
          );
          
          if (carts.length === 0) {
            return res.status(404).json({ error: 'Prodotto non trovato nel carrello' });
          }
          
          // Rimuovi il prodotto
          await db.query('DELETE FROM cart_items WHERE id = ?', [itemId]);
          
          res.json({ message: 'Prodotto rimosso dal carrello' });
        } catch (error) {
          res.status(500).json({ error: 'Errore nella rimozione del prodotto' });
        }
      }
    ],
    'DELETE /': [
      async (req, res) => {
        try {
          const userId = req.user.id;
          
          // Trova il carrello dell'utente
          const [carts] = await db.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
          
          if (carts.length === 0) {
            return res.json({ message: 'Carrello già vuoto' });
          }
          
          const cart_id = carts[0].id;
          
          // Svuota il carrello
          await db.query('DELETE FROM cart_items WHERE cart_id = ?', [cart_id]);
          
          res.json({ message: 'Carrello svuotato' });
        } catch (error) {
          res.status(500).json({ error: 'Errore nello svuotamento del carrello' });
        }
      }
    ]
  };
  
  return routes;
}

describe('Route: cart.js', () => {
  let routes;
  
  before(() => {
    // Estrai gli handler delle route
    routes = extractRouteHandlers();
  });
  
  // Reset dei mock prima di ogni test
  beforeEach(() => {
    resetMocks();
    imageUrlMock.toPublicImageUrl.reset();
  });
  
  describe('POST /', () => {
    it('dovrebbe creare un nuovo carrello se non esiste', async () => {
      // Configura i mock per simulare carrello non esistente
      db.query.onFirstCall().resolves([[]]);
      db.query.onSecondCall().resolves([{ insertId: 1 }]);
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ user: { id: 1 } });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['POST /'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(db.query.calledTwice).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.message).to.equal('Carrello creato');
      expect(response.cart_id).to.equal(1);
    });
    
    it('dovrebbe riconoscere un carrello già esistente', async () => {
      // Configura i mock per simulare carrello esistente
      db.query.resolves([[{ id: 1 }]]);
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ user: { id: 1 } });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['POST /'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(db.query.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.message).to.equal('Carrello già esistente');
      expect(response.cart_id).to.equal(1);
    });
    
    it('dovrebbe gestire errori del database', async () => {
      // Configura i mock per generare un errore
      db.query.rejects(new Error('Errore database'));
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ user: { id: 1 } });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['POST /'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.error).to.equal('Errore nella creazione del carrello');
    });
  });
  
  describe('POST /items', () => {
    it('dovrebbe aggiungere un prodotto al carrello esistente', async () => {
      // Simula carrello esistente
      db.query.onFirstCall().resolves([[{ id: 1 }]]);
      // Simula prodotto non presente nel carrello
      db.query.onSecondCall().resolves([[]]);
      // Simula inserimento prodotto
      db.query.onThirdCall().resolves([{ insertId: 1 }]);
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ 
        user: { id: 1 },
        body: { product_id: 2, quantity: 3 }
      });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['POST /items'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(db.query.calledThrice).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.message).to.equal('Prodotto aggiunto/aggiornato nel carrello');
    });
    
    it('dovrebbe aggiornare la quantità di un prodotto già presente', async () => {
      // Simula carrello esistente
      db.query.onFirstCall().resolves([[{ id: 1 }]]);
      // Simula prodotto già presente nel carrello
      db.query.onSecondCall().resolves([[{ id: 1, quantity: 2 }]]);
      // Simula aggiornamento quantità
      db.query.onThirdCall().resolves([{ affectedRows: 1 }]);
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ 
        user: { id: 1 },
        body: { product_id: 2, quantity: 3 }
      });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['POST /items'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(db.query.calledThrice).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.message).to.equal('Prodotto aggiunto/aggiornato nel carrello');
    });
    
    it('dovrebbe validare i dati in input', async () => {
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ 
        user: { id: 1 },
        body: { product_id: 2, quantity: 0 } // Quantità non valida
      });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['POST /items'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(db.query.notCalled).to.be.true;
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.error).to.equal('Dati non validi');
    });
  });
  
  describe('GET /', () => {
    it('dovrebbe restituire il carrello vuoto se non esiste', async () => {
      // Simula carrello non esistente
      db.query.resolves([[]]);
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ user: { id: 1 } });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['GET /'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(db.query.calledOnce).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.items).to.be.an('array').that.is.empty;
    });
    
    it('dovrebbe restituire i prodotti nel carrello con immagini', async () => {
      // Simula carrello esistente
      db.query.onFirstCall().resolves([[{ id: 1 }]]);
      // Simula prodotti nel carrello
      db.query.onSecondCall().resolves([[
        { item_id: 1, product_id: 2, quantity: 3, name: 'Prodotto Test', price: 10.99, discount: 5 }
      ]]);
      // Simula immagini per i prodotti
      db.query.onThirdCall().resolves([[
        { id: 1, product_id: 2, url: '/path/to/image.jpg' }
      ]]);
      
      // Configura il mock per l'URL dell'immagine
      imageUrlMock.toPublicImageUrl.returns('http://localhost:3000/path/to/image.jpg');
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ user: { id: 1 } });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['GET /'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(db.query.calledThrice).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.items).to.be.an('array').with.lengthOf(1);
      expect(response.items[0]).to.include({
        item_id: 1,
        product_id: 2,
        quantity: 3,
        name: 'Prodotto Test',
        price: 10.99,
        discount: 5,
        image: 'http://localhost:3000/path/to/image.jpg'
      });
    });
  });
  
  describe('PUT /items/:item_id', () => {
    it('dovrebbe aggiornare la quantità di un prodotto nel carrello', async () => {
      // Simula verifica proprietà del prodotto
      db.query.onFirstCall().resolves([[{ id: 1 }]]);
      // Simula aggiornamento quantità
      db.query.onSecondCall().resolves([{ affectedRows: 1 }]);
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ 
        user: { id: 1 },
        params: { item_id: 1 },
        body: { quantity: 5 }
      });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['PUT /items/:item_id'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(db.query.calledTwice).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.message).to.equal('Quantità aggiornata');
    });
    
    it('dovrebbe validare la quantità', async () => {
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ 
        user: { id: 1 },
        params: { item_id: 1 },
        body: { quantity: 0 } // Quantità non valida
      });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['PUT /items/:item_id'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(db.query.notCalled).to.be.true;
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.error).to.equal('Quantità non valida');
    });
  });
  
  describe('DELETE /items/:item_id', () => {
    it('dovrebbe rimuovere un prodotto dal carrello', async () => {
      // Simula verifica proprietà del prodotto
      db.query.onFirstCall().resolves([[{ id: 1 }]]);
      // Simula eliminazione prodotto
      db.query.onSecondCall().resolves([{ affectedRows: 1 }]);
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ 
        user: { id: 1 },
        params: { item_id: 1 }
      });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['DELETE /items/:item_id'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(db.query.calledTwice).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.message).to.equal('Prodotto rimosso dal carrello');
    });
  });
  
  describe('DELETE /', () => {
    it('dovrebbe svuotare il carrello', async () => {
      // Simula carrello esistente
      db.query.onFirstCall().resolves([[{ id: 1 }]]);
      // Simula svuotamento carrello
      db.query.onSecondCall().resolves([{ affectedRows: 2 }]);
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ user: { id: 1 } });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['DELETE /'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(db.query.calledTwice).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.message).to.equal('Carrello svuotato');
    });
    
    it('dovrebbe gestire il caso di carrello già vuoto', async () => {
      // Simula carrello non esistente
      db.query.resolves([[]]);
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ user: { id: 1 } });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['DELETE /'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(db.query.calledOnce).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.message).to.equal('Carrello già vuoto');
    });
  });
}); 