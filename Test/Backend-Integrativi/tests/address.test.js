const { chai, app, expect, config } = require('../setup');
const { generateToken, createTestUser, createTestAddress } = require('../utils/testHelpers');

describe('API Address - Test Integrativi', () => {
  let testUser, userToken, adminUser, adminToken, testAddress;

  // Prepara i dati di test prima dei test
  before(async () => {
    // Crea un utente di test
    testUser = await createTestUser({
      email: 'addressuser@test.com',
      password: 'Password123',
      name: 'Address User',
      role: 'client'
    });

    // Genera token per l'utente
    userToken = generateToken(testUser);

    // Crea un admin di test
    adminUser = await createTestUser({
      email: 'addressadmin@test.com',
      password: 'Password123',
      name: 'Address Admin',
      role: 'admin'
    });

    // Genera token per l'admin
    adminToken = generateToken(adminUser);
  });

  // Test per creare/aggiornare un indirizzo
  describe('POST /address', () => {
    it('dovrebbe creare un nuovo indirizzo per l\'utente autenticato', (done) => {
      const addressData = {
        name: 'Mario',
        surname: 'Rossi',
        stato: 'Italia',
        citta: 'Roma',
        provincia: 'RM',
        via: 'Via dei Fori Imperiali',
        cap: '00186',
        numero_civico: 1
      };

      chai.request(app)
        .post('/address')
        .set('Authorization', `Bearer ${userToken}`)
        .send(addressData)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.have.property('user_id').equal(testUser.id);
          expect(res.body.data).to.have.property('name').equal(addressData.name);
          expect(res.body.data).to.have.property('surname').equal(addressData.surname);
          expect(res.body.data).to.have.property('citta').equal(addressData.citta);
          expect(res.body.data).to.have.property('provincia').equal(addressData.provincia);
          expect(res.body.data).to.have.property('via').equal(addressData.via);
          expect(res.body.data).to.have.property('cap').equal(addressData.cap);
          expect(res.body.data).to.have.property('numero_civico').equal(addressData.numero_civico);
          
          // Salva l'indirizzo per i test successivi
          testAddress = res.body.data;
          done();
        });
    });

    it('dovrebbe aggiornare un indirizzo esistente', (done) => {
      const updatedAddressData = {
        name: 'Mario',
        surname: 'Rossi',
        stato: 'Italia',
        citta: 'Milano', // Città aggiornata
        provincia: 'MI', // Provincia aggiornata
        via: 'Via Monte Napoleone',
        cap: '20121',
        numero_civico: 10
      };

      chai.request(app)
        .post('/address')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updatedAddressData)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.have.property('user_id').equal(testUser.id);
          expect(res.body.data).to.have.property('citta').equal(updatedAddressData.citta);
          expect(res.body.data).to.have.property('provincia').equal(updatedAddressData.provincia);
          expect(res.body.data).to.have.property('via').equal(updatedAddressData.via);
          done();
        });
    });

    it('dovrebbe rifiutare la creazione di un indirizzo con dati mancanti', (done) => {
      const incompleteAddressData = {
        name: 'Mario',
        surname: 'Rossi',
        // campi mancanti
        citta: 'Firenze',
        provincia: 'FI'
        // altri campi mancanti
      };

      chai.request(app)
        .post('/address')
        .set('Authorization', `Bearer ${userToken}`)
        .send(incompleteAddressData)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.false;
          expect(res.body).to.have.property('message');
          done();
        });
    });
  });

  // Test per ottenere l'indirizzo dell'utente loggato
  describe('GET /address/me', () => {
    it('dovrebbe restituire l\'indirizzo dell\'utente autenticato', (done) => {
      chai.request(app)
        .get('/address/me')
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.not.be.null;
          expect(res.body.data).to.have.property('user_id').equal(testUser.id);
          expect(res.body.data).to.have.property('citta');
          expect(res.body.data).to.have.property('via');
          done();
        });
    });

    it('dovrebbe restituire null se l\'utente non ha un indirizzo', (done) => {
      // Creiamo un nuovo utente senza indirizzo
      createTestUser({
        email: 'noaddress@test.com',
        password: 'Password123',
        name: 'No Address',
        role: 'client'
      }).then(newUser => {
        const newUserToken = generateToken(newUser);

        chai.request(app)
          .get('/address/me')
          .set('Authorization', `Bearer ${newUserToken}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body.success).to.be.true;
            expect(res.body.data).to.be.null;
            done();
          });
      });
    });

    it('dovrebbe rifiutare la richiesta senza token', (done) => {
      chai.request(app)
        .get('/address/me')
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });
  });

  // Test per ottenere l'indirizzo di un utente specifico (solo admin/artigiano)
  describe('GET /address/user/:userId', () => {
    it('dovrebbe restituire l\'indirizzo di un utente se richiesto da admin', (done) => {
      chai.request(app)
        .get(`/address/user/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.not.be.null;
          expect(res.body.data).to.have.property('user_id').equal(testUser.id);
          done();
        });
    });

    it('dovrebbe restituire l\'indirizzo di un utente se richiesto da artigiano', (done) => {
      // Creiamo un artigiano di test
      createTestUser({
        email: 'artisanaddress@test.com',
        password: 'Password123',
        name: 'Artisan Address',
        role: 'artisan',
        bio: 'Artigiano per test indirizzi',
        approved: 1
      }).then(artisan => {
        const artisanToken = generateToken(artisan);

        chai.request(app)
          .get(`/address/user/${testUser.id}`)
          .set('Authorization', `Bearer ${artisanToken}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body.success).to.be.true;
            expect(res.body.data).to.not.be.null;
            expect(res.body.data).to.have.property('user_id').equal(testUser.id);
            done();
          });
      });
    });

    it('dovrebbe rifiutare la richiesta se fatta da un client', (done) => {
      // Creiamo un altro client
      createTestUser({
        email: 'otherclient@test.com',
        password: 'Password123',
        name: 'Other Client',
        role: 'client'
      }).then(otherClient => {
        const otherClientToken = generateToken(otherClient);

        chai.request(app)
          .get(`/address/user/${testUser.id}`)
          .set('Authorization', `Bearer ${otherClientToken}`)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body).to.be.an('object');
            expect(res.body.success).to.be.false;
            done();
          });
      });
    });
  });
}); 