const { chai, app, expect, config } = require('../setup');
const { generateToken, createTestUser } = require('../utils/testHelpers');

describe('API Users - Test Integrativi', () => {
  let adminUser, adminToken, clientUser, clientToken, artisanUser, artisanToken;

  // Prepara i dati di test prima dei test
  before(async () => {
    // Crea un admin di test
    adminUser = await createTestUser({
      email: 'adminusers@test.com',
      password: 'Password123',
      name: 'Admin Users',
      role: 'admin'
    });

    // Crea un client di test
    clientUser = await createTestUser({
      email: 'clientusers@test.com',
      password: 'Password123',
      name: 'Client Users',
      role: 'client'
    });

    // Crea un artigiano di test
    artisanUser = await createTestUser({
      email: 'artisanusers@test.com',
      password: 'Password123',
      name: 'Artisan Users',
      role: 'artisan',
      bio: 'Artigiano per test utenti',
      approved: 1
    });

    // Genera token
    adminToken = generateToken(adminUser);
    clientToken = generateToken(clientUser);
    artisanToken = generateToken(artisanUser);
  });

  // Test per ottenere tutti gli utenti (solo admin)
  describe('GET /users', () => {
    it('dovrebbe permettere all\'admin di ottenere la lista di tutti gli utenti', (done) => {
      chai.request(app)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('users').to.be.an('array');
          expect(res.body).to.have.property('pagination');
          done();
        });
    });

    it('dovrebbe applicare i parametri di paginazione e ricerca', (done) => {
      chai.request(app)
        .get('/users?page=1&limit=5&name=User')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('pagination');
          expect(res.body.pagination).to.have.property('limit').equal(5);
          done();
        });
    });

    it('dovrebbe rifiutare l\'accesso ai non admin', (done) => {
      chai.request(app)
        .get('/users')
        .set('Authorization', `Bearer ${clientToken}`)
        .end((err, res) => {
          expect(res).to.have.status(403);
          done();
        });
    });
  });

  // Test per ottenere gli artigiani
  describe('GET /users/artisans', () => {
    it('dovrebbe restituire la lista degli artigiani approvati', (done) => {
      chai.request(app)
        .get('/users/artisans')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('data').to.be.an('array');
          expect(res.body).to.have.property('pagination');
          done();
        });
    });

    it('dovrebbe restituire un singolo artigiano se specificato l\'id', (done) => {
      chai.request(app)
        .get(`/users/artisans?id=${artisanUser.id}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.have.property('id').equal(artisanUser.id);
          done();
        });
    });

    it('dovrebbe restituire 404 per un artigiano non esistente', (done) => {
      chai.request(app)
        .get('/users/artisans?id=9999')
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });
  });

  // Test per ottenere il conteggio degli utenti (solo admin)
  describe('GET /users/counts', () => {
    it('dovrebbe permettere all\'admin di ottenere il conteggio degli utenti per ruolo', (done) => {
      chai.request(app)
        .get('/users/counts')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('clients');
          expect(res.body).to.have.property('artisans');
          expect(res.body).to.have.property('admins');
          expect(res.body).to.have.property('total');
          done();
        });
    });

    it('dovrebbe rifiutare l\'accesso ai non admin', (done) => {
      chai.request(app)
        .get('/users/counts')
        .set('Authorization', `Bearer ${clientToken}`)
        .end((err, res) => {
          expect(res).to.have.status(403);
          done();
        });
    });
  });

  // Test per creare un utente (solo admin)
  describe('POST /users', () => {
    it('dovrebbe permettere all\'admin di creare un nuovo utente', (done) => {
      // Crea un email unico per evitare conflitti
      const uniqueEmail = `nuovoutente_${Date.now()}_${Math.floor(Math.random() * 10000)}@test.com`;
      
      const userData = {
        name: 'Nuovo Utente',
        email: uniqueEmail,
        password: 'Password123',
        role: 'client'
      };

      chai.request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('name').equal(userData.name);
          expect(res.body).to.have.property('email').equal(userData.email);
          expect(res.body).to.have.property('role').equal(userData.role);
          done();
        });
    });

    it('dovrebbe rifiutare la creazione di un utente con email già esistente', (done) => {
      const userData = {
        name: 'Duplicato',
        email: clientUser.email, // Email già esistente
        password: 'Password123',
        role: 'client'
      };

      chai.request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it('dovrebbe rifiutare l\'accesso ai non admin', (done) => {
      const userData = {
        name: 'Nuovo Utente',
        email: 'nuovoutente2@test.com',
        password: 'Password123',
        role: 'client'
      };

      chai.request(app)
        .post('/users')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(userData)
        .end((err, res) => {
          expect(res).to.have.status(403);
          done();
        });
    });
  });

  // Test per ottenere gli artigiani in attesa di approvazione (solo admin)
  describe('GET /users/pending-artisans', () => {
    it('dovrebbe permettere all\'admin di vedere gli artigiani in attesa', (done) => {
      chai.request(app)
        .get('/users/pending-artisans')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('users').to.be.an('array');
          done();
        });
    });

    it('dovrebbe rifiutare l\'accesso ai non admin', (done) => {
      chai.request(app)
        .get('/users/pending-artisans')
        .set('Authorization', `Bearer ${clientToken}`)
        .end((err, res) => {
          expect(res).to.have.status(403);
          done();
        });
    });
  });

  // Test per ottenere un utente specifico
  describe('GET /users/:id', () => {
    it('dovrebbe permettere all\'admin di vedere qualsiasi profilo', (done) => {
      chai.request(app)
        .get(`/users/${clientUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('id').equal(clientUser.id);
          done();
        });
    });

    it('dovrebbe permettere a un utente di vedere il proprio profilo', (done) => {
      chai.request(app)
        .get(`/users/${clientUser.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('id').equal(clientUser.id);
          done();
        });
    });

    it('dovrebbe impedire a un utente di vedere il profilo altrui', (done) => {
      chai.request(app)
        .get(`/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .end((err, res) => {
          expect(res).to.have.status(403);
          done();
        });
    });
  });

  // Test per aggiornare un utente
  describe('PUT /users/:id', () => {
    it('dovrebbe permettere a un utente di aggiornare il proprio profilo', (done) => {
      const updateData = {
        name: 'Nome Aggiornato'
      };

      chai.request(app)
        .put(`/users/${clientUser.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('name').equal(updateData.name);
          done();
        });
    });

    it('dovrebbe permettere all\'admin di aggiornare qualsiasi profilo', (done) => {
      const updateData = {
        name: 'Nome Modificato da Admin'
      };

      chai.request(app)
        .put(`/users/${clientUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('name').equal(updateData.name);
          done();
        });
    });

    it('dovrebbe impedire a un utente di aggiornare il profilo altrui', (done) => {
      const updateData = {
        name: 'Nome Non Autorizzato'
      };

      chai.request(app)
        .put(`/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .end((err, res) => {
          expect(res).to.have.status(403);
          done();
        });
    });
  });

  // Test per l'approvazione di un artigiano
  describe('PUT /users/:id/approve', () => {
    let pendingArtisan, pendingArtisanId;

    before(async () => {
      // Crea un utente client con extended_users che aspetta approvazione
      pendingArtisan = await createTestUser({
        email: 'pendingartisan@test.com',
        password: 'Password123',
        name: 'Pending Artisan',
        role: 'client'
      });
      pendingArtisanId = pendingArtisan.id;

      // Inserisci manualmente nella tabella extended_users con approved=0
      const connection = await require('../utils/testHelpers').getTestDbConnection();
      await connection.query(
        'INSERT INTO extended_users (id_users, bio, approved) VALUES (?, ?, ?)',
        [pendingArtisanId, 'Bio di un artigiano in attesa', 0]
      );
      await connection.end();
    });

    it('dovrebbe permettere all\'admin di approvare un artigiano', (done) => {
      chai.request(app)
        .put(`/users/${pendingArtisanId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('message').that.includes('approvato');
          done();
        });
    });

    it('dovrebbe rifiutare l\'approvazione da non admin', (done) => {
      chai.request(app)
        .put(`/users/${pendingArtisanId}/approve`)
        .set('Authorization', `Bearer ${clientToken}`)
        .end((err, res) => {
          expect(res).to.have.status(403);
          done();
        });
    });
  });
}); 