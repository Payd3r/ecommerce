const { chai, app, expect, config } = require('../setup');
const { generateToken, createTestUser, createTestCategory, createTestProduct } = require('../utils/testHelpers');

describe('API Products - Test Integrativi', () => {
  let testCategory, testArtisan, artisanToken, testProduct;

  // Prepara i dati di test prima dei test
  before(async () => {
    // Crea una categoria di test
    testCategory = await createTestCategory({
      name: 'Categoria Test',
      description: 'Categoria per test integrativi'
    });

    // Crea un artigiano di test
    testArtisan = await createTestUser({
      email: 'artisanproducts@test.com',
      password: 'Password123',
      name: 'Artisan Products',
      role: 'artisan',
      bio: 'Artigiano per test dei prodotti',
      approved: 1
    });

    // Genera token per l'artigiano
    artisanToken = generateToken(testArtisan);
  });

  // Test per ottenere tutti i prodotti
  describe('GET /products', () => {
    it('dovrebbe restituire un elenco di prodotti con paginazione', (done) => {
      chai.request(app)
        .get('/products')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('products').to.be.an('array');
          expect(res.body).to.have.property('pagination');
          expect(res.body.pagination).to.have.property('total');
          expect(res.body.pagination).to.have.property('totalPages');
          expect(res.body.pagination).to.have.property('currentPage');
          expect(res.body.pagination).to.have.property('limit');
          done();
        });
    });

    it('dovrebbe applicare filtri di ricerca', (done) => {
      chai.request(app)
        .get('/products?search=test&limit=5')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('products').to.be.an('array');
          expect(res.body.pagination).to.have.property('limit').equal(5);
          done();
        });
    });
  });

  // Test per creare un prodotto
  describe('POST /products', () => {
    it('dovrebbe creare un nuovo prodotto con credenziali di artigiano', (done) => {
      const productData = {
        name: 'Prodotto Test',
        description: 'Prodotto di prova per test integrativi',
        price: 19.99,
        stock: 50,
        category_id: testCategory.id
      };

      chai.request(app)
        .post('/products')
        .set('Authorization', `Bearer ${artisanToken}`)
        .send(productData)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('name').equal(productData.name);
          expect(res.body).to.have.property('price').equal(productData.price.toString()); // Convertito in stringa dal DB
          expect(res.body).to.have.property('stock').equal(productData.stock);
          expect(res.body).to.have.property('artisan_id').equal(testArtisan.id);
          
          // Salva l'ID del prodotto per i test successivi
          testProduct = res.body;
          done();
        });
    });

    it('dovrebbe rifiutare la creazione di un prodotto senza autorizzazione', (done) => {
      const productData = {
        name: 'Prodotto Non Autorizzato',
        description: 'Prodotto che non dovrebbe essere creato',
        price: 19.99,
        stock: 50,
        category_id: testCategory.id
      };

      chai.request(app)
        .post('/products')
        .send(productData)
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it('dovrebbe rifiutare la creazione di un prodotto con dati mancanti', (done) => {
      const productData = {
        description: 'Prodotto con dati mancanti',
        // name e price mancanti
        stock: 50,
        category_id: testCategory.id
      };

      chai.request(app)
        .post('/products')
        .set('Authorization', `Bearer ${artisanToken}`)
        .send(productData)
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  // Test per ottenere un prodotto specifico
  describe('GET /products/:id', () => {
    it('dovrebbe restituire i dettagli di un prodotto specifico', (done) => {
      // Prima creiamo un prodotto di test
      createTestProduct({
        artisan_id: testArtisan.id,
        name: 'Prodotto Dettaglio',
        description: 'Prodotto per test dettaglio',
        price: 29.99,
        stock: 10,
        category_id: testCategory.id
      }).then(product => {
        chai.request(app)
          .get(`/products/${product.id}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.property('id').equal(product.id);
            expect(res.body).to.have.property('name').equal(product.name);
            expect(res.body).to.have.property('description').equal(product.description);
            expect(res.body).to.have.property('price');
            expect(res.body).to.have.property('images').to.be.an('array');
            done();
          });
      });
    });

    it('dovrebbe restituire 404 per un prodotto inesistente', (done) => {
      chai.request(app)
        .get('/products/9999')
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });
  });

  // Test per aggiornare un prodotto
  describe('PUT /products/:id', () => {
    it('dovrebbe aggiornare un prodotto esistente come artigiano proprietario', (done) => {
      // Prima creiamo un prodotto di test
      createTestProduct({
        artisan_id: testArtisan.id,
        name: 'Prodotto da Aggiornare',
        description: 'Prodotto per test aggiornamento',
        price: 39.99,
        stock: 15,
        category_id: testCategory.id
      }).then(product => {
        const updateData = {
          name: 'Prodotto Aggiornato',
          description: 'Descrizione aggiornata',
          price: 49.99,
          stock: 20,
          category_id: testCategory.id
        };

        chai.request(app)
          .put(`/products/${product.id}`)
          .set('Authorization', `Bearer ${artisanToken}`)
          .send(updateData)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.property('id').equal(product.id);
            expect(res.body).to.have.property('name').equal(updateData.name);
            expect(res.body).to.have.property('description').equal(updateData.description);
            expect(res.body).to.have.property('price').equal(updateData.price.toString());
            expect(res.body).to.have.property('stock').equal(updateData.stock);
            done();
          });
      });
    });

    it('dovrebbe rifiutare l\'aggiornamento di un prodotto altrui', (done) => {
      // Prima creiamo un altro artigiano
      createTestUser({
        email: 'otherartsian@test.com',
        password: 'Password123',
        name: 'Other Artisan',
        role: 'artisan'
      }).then(otherArtisan => {
        // Crea un prodotto per il nuovo artigiano
        createTestProduct({
          artisan_id: otherArtisan.id,
          name: 'Prodotto Altro Artigiano',
          description: 'Prodotto per test permessi',
          price: 59.99,
          stock: 30,
          category_id: testCategory.id
        }).then(otherProduct => {
          const updateData = {
            name: 'Prodotto Non Mio',
            price: 69.99
          };

          chai.request(app)
            .put(`/products/${otherProduct.id}`)
            .set('Authorization', `Bearer ${artisanToken}`) // Token del primo artigiano
            .send(updateData)
            .end((err, res) => {
              expect(res).to.have.status(404); // 404 perché non trova il prodotto tra quelli dell'artigiano
              done();
            });
        });
      });
    });
  });

  // Test per i prodotti di un artigiano specifico
  describe('GET /products/by-artisan/:id', () => {
    it('dovrebbe restituire i prodotti di un artigiano specifico', (done) => {
      chai.request(app)
        .get(`/products/by-artisan/${testArtisan.id}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('products').to.be.an('array');
          expect(res.body.products.length).to.be.at.least(1);
          expect(res.body.products[0]).to.have.property('artisan_id').equal(testArtisan.id);
          done();
        });
    });
  });
}); 