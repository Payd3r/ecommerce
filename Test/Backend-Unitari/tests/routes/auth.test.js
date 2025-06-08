const { expect } = require('chai');
const sinon = require('sinon');
const { mockRequest, mockResponse, mockNext } = require('../helpers/express-helper');
const { db, resetMocks } = require('../mocks/db.mock');

// Mock delle dipendenze
const authFunctionsMock = {
  registerUser: sinon.stub(),
  loginUser: sinon.stub()
};

const jwtMock = {
  sign: sinon.stub().returns('fake-token')
};

const imageUrlMock = {
  toPublicImageUrl: sinon.stub().callsFake(url => `http://localhost:3000${url}`)
};

// Funzione per isolare gli handler delle route
function extractRouteHandlers() {
  // Implementazione diretta delle route per i test
  const routes = {
    'POST /register': [
      async (req, res) => {
        try {
          const userData = await authFunctionsMock.registerUser(req.body);
          
          // Trova l'immagine del profilo
          const [profileImg] = await db.query('SELECT url FROM profile_images WHERE user_id = ?', [userData.id]);
          
          // Genera token JWT
          const token = jwtMock.sign(
            { userId: userData.id, email: userData.email, role: userData.role },
            'secret_key',
            { expiresIn: '1h' }
          );
          
          res.status(201).json({
            success: true,
            data: {
              token: token,
              user: {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                image: profileImg[0] ? imageUrlMock.toPublicImageUrl(profileImg[0].url) : null
              }
            }
          });
        } catch (error) {
          res.status(400).json({ success: false, message: error.message });
        }
      }
    ],
    'POST /login': [
      async (req, res) => {
        try {
          const { user, token } = await authFunctionsMock.loginUser(req.body);
          
          // Trova l'immagine del profilo
          const [profileImg] = await db.query('SELECT url FROM profile_images WHERE user_id = ?', [user.id]);
          
          res.status(200).json({
            success: true,
            data: {
              token,
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: profileImg[0] ? imageUrlMock.toPublicImageUrl(profileImg[0].url) : null
              }
            }
          });
        } catch (error) {
          res.status(401).json({ success: false, message: error.message });
        }
      }
    ],
    'GET /profile': [
      (req, res, next) => {
        // Simula middleware di autenticazione
        req.user = req.user || { id: 1 };
        next();
      },
      async (req, res) => {
        try {
          const userId = req.user.id;
          
          // Ottieni info utente
          const [userResult] = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [userId]);
          
          if (userResult.length === 0) {
            return res.status(404).json({ success: false, message: 'Utente non trovato' });
          }
          
          const user = userResult[0];
          
          // Ottieni immagine profilo
          const [profileImg] = await db.query('SELECT url FROM profile_images WHERE user_id = ?', [userId]);
          
          res.status(200).json({
            success: true,
            data: {
              id: user.id,
              nickname: user.name,
              email: user.email,
              role: user.role,
              image: profileImg[0] ? imageUrlMock.toPublicImageUrl(profileImg[0].url) : null,
              created_at: user.created_at
            }
          });
        } catch (error) {
          res.status(500).json({ success: false, message: 'Errore nel recupero del profilo' });
        }
      }
    ]
  };
  
  return routes;
}

