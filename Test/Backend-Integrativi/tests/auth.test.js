const { chai, app, expect, config } = require('../setup');
const { generateToken, createTestUser } = require('../utils/testHelpers');

describe('API Auth - Test Integrativi', () => {
  // Test per il login
  describe('POST /auth/login', () => {
    it('dovrebbe effettuare il login con credenziali valide', (done) => {
      const loginData = {
        email: config.testData.client.email,
        password: config.testData.client.password
      };

      chai.request(app)
        .post('/auth/login')
        .send(loginData)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.have.property('token');
          expect(res.body.data).to.have.property('user');
          expect(res.body.data.user).to.have.property('email').equal(loginData.email);
          done();
        });
    });

    it('dovrebbe rifiutare il login con password errata', (done) => {
      const loginData = {
        email: config.testData.client.email,
        password: 'password_sbagliata'
      };

      chai.request(app)
        .post('/auth/login')
        .send(loginData)
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.false;
          done();
        });
    });

    it('dovrebbe rifiutare il login con email inesistente', (done) => {
      const loginData = {
        email: 'nonesistemail@example.com',
        password: 'password123'
      };

      chai.request(app)
        .post('/auth/login')
        .send(loginData)
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.false;
          done();
        });
    });
  });

  // Test per la registrazione
  describe('POST /auth/register', () => {
    it('dovrebbe registrare un nuovo utente con dati validi', (done) => {
      const userData = {
        email: 'nuovoutente@test.com',
        password: 'Password123',
        name: 'Nuovo Utente',
        role: 'client'
      };

      chai.request(app)
        .post('/auth/register')
        .send(userData)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.have.property('token');
          expect(res.body.data).to.have.property('user');
          expect(res.body.data.user).to.have.property('email').equal(userData.email);
          expect(res.body.data.user).to.have.property('name').equal(userData.name);
          done();
        });
    });

    it('dovrebbe rifiutare la registrazione con email già esistente', (done) => {
      const userData = {
        email: config.testData.client.email, // Email già registrata
        password: 'Password123',
        name: 'Duplicato',
        role: 'client'
      };

      chai.request(app)
        .post('/auth/register')
        .send(userData)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.false;
          done();
        });
    });
  });

  // Test per il profilo
  describe('GET /auth/profile', () => {
    it('dovrebbe ottenere il profilo dell\'utente autenticato', (done) => {
      // Prima creiamo un utente di test e generiamo un token
      createTestUser({
        email: 'profiletest@test.com',
        password: 'Password123',
        name: 'Profile Test',
        role: 'client'
      }).then(user => {
        const token = generateToken(user);

        chai.request(app)
          .get('/auth/profile')
          .set('Authorization', `Bearer ${token}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body.success).to.be.true;
            expect(res.body.data).to.have.property('id').equal(user.id);
            expect(res.body.data).to.have.property('email').equal(user.email);
            expect(res.body.data).to.have.property('nickname').equal(user.name);
            done();
          });
      });
    });

    it('dovrebbe rifiutare l\'accesso senza token', (done) => {
      chai.request(app)
        .get('/auth/profile')
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });
  });

  // Test per l'aggiornamento del profilo
  describe('PUT /auth/profile', () => {
    it('dovrebbe aggiornare il nome utente', (done) => {
      createTestUser({
        email: 'updatetest@test.com',
        password: 'Password123',
        name: 'Update Test',
        role: 'client'
      }).then(user => {
        const token = generateToken(user);
        const updatedData = {
          nickname: 'Nome Aggiornato'
        };

        chai.request(app)
          .put('/auth/profile')
          .set('Authorization', `Bearer ${token}`)
          .send(updatedData)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body.success).to.be.true;
            expect(res.body.data).to.have.property('nickname').equal(updatedData.nickname);
            done();
          });
      });
    });
  });
}); 