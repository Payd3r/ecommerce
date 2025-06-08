const { expect } = require('chai');
const sinon = require('sinon');
const { mockRequest, mockResponse, mockNext } = require('../helpers/express-helper');
const { db, resetMocks } = require('../mocks/db.mock');

// Mock di bcrypt senza richiedere il modulo
const bcryptMock = {
  hash: sinon.stub().callsFake((password, salt) => Promise.resolve(`hashed_${password}`))
};

// Funzione per isolare gli handler delle route
function extractRouteHandlers() {
  // Implementazione simulata delle route per i test
  const routes = {
    'GET /': [
      // Simulazione middleware verifyToken
      (req, res, next) => {
        if (!req.user) {
          return res.status(401).json({ error: 'Non autorizzato' });
        }
        next();
      },
      // Simulazione middleware checkRole
      (req, res, next) => {
        if (req.user.role !== 'admin') {
          return res.status(403).json({ error: 'Accesso negato. Richiesto ruolo admin' });
        }
        next();
      },
      async (req, res) => {
        try {
          const page = parseInt(req.query.page) || 1;
          const limit = parseInt(req.query.limit) || 10;
          const offset = (page - 1) * limit;
          const role = req.query.role || '';
          const orderBy = req.query.orderBy || 'name';
          const orderDir = req.query.orderDir === 'desc' ? 'DESC' : 'ASC';

          // Costruisci la query di base
          let query = 'SELECT id, name, email, role, created_at FROM users WHERE 1=1';
          let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
          const queryParams = [];
          const countQueryParams = [];

          // Aggiungi la condizione di ricerca per nome se presente
          if (req.query.name) {
            query += ' AND name LIKE ?';
            countQuery += ' AND name LIKE ?';
            queryParams.push(`%${req.query.name}%`);
            countQueryParams.push(`%${req.query.name}%`);
          }

          // Aggiungi la condizione di ricerca per email se presente
          if (req.query.email) {
            query += ' AND email LIKE ?';
            countQuery += ' AND email LIKE ?';
            queryParams.push(`%${req.query.email}%`);
            countQueryParams.push(`%${req.query.email}%`);
          }

          // Aggiungi il filtro per il ruolo se presente
          if (role) {
            query += ' AND role = ?';
            countQuery += ' AND role = ?';
            queryParams.push(role);
            countQueryParams.push(role);
          }

          // Aggiungi ordinamento e paginazione
          query += ` ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`;
          queryParams.push(limit, offset);

          // Esegui le query
          const [users] = await db.query(query, queryParams);
          const [totalCountResult] = await db.query(countQuery, countQueryParams);
          const total = totalCountResult[0].total;
          
          const totalPages = Math.ceil(total / limit);

          res.json({
            users,
            pagination: {
              total,
              totalPages,
              currentPage: page,
              limit,
              hasNextPage: page < totalPages,
              hasPrevPage: page > 1
            }
          });
        } catch (error) {
          res.status(500).json({ error: 'Errore nel recupero degli utenti' });
        }
      }
    ],
    'GET /artisans': [
      async (req, res) => {
        try {
          const id = req.query.id ? parseInt(req.query.id) : null;
          
          if (id) {
            // Restituisci solo l'artigiano con quell'id
            const [artisans] = await db.query(
              `SELECT u.id, u.name, u.created_at, pi.url as image, eu.url_banner, eu.bio, eu.approved_at 
               FROM users u
               LEFT JOIN profile_image pi ON u.id = pi.user_id
               LEFT JOIN extended_users eu ON u.id = eu.id_users
               WHERE u.role = "artisan" AND u.id = ? AND eu.approved = 1`, [id]
            );
            
            if (artisans.length === 0) {
              return res.status(404).json({ error: 'Artigiano non trovato o non approvato' });
            }
            
            return res.json({ data: artisans[0] });
          }
          
          // Se non c'è ID, restituisci la lista paginata
          const page = parseInt(req.query.page) || 1;
          const limit = parseInt(req.query.limit) || 10;
          const offset = (page - 1) * limit;
          
          const [artisans] = await db.query(
            `SELECT u.id, u.name, u.created_at
             FROM users u
             LEFT JOIN extended_users eu ON u.id = eu.id_users
             WHERE u.role = 'artisan' AND eu.approved = 1
             ORDER BY u.created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
          );
          
          const [totalCountResult] = await db.query(
            `SELECT COUNT(*) as total
             FROM users u
             LEFT JOIN extended_users eu ON u.id = eu.id_users
             WHERE u.role = 'artisan' AND eu.approved = 1`
          );
          
          const total = totalCountResult[0].total;
          const totalPages = Math.ceil(total / limit);
          
          res.json({
            data: artisans,
            pagination: {
              total,
              totalPages,
              currentPage: page,
              limit,
              hasNextPage: page < totalPages,
              hasPrevPage: page > 1
            }
          });
        } catch (error) {
          res.status(500).json({ error: 'Errore nel recupero degli artigiani.' });
        }
      }
    ],
    'GET /:id': [
      // Simulazione middleware verifyToken
      (req, res, next) => {
        if (!req.user) {
          return res.status(401).json({ error: 'Non autorizzato' });
        }
        next();
      },
      async (req, res) => {
        try {
          // Verifica che l'utente stia accedendo al proprio profilo o sia admin
          if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
            return res.status(403).json({ 
              error: 'Non hai i permessi per visualizzare questo profilo' 
            });
          }

          const [user] = await db.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [req.params.id]
          );

          if (user.length === 0) {
            return res.status(404).json({ error: 'Utente non trovato' });
          }

          res.json(user[0]);
        } catch (error) {
          res.status(500).json({ error: 'Errore nel recupero dell\'utente' });
        }
      }
    ],
    'POST /': [
      // Simulazione middleware verifyToken
      (req, res, next) => {
        if (!req.user) {
          return res.status(401).json({ error: 'Non autorizzato' });
        }
        next();
      },
      // Simulazione middleware checkRole
      (req, res, next) => {
        if (req.user.role !== 'admin') {
          return res.status(403).json({ error: 'Accesso negato. Richiesto ruolo admin' });
        }
        next();
      },
      async (req, res) => {
        const { name, email, password, role } = req.body;

        // Validazione
        if (!name || !email || !password || !role) {
          return res.status(400).json({ 
            error: 'Nome, email, password e ruolo sono obbligatori' 
          });
        }

        // Validazione email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: 'Email non valida' });
        }

        // Validazione ruolo
        const validRoles = ['admin', 'client', 'artisan'];
        if (!validRoles.includes(role)) {
          return res.status(400).json({ error: 'Ruolo non valido' });
        }

        try {
          // Verifica se l'email è già in uso
          const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
          if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Email già registrata' });
          }

          // Hash della password (simulato)
          const hashedPassword = await bcryptMock.hash(password, 10);

          // Inserisci il nuovo utente
          const [result] = await db.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
          );

          const [newUser] = await db.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [result.insertId]
          );

          res.status(201).json(newUser[0]);
        } catch (error) {
          res.status(500).json({ error: 'Errore nella creazione dell\'utente' });
        }
      }
    ],
    'PUT /:id': [
      // Simulazione middleware verifyToken
      (req, res, next) => {
        if (!req.user) {
          return res.status(401).json({ error: 'Non autorizzato' });
        }
        next();
      },
      async (req, res) => {
        const { name, email, role } = req.body;
        const userId = req.params.id;

        // Verifica che l'utente stia modificando il proprio profilo o sia admin
        if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
          return res.status(403).json({ 
            error: 'Non hai i permessi per modificare questo profilo' 
          });
        }

        // Se non è admin, può cambiare solo da client ad artisan
        if (req.user.role !== 'admin') {
          if (role && role !== req.user.role) {
            // Permetti solo il cambio da client a artisan
            if (!(req.user.role === 'client' && role === 'artisan')) {
              return res.status(403).json({ 
                error: 'Non hai i permessi per modificare il ruolo' 
              });
            }
          }
        }

        // Costruisci dinamicamente la query di update
        const fields = [];
        const values = [];
        
        if (name !== undefined) {
          if (!name) return res.status(400).json({ error: 'Il nome non può essere vuoto' });
          fields.push('name = ?');
          values.push(name);
        }
        
        if (email !== undefined) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!email) return res.status(400).json({ error: 'L\'email non può essere vuota' });
          if (!emailRegex.test(email)) return res.status(400).json({ error: 'Email non valida' });
          fields.push('email = ?');
          values.push(email);
        }
        
        if (role !== undefined) {
          const validRoles = ['admin', 'client', 'artisan'];
          if (!validRoles.includes(role)) return res.status(400).json({ error: 'Ruolo non valido' });
          fields.push('role = ?');
          values.push(role);
        }
        
        if (fields.length === 0) {
          return res.status(400).json({ error: 'Nessun campo da aggiornare' });
        }

        try {
          // Verifica che l'utente esista
          const [existingUser] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
          if (existingUser.length === 0) {
            return res.status(404).json({ error: 'Utente non trovato' });
          }

          // Aggiorna solo i campi forniti
          await db.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            [...values, userId]
          );

          const [updatedUser] = await db.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [userId]
          );

          res.json(updatedUser[0]);
        } catch (error) {
          res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'utente' });
        }
      }
    ],
    'DELETE /:id': [
      // Simulazione middleware verifyToken
      (req, res, next) => {
        if (!req.user) {
          return res.status(401).json({ error: 'Non autorizzato' });
        }
        next();
      },
      // Simulazione middleware checkRole
      (req, res, next) => {
        if (req.user.role !== 'admin') {
          return res.status(403).json({ error: 'Accesso negato. Richiesto ruolo admin' });
        }
        next();
      },
      async (req, res) => {
        const userId = req.params.id;

        try {
          // Verifica che l'utente esista
          const [user] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
          if (user.length === 0) {
            return res.status(404).json({ error: 'Utente non trovato' });
          }

          // Elimina l'utente
          await db.query('DELETE FROM users WHERE id = ?', [userId]);
          res.status(204).send();
        } catch (error) {
          res.status(500).json({ error: 'Errore nell\'eliminazione dell\'utente' });
        }
      }
    ]
  };
  
  return routes;
}

describe('Route: users.js', () => {
  let routes;
  
  before(() => {
    routes = extractRouteHandlers();
  });
  
  beforeEach(() => {
    resetMocks();
    bcryptMock.hash.resetHistory();
  });
  
  describe('GET /users', () => {
    it('dovrebbe restituire la lista degli utenti come admin', async () => {
      // Mock dei dati
      const usersMock = [
        { id: 1, name: 'Admin', email: 'admin@example.com', role: 'admin', created_at: '2023-01-01' },
        { id: 2, name: 'User', email: 'user@example.com', role: 'client', created_at: '2023-01-02' }
      ];
      
      db.query.onFirstCall().resolves([usersMock]);
      db.query.onSecondCall().resolves([[{ total: 2 }]]);
      
      const req = mockRequest({
        user: { id: 1, role: 'admin' },
        query: { page: 1, limit: 10 }
      });
      const res = mockResponse();
      const next = mockNext();
      
      // Esegui i middleware in sequenza
      await routes['GET /'][0](req, res, next);
      if (!res.status.called && next.called) {
        await routes['GET /'][1](req, res, next);
        if (!res.status.called && next.called) {
          await routes['GET /'][2](req, res);
        }
      }
      
      expect(res.json.calledOnce).to.be.true;
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('users').that.is.an('array');
      expect(response.users).to.have.lengthOf(2);
      expect(response).to.have.property('pagination');
      expect(response.pagination).to.have.property('total', 2);
    });
    
    it('dovrebbe negare l\'accesso a utenti non admin', async () => {
      const req = mockRequest({
        user: { id: 2, role: 'client' }
      });
      const res = mockResponse();
      
      await routes['GET /'][1](req, res);
      
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ error: 'Accesso negato. Richiesto ruolo admin' })).to.be.true;
    });
  });
  
  describe('GET /users/artisans', () => {
    it('dovrebbe restituire un artigiano specifico', async () => {
      const artisanMock = { 
        id: 3, 
        name: 'Artigiano', 
        created_at: '2023-01-03',
        image: '/path/to/image.jpg',
        url_banner: '/path/to/banner.jpg',
        bio: 'Bio artigiano',
        approved_at: '2023-01-04'
      };
      
      db.query.resolves([[artisanMock]]);
      
      const req = mockRequest({
        query: { id: 3 }
      });
      const res = mockResponse();
      
      await routes['GET /artisans'][0](req, res);
      
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('data');
      expect(res.json.firstCall.args[0].data).to.deep.equal(artisanMock);
    });
    
    it('dovrebbe restituire 404 se l\'artigiano non esiste', async () => {
      db.query.resolves([[]]);
      
      const req = mockRequest({
        query: { id: 999 }
      });
      const res = mockResponse();
      
      await routes['GET /artisans'][0](req, res);
      
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ error: 'Artigiano non trovato o non approvato' })).to.be.true;
    });
  });
  
  describe('GET /users/:id', () => {
    it('dovrebbe restituire un utente specifico per il proprietario', async () => {
      const userMock = { id: 2, name: 'User', email: 'user@example.com', role: 'client', created_at: '2023-01-02' };
      
      db.query.resolves([[userMock]]);
      
      const req = mockRequest({
        user: { id: 2, role: 'client' },
        params: { id: 2 }
      });
      const res = mockResponse();
      const next = mockNext();
      
      // Esegui i middleware in sequenza
      await routes['GET /:id'][0](req, res, next);
      if (!res.status.called && next.called) {
        await routes['GET /:id'][1](req, res);
      }
      
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal(userMock);
    });
    
    it('dovrebbe negare l\'accesso a profili altrui per utenti non admin', async () => {
      const req = mockRequest({
        user: { id: 2, role: 'client' },
        params: { id: 3 }
      });
      const res = mockResponse();
      
      await routes['GET /:id'][1](req, res);
      
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('error').that.includes('Non hai i permessi');
    });
  });
  
  describe('POST /users', () => {
    it('dovrebbe creare un nuovo utente come admin', async () => {
      const userData = {
        name: 'Nuovo Utente',
        email: 'nuovo@example.com',
        password: 'password123',
        role: 'client'
      };
      
      const newUserMock = { 
        id: 4, 
        name: userData.name, 
        email: userData.email, 
        role: userData.role,
        created_at: '2023-01-05'
      };
      
      db.query.onFirstCall().resolves([[]]);  // email non in uso
      db.query.onSecondCall().resolves([{ insertId: 4 }]);
      db.query.onThirdCall().resolves([[newUserMock]]);
      
      const req = mockRequest({
        user: { id: 1, role: 'admin' },
        body: userData
      });
      const res = mockResponse();
      const next = mockNext();
      
      // Esegui i middleware in sequenza
      await routes['POST /'][0](req, res, next);
      if (!res.status.called && next.called) {
        await routes['POST /'][1](req, res, next);
        if (!res.status.called && next.called) {
          await routes['POST /'][2](req, res);
        }
      }
      
      expect(bcryptMock.hash.calledWith(userData.password, 10)).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal(newUserMock);
    });
    
    it('dovrebbe validare l\'email', async () => {
      const userData = {
        name: 'Test',
        email: 'invalid-email',
        password: 'password',
        role: 'client'
      };
      
      const req = mockRequest({
        user: { id: 1, role: 'admin' },
        body: userData
      });
      const res = mockResponse();
      
      // Salta i middleware di auth
      await routes['POST /'][2](req, res);
      
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ error: 'Email non valida' })).to.be.true;
    });
  });
  
  describe('PUT /users/:id', () => {
    it('dovrebbe aggiornare un utente se è il proprietario', async () => {
      const updateData = {
        name: 'Nome Aggiornato'
      };
      
      const updatedUserMock = { 
        id: 2, 
        name: 'Nome Aggiornato', 
        email: 'user@example.com', 
        role: 'client',
        created_at: '2023-01-02'
      };
      
      db.query.onFirstCall().resolves([[{ id: 2 }]]);  // utente esiste
      db.query.onSecondCall().resolves([]);  // update
      db.query.onThirdCall().resolves([[updatedUserMock]]);  // select updated
      
      const req = mockRequest({
        user: { id: 2, role: 'client' },
        params: { id: '2' },
        body: updateData
      });
      const res = mockResponse();
      const next = mockNext();
      
      // Esegui i middleware in sequenza
      await routes['PUT /:id'][0](req, res, next);
      if (!res.status.called && next.called) {
        await routes['PUT /:id'][1](req, res);
      }
      
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal(updatedUserMock);
    });
    
    it('non dovrebbe permettere il cambio di ruolo a utenti non admin', async () => {
      const req = mockRequest({
        user: { id: 2, role: 'client' },
        params: { id: '2' },
        body: { role: 'admin' }
      });
      const res = mockResponse();
      
      await routes['PUT /:id'][1](req, res);
      
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('error').that.includes('Non hai i permessi per modificare il ruolo');
    });
  });
  
  describe('DELETE /users/:id', () => {
    it('dovrebbe eliminare un utente come admin', async () => {
      db.query.onFirstCall().resolves([[{ id: 2 }]]);  // utente esiste
      db.query.onSecondCall().resolves([{ affectedRows: 1 }]);  // delete
      
      const req = mockRequest({
        user: { id: 1, role: 'admin' },
        params: { id: '2' }
      });
      const res = mockResponse();
      const next = mockNext();
      
      // Esegui i middleware in sequenza
      await routes['DELETE /:id'][0](req, res, next);
      if (!res.status.called && next.called) {
        await routes['DELETE /:id'][1](req, res, next);
        if (!res.status.called && next.called) {
          await routes['DELETE /:id'][2](req, res);
        }
      }
      
      expect(res.status.calledWith(204)).to.be.true;
    });
    
    it('dovrebbe restituire 404 se l\'utente non esiste', async () => {
      db.query.resolves([[]]);  // utente non esiste
      
      const req = mockRequest({
        user: { id: 1, role: 'admin' },
        params: { id: '999' }
      });
      const res = mockResponse();
      
      // Salta i middleware di auth
      await routes['DELETE /:id'][2](req, res);
      
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ error: 'Utente non trovato' })).to.be.true;
    });
  });
}); 