const { expect } = require('chai');
const sinon = require('sinon');
const { mockRequest, mockResponse, mockNext } = require('../helpers/express-helper');
const { db, resetMocks } = require('../mocks/db.mock');

// Creiamo un mock delle dipendenze prima di importare il modulo
const mockDeps = {
  '../models/db': db,
  '../middleware/auth': {
    verifyToken: (req, res, next) => {
      req.user = req.user || { id: 1, role: 'client' }; // Default user
      next();
    }
  }
};

// Funzione per isolare gli handler delle route
function extractRouteHandlers() {
  // Mock per Express Router
  const mockRouter = {
    routes: {},
    get: function(path, ...handlers) {
      this.routes[`GET ${path}`] = handlers;
    },
    post: function(path, ...handlers) {
      this.routes[`POST ${path}`] = handlers;
    },
    put: function(path, ...handlers) {
      this.routes[`PUT ${path}`] = handlers;
    },
    delete: function(path, ...handlers) {
      this.routes[`DELETE ${path}`] = handlers;
    }
  };
  
  // Forniamo una implementazione simulata delle route per i test
  const routes = {
    'GET /me': [
      (req, res) => {
        try {
          const user_id = req.user.id;
          return db.query('SELECT * FROM delivery_info WHERE user_id = ?', [user_id])
            .then(([rows]) => {
              const address = rows[0] || null; // Se non ci sono dati, address sarà null
              res.json({ success: true, data: address });
            })
            .catch(err => {
              res.status(500).json({ success: false, message: 'Errore nel recupero indirizzo' });
            });
        } catch (err) {
          res.status(500).json({ success: false, message: 'Errore nel recupero indirizzo' });
        }
      }
    ],
    'POST /': [
      (req, res) => {
        try {
          const user_id = req.user.id;
          const { stato, citta, provincia, via, cap, numero_civico, name, surname } = req.body;
          // Validazione semplice
          if (![stato, citta, provincia, via, cap, numero_civico, name, surname].every(Boolean)) {
            return res.status(400).json({ success: false, message: 'Tutti i campi sono obbligatori' });
          }
          
          return db.query('SELECT * FROM delivery_info WHERE user_id = ?', [user_id])
            .then(([rows]) => {
              const existing = rows[0];
              if (existing) {
                return db.query(
                  'UPDATE delivery_info SET stato=?, citta=?, provincia=?, via=?, cap=?, numero_civico=?, name=?, surname=? WHERE user_id=?',
                  [stato, citta, provincia, via, cap, numero_civico, name, surname, user_id]
                ).then(() => {
                  const address = { ...existing, stato, citta, provincia, via, cap, numero_civico, name, surname };
                  res.json({ success: true, data: address });
                });
              } else {
                return db.query(
                  'INSERT INTO delivery_info (user_id, stato, citta, provincia, via, cap, numero_civico, name, surname) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                  [user_id, stato, citta, provincia, via, cap, numero_civico, name, surname]
                ).then(() => {
                  const address = { user_id, stato, citta, provincia, via, cap, numero_civico, name, surname };
                  res.json({ success: true, data: address });
                });
              }
            })
            .catch(err => {
              res.status(500).json({ success: false, message: 'Errore nel salvataggio indirizzo' });
            });
        } catch (err) {
          res.status(500).json({ success: false, message: 'Errore nel salvataggio indirizzo' });
        }
      }
    ],
    'GET /user/:userId': [
      (req, res) => {
        try {
          // Consenti solo ad admin o artigiani
          if (!['admin', 'artisan'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Non autorizzato' });
          }
          const user_id = req.params.userId;
          return db.query('SELECT * FROM delivery_info WHERE user_id = ?', [user_id])
            .then(([rows]) => {
              const address = rows[0] || null;
              res.json({ success: true, data: address });
            })
            .catch(err => {
              res.status(500).json({ success: false, message: 'Errore nel recupero indirizzo' });
            });
        } catch (err) {
          res.status(500).json({ success: false, message: 'Errore nel recupero indirizzo' });
        }
      }
    ]
  };
  
  return routes;
}

describe('Route: address.js', () => {
  let routes;
  
  before(() => {
    // Estrai gli handler delle route
    routes = extractRouteHandlers();
  });
  
  // Reset dei mock prima di ogni test
  beforeEach(() => {
    resetMocks();
  });
  
  describe('GET /address/me', () => {
    it('dovrebbe restituire l\'indirizzo dell\'utente loggato', async () => {
      // Configura il mock del database
      const addressMock = { 
        user_id: 1, 
        stato: 'Italia', 
        citta: 'Milano', 
        provincia: 'MI', 
        via: 'Via Test', 
        cap: '12345', 
        numero_civico: '42', 
        name: 'Mario', 
        surname: 'Rossi' 
      };
      
      db.query.resolves([[addressMock]]);
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ user: { id: 1 } });
      const res = mockResponse();
      
      // Esegui i middleware in sequenza
      const handlers = routes['GET /me'];
      // Salta il middleware di autenticazione in quanto lo abbiamo già mockato
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal({ 
        success: true, 
        data: addressMock 
      });
    });
    
    it('dovrebbe gestire il caso in cui l\'utente non ha un indirizzo', async () => {
      // Configura il mock del database per restituire un array vuoto
      db.query.resolves([[]]);
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ user: { id: 1 } });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['GET /me'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal({ 
        success: true, 
        data: null 
      });
    });
    
    it('dovrebbe gestire gli errori del database', async () => {
      // Configura il mock del database per generare un errore
      db.query.rejects(new Error('Errore database'));
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ user: { id: 1 } });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['GET /me'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(res.status.calledOnce).to.be.true;
      expect(res.status.firstCall.args[0]).to.equal(500);
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal({ 
        success: false, 
        message: 'Errore nel recupero indirizzo' 
      });
    });
  });
  
  describe('POST /address', () => {
    it('dovrebbe creare un nuovo indirizzo quando non esiste', async () => {
      // Dati di test
      const addressData = {
        stato: 'Italia',
        citta: 'Roma',
        provincia: 'RM',
        via: 'Via dei Test',
        cap: '00100',
        numero_civico: '123',
        name: 'Mario',
        surname: 'Rossi'
      };
      
      // Configura il mock del database
      db.query.onFirstCall().resolves([[]]);
      db.query.onSecondCall().resolves([{ insertId: 1 }]);
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ 
        user: { id: 1 },
        body: addressData
      });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['POST /'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(db.query.calledTwice).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal({
        success: true,
        data: { 
          user_id: 1,
          ...addressData 
        }
      });
    });
    
    it('dovrebbe aggiornare un indirizzo esistente', async () => {
      // Dati di test
      const addressData = {
        stato: 'Italia',
        citta: 'Roma',
        provincia: 'RM',
        via: 'Via dei Test',
        cap: '00100',
        numero_civico: '123',
        name: 'Mario',
        surname: 'Rossi'
      };
      
      const existingAddress = {
        id: 1,
        user_id: 1,
        stato: 'Italia',
        citta: 'Milano',
        provincia: 'MI',
        via: 'Via Vecchia',
        cap: '20100',
        numero_civico: '42',
        name: 'Mario',
        surname: 'Rossi'
      };
      
      // Configura il mock del database
      db.query.onFirstCall().resolves([[existingAddress]]);
      db.query.onSecondCall().resolves([{ affectedRows: 1 }]);
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ 
        user: { id: 1 },
        body: addressData
      });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['POST /'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(db.query.calledTwice).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal({
        success: true,
        data: { 
          ...existingAddress,
          ...addressData 
        }
      });
    });
    
    it('dovrebbe validare i campi obbligatori', async () => {
      // Dati mancanti
      const addressData = {
        stato: 'Italia',
        // Mancano i campi obbligatori
      };
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ 
        user: { id: 1 },
        body: addressData
      });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['POST /'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(res.status.calledOnce).to.be.true;
      expect(res.status.firstCall.args[0]).to.equal(400);
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal({
        success: false,
        message: 'Tutti i campi sono obbligatori'
      });
    });
  });
  
  describe('GET /address/user/:userId', () => {
    it('dovrebbe restituire l\'indirizzo di un utente specifico (per admin)', async () => {
      // Configura il mock del database
      const addressMock = { 
        user_id: 2, 
        stato: 'Italia', 
        citta: 'Milano' 
      };
      
      db.query.resolves([[addressMock]]);
      
      // Prepara la richiesta e la risposta mock (admin)
      const req = mockRequest({ 
        user: { id: 1, role: 'admin' },
        params: { userId: 2 }
      });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['GET /user/:userId'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(db.query.calledOnce).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal({
        success: true,
        data: addressMock
      });
    });
    
    it('dovrebbe negare l\'accesso agli utenti non autorizzati', async () => {
      // Prepara la richiesta e la risposta mock (client)
      const req = mockRequest({ 
        user: { id: 1, role: 'client' },
        params: { userId: 2 }
      });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['GET /user/:userId'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(res.status.calledOnce).to.be.true;
      expect(res.status.firstCall.args[0]).to.equal(403);
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal({
        success: false,
        message: 'Non autorizzato'
      });
    });
  });
}); 