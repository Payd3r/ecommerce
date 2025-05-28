const { chai, app, expect, config } = require('../setup');
const { 
  generateToken, 
  createTestUser, 
  createTestCategory, 
  createTestProduct,
  createTestCart,
  addTestCartItem 
} = require('../utils/testHelpers');

describe('API Cart - Test Integrativi', () => {
  let testUser, userToken, testCategory, testProduct1, testProduct2, testCart;

  // Prepara i dati di test prima dei test
  before(async () => {
    // Crea un utente di test
    testUser = await createTestUser({
      email: 'cartuser@test.com',
      password: 'Password123',
      name: 'Cart User',
      role: 'client'
    });

    // Genera token per l'utente
    userToken = generateToken(testUser);

    // Crea una categoria di test
    testCategory = await createTestCategory({
      name: 'Categoria Cart Test',
      description: 'Categoria per test carrello'
    });

    // Crea un artigiano di test
    const testArtisan = await createTestUser({
      email: 'artisancart@test.com',
      password: 'Password123',
      name: 'Artisan Cart',
      role: 'artisan',
      bio: 'Artigiano per test carrello',
      approved: 1
    });

    // Crea prodotti di test
    testProduct1 = await createTestProduct({
      artisan_id: testArtisan.id,
      name: 'Prodotto Carrello 1',
      description: 'Prodotto per test carrello 1',
      price: 15.99,
      stock: 10,
      category_id: testCategory.id
    });

    testProduct2 = await createTestProduct({
      artisan_id: testArtisan.id,
      name: 'Prodotto Carrello 2',
      description: 'Prodotto per test carrello 2',
      price: 25.99,
      stock: 5,
      category_id: testCategory.id
    });
  });

  // Test per creare un carrello
  describe('POST /cart', () => {
    it('dovrebbe creare un nuovo carrello per l\'utente autenticato', (done) => {
      chai.request(app)
        .post('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('message');
          expect(res.body).to.have.property('cart_id');
          
          // Salva l'ID del carrello per i test successivi
          testCart = { id: res.body.cart_id };
          done();
        });
    });

    it('dovrebbe restituire messaggio se il carrello esiste già', (done) => {
      // Richiama nuovamente la creazione del carrello
      chai.request(app)
        .post('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('message').that.includes('già esistente');
          expect(res.body).to.have.property('cart_id').equal(testCart.id);
          done();
        });
    });
  });

  // Test per aggiungere prodotti al carrello
  describe('POST /cart/items', () => {
    it('dovrebbe aggiungere un prodotto al carrello', (done) => {
      const itemData = {
        product_id: testProduct1.id,
        quantity: 2
      };

      chai.request(app)
        .post('/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send(itemData)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('message').that.includes('aggiunto');
          done();
        });
    });

    it('dovrebbe aggiungere un altro prodotto al carrello', (done) => {
      const itemData = {
        product_id: testProduct2.id,
        quantity: 1
      };

      chai.request(app)
        .post('/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send(itemData)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('message').that.includes('aggiunto');
          done();
        });
    });

    it('dovrebbe rifiutare la richiesta con dati incompleti', (done) => {
      // Manca la quantità
      const itemData = {
        product_id: testProduct1.id
      };

      chai.request(app)
        .post('/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send(itemData)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('error');
          done();
        });
    });

    it('dovrebbe aggiornare la quantità se il prodotto è già nel carrello', (done) => {
      // Aggiungiamo di nuovo il primo prodotto
      const itemData = {
        product_id: testProduct1.id,
        quantity: 3
      };

      chai.request(app)
        .post('/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send(itemData)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('message').that.includes('aggiunto');
          done();
        });
    });
  });

  // Test per ottenere il carrello
  describe('GET /cart', () => {
    it('dovrebbe restituire il carrello dell\'utente con i prodotti', (done) => {
      chai.request(app)
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('items').to.be.an('array');
          expect(res.body.items.length).to.be.at.least(2);
          
          // Verifica i dettagli degli items
          const item1 = res.body.items.find(item => item.product_id === testProduct1.id);
          const item2 = res.body.items.find(item => item.product_id === testProduct2.id);
          
          expect(item1).to.exist;
          expect(item2).to.exist;
          
          expect(item1.quantity).to.equal(5); // 2 + 3 dalle richieste precedenti
          expect(item2.quantity).to.equal(1);
          
          expect(item1).to.have.property('name');
          expect(item1).to.have.property('price');
          expect(item1).to.have.property('item_id');
          
          done();
        });
    });
  });

  // Test per modificare la quantità di un prodotto nel carrello
  describe('PUT /cart/items/:item_id', () => {
    let itemId;

    before((done) => {
      // Prima otteniamo l'ID dell'item nel carrello
      chai.request(app)
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          itemId = res.body.items[0].item_id;
          done();
        });
    });

    it('dovrebbe aggiornare la quantità di un prodotto nel carrello', (done) => {
      const updateData = {
        quantity: 3
      };

      chai.request(app)
        .put(`/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('message').that.includes('aggiornata');
          done();
        });
    });

    it('dovrebbe rifiutare l\'aggiornamento con quantità non valida', (done) => {
      const updateData = {
        quantity: -1
      };

      chai.request(app)
        .put(`/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('error');
          done();
        });
    });

    it('dovrebbe rifiutare l\'aggiornamento di un item di un altro utente', (done) => {
      // Creiamo un altro utente e il suo carrello
      createTestUser({
        email: 'anotheruser@test.com',
        password: 'Password123',
        name: 'Another User',
        role: 'client'
      }).then(anotherUser => {
        const anotherUserToken = generateToken(anotherUser);
        
        // Creiamo un carrello per questo utente
        createTestCart(anotherUser.id).then(anotherCart => {
          // Aggiungiamo un prodotto al carrello
          addTestCartItem(anotherCart.id, testProduct1.id, 1).then(anotherItem => {
            // Proviamo ad aggiornare questo item con il token del primo utente
            const updateData = {
              quantity: 10
            };

            chai.request(app)
              .put(`/cart/items/${anotherItem.id}`)
              .set('Authorization', `Bearer ${userToken}`)
              .send(updateData)
              .end((err, res) => {
                expect(res).to.have.status(404);
                expect(res.body).to.be.an('object');
                expect(res.body).to.have.property('error');
                done();
              });
          });
        });
      });
    });
  });

  // Test per rimuovere un prodotto dal carrello
  describe('DELETE /cart/items/:item_id', () => {
    let itemId;

    before((done) => {
      // Prima otteniamo l'ID dell'item nel carrello
      chai.request(app)
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          itemId = res.body.items[0].item_id;
          done();
        });
    });

    it('dovrebbe rimuovere un prodotto dal carrello', (done) => {
      chai.request(app)
        .delete(`/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('message').that.includes('rimosso');
          done();
        });
    });

    it('dovrebbe restituire errore per un item inesistente', (done) => {
      chai.request(app)
        .delete(`/cart/items/9999`)
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('error');
          done();
        });
    });
  });

  // Test per svuotare il carrello
  describe('DELETE /cart', () => {
    it('dovrebbe svuotare completamente il carrello', (done) => {
      chai.request(app)
        .delete('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('message').that.includes('svuotato');
          
          // Verifichiamo che il carrello sia effettivamente vuoto
          chai.request(app)
            .get('/cart')
            .set('Authorization', `Bearer ${userToken}`)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body).to.be.an('object');
              expect(res.body).to.have.property('items').to.be.an('array');
              expect(res.body.items.length).to.equal(0);
              done();
            });
        });
    });
  });
}); 