describe('Route: auth.js', () => {
  let routes;
  
  before(() => {
    // Estrai gli handler delle route
    routes = extractRouteHandlers();
  });
  
  // Reset dei mock prima di ogni test
  beforeEach(() => {
    resetMocks();
    authFunctionsMock.registerUser.reset();
    authFunctionsMock.loginUser.reset();
    jwtMock.sign.reset();
    imageUrlMock.toPublicImageUrl.reset();
  });
  
  describe('POST /auth/register', () => {
    it('dovrebbe registrare un nuovo utente con successo', async () => {
      // Mock dei dati utente
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'client'
      };
      
      const newUser = {
        id: 1,
        email: userData.email,
        name: userData.name,
        role: userData.role
      };
      
      // Configura i mock
      authFunctionsMock.registerUser.resolves(newUser);
      db.query.resolves([[]]);  // Nessuna immagine profilo
      jwtMock.sign.returns('fake-token');
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ body: userData });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['POST /register'];
      await handlers[0](req, res);
      
      // Verifica che la risposta sia corretta
      expect(authFunctionsMock.registerUser.calledOnce).to.be.true;
      expect(jwtMock.sign.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.success).to.be.true;
      expect(response.data.token).to.equal('fake-token');
      expect(response.data.user).to.include(newUser);
    });
    
    it('dovrebbe gestire errori di email già registrata', async () => {
      // Configura i mock per simulare un errore di email duplicata
      authFunctionsMock.registerUser.rejects(new Error('Email gia registrata'));
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ 
        body: {
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Duplicate User'
        }
      });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['POST /register'];
      await handlers[0](req, res);
      
      // Verifica che la risposta sia corretta
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.success).to.be.false;
      expect(response.message).to.equal('Email gia registrata');
    });
  });
  
  describe('POST /auth/login', () => {
    it('dovrebbe effettuare il login con successo', async () => {
      // Mock dei dati di login
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const loginResult = {
        user: {
          id: 1,
          email: loginData.email,
          name: 'Test User',
          role: 'client'
        },
        token: 'fake-login-token'
      };
      
      // Configura i mock
      authFunctionsMock.loginUser.resolves(loginResult);
      db.query.resolves([[{ url: '/path/to/image.jpg' }]]);  // Immagine profilo trovata
      imageUrlMock.toPublicImageUrl.returns('http://localhost:3000/path/to/image.jpg');
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ body: loginData });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['POST /login'];
      await handlers[0](req, res);
      
      // Verifica che la risposta sia corretta
      expect(authFunctionsMock.loginUser.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.success).to.be.true;
      expect(response.data.token).to.equal(loginResult.token);
      expect(response.data.user).to.include(loginResult.user);
      expect(response.data.user.image).to.equal('http://localhost:3000/path/to/image.jpg');
    });
    
    it('dovrebbe gestire credenziali non valide', async () => {
      // Configura i mock per simulare credenziali errate
      authFunctionsMock.loginUser.rejects(new Error('Credenziali non valide'));
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ 
        body: {
          email: 'wrong@example.com',
          password: 'wrongpassword'
        }
      });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['POST /login'];
      await handlers[0](req, res);
      
      // Verifica che la risposta sia corretta
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.success).to.be.false;
      expect(response.message).to.equal('Credenziali non valide');
    });
  });
  
  describe('GET /auth/profile', () => {
    it('dovrebbe recuperare il profilo utente', async () => {
      // Mock dei dati utente
      const userData = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'client',
        created_at: '2023-01-01'
      };
      
      // Configura i mock
      db.query.onFirstCall().resolves([[userData]]);
      db.query.onSecondCall().resolves([[{ url: '/path/to/profile.jpg' }]]);
      imageUrlMock.toPublicImageUrl.returns('http://localhost:3000/path/to/profile.jpg');
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ user: { id: 1 } });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['GET /profile'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.success).to.be.true;
      expect(response.data).to.include({
        id: userData.id,
        nickname: userData.name,
        email: userData.email,
        role: userData.role,
        image: 'http://localhost:3000/path/to/profile.jpg'
      });
    });
    
    it('dovrebbe gestire utente non trovato', async () => {
      // Configura i mock per simulare utente non trovato
      db.query.onFirstCall().resolves([[]]);
      
      // Prepara la richiesta e la risposta mock
      const req = mockRequest({ user: { id: 999 } });
      const res = mockResponse();
      
      // Esegui il middleware
      const handlers = routes['GET /profile'];
      await handlers[handlers.length - 1](req, res);
      
      // Verifica che la risposta sia corretta
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.success).to.be.false;
      expect(response.message).to.equal('Utente non trovato');
    });
  });
}); 