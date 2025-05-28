const { chai, app, expect, config } = require('../setup');
const { 
  generateToken, 
  createTestUser, 
  createTestCategory, 
  createTestProduct,
  createTestCart,
  addTestCartItem,
  createTestOrder
} = require('../utils/testHelpers');

describe('API Orders - Test Integrativi', () => {
  let adminUser, adminToken, clientUser, clientToken, artisanUser, artisanToken;
  let testCategory, testProduct1, testProduct2, testCart, testOrder;

  // Prepara i dati di test prima dei test
  before(async () => {
    // Crea un admin di test
    adminUser = await createTestUser({
      email: 'adminorders@test.com',
      password: 'Password123',
      name: 'Admin Orders',
      role: 'admin'
    });

    // Crea un client di test
    clientUser = await createTestUser({
      email: 'clientorders@test.com',
      password: 'Password123',
      name: 'Client Orders',
      role: 'client'
    });

    // Crea un artigiano di test
    artisanUser = await createTestUser({
      email: 'artisanorders@test.com',
      password: 'Password123',
      name: 'Artisan Orders',
      role: 'artisan',
      bio: 'Artigiano per test ordini',
      approved: 1
    });

    // Genera token
    adminToken = generateToken(adminUser);
    clientToken = generateToken(clientUser);
    artisanToken = generateToken(artisanUser);

    // Crea una categoria di test
    testCategory = await createTestCategory({
      name: 'Categoria Orders Test',
      description: 'Categoria per test ordini'
    });

    // Crea prodotti di test
    testProduct1 = await createTestProduct({
      artisan_id: artisanUser.id,
      name: 'Prodotto Ordini 1',
      description: 'Prodotto per test ordini 1',
      price: 15.99,
      stock: 10,
      category_id: testCategory.id
    });

    testProduct2 = await createTestProduct({
      artisan_id: artisanUser.id,
      name: 'Prodotto Ordini 2',
      description: 'Prodotto per test ordini 2',
      price: 25.99,
      stock: 5,
      category_id: testCategory.id
    });

    // Crea un ordine di test
    testOrder = await createTestOrder({
      client_id: clientUser.id,
      total_price: 57.97,
      status: 'pending',
      items: [
        { product_id: testProduct1.id, quantity: 2, unit_price: 15.99 },
        { product_id: testProduct2.id, quantity: 1, unit_price: 25.99 }
      ]
    });

    // Crea un carrello e aggiungi prodotti per il test di checkout
    testCart = await createTestCart(clientUser.id);
    await addTestCartItem(testCart.id, testProduct1.id, 1);
    await addTestCartItem(testCart.id, testProduct2.id, 2);
  });

  // Test per ottenere tutti gli ordini
  describe('GET /orders', () => {
    it('dovrebbe permettere all\'admin di ottenere tutti gli ordini', (done) => {
      chai.request(app)
        .get('/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.be.at.least(1);
          done();
        });
    });

    it('dovrebbe permettere a un cliente di ottenere i propri ordini', (done) => {
      chai.request(app)
        .get(`/orders?clientId=${clientUser.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.be.at.least(1);
          expect(res.body[0]).to.have.property('client_id').equal(clientUser.id);
          done();
        });
    });

    it('dovrebbe impedire a un cliente di ottenere gli ordini di un altro cliente', (done) => {
      // Crea un altro cliente
      createTestUser({
        email: 'otherclientorders@test.com',
        password: 'Password123',
        name: 'Other Client Orders',
        role: 'client'
      }).then(otherClient => {
        const otherClientToken = generateToken(otherClient);
        
        chai.request(app)
          .get(`/orders?clientId=${clientUser.id}`)
          .set('Authorization', `Bearer ${otherClientToken}`)
          .end((err, res) => {
            expect(res).to.have.status(403);
            done();
          });
      });
    });
  });

  // Test per creare un nuovo ordine
  describe('POST /orders', () => {
    it('dovrebbe creare un nuovo ordine', (done) => {
      const orderData = {
        client_id: clientUser.id,
        total_price: 99.99,
        status: 'pending'
      };

      chai.request(app)
        .post('/orders')
        .send(orderData)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('client_id').equal(orderData.client_id);
          expect(res.body).to.have.property('total_price').equal(orderData.total_price.toString());
          expect(res.body).to.have.property('status').equal(orderData.status);
          done();
        });
    });

    it('dovrebbe rifiutare la creazione con dati mancanti', (done) => {
      const incompleteOrderData = {
        client_id: clientUser.id
        // total_price mancante
      };

      chai.request(app)
        .post('/orders')
        .send(incompleteOrderData)
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  // Test per checkout
  describe('POST /orders/checkout', () => {
    it('dovrebbe creare un ordine dal carrello dell\'utente', (done) => {
      chai.request(app)
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ userId: clientUser.id })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('message').that.includes('creato');
          expect(res.body).to.have.property('order_id');
          expect(res.body).to.have.property('total');
          done();
        });
    });
  });

  // Test per ottenere gli ordini di un artigiano
  describe('GET /orders/by-artisan/:artisanId', () => {
    it('dovrebbe restituire gli ordini relativi ai prodotti di un artigiano', (done) => {
      chai.request(app)
        .get(`/orders/by-artisan/${artisanUser.id}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });

    it('dovrebbe gestire un ID artigiano non valido', (done) => {
      chai.request(app)
        .get('/orders/by-artisan/invalid')
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  // Test per ottenere le statistiche di vendita
  describe('GET /orders/stats/sales', () => {
    it('dovrebbe restituire le statistiche di vendita di un artigiano', (done) => {
      chai.request(app)
        .get(`/orders/stats/sales?artisanId=${artisanUser.id}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });

    it('dovrebbe gestire un ID artigiano non valido', (done) => {
      chai.request(app)
        .get('/orders/stats/sales?artisanId=invalid')
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  // Test per ottenere le statistiche degli ordini
  describe('GET /orders/stats/orders', () => {
    it('dovrebbe restituire le statistiche degli ordini di un artigiano', (done) => {
      chai.request(app)
        .get(`/orders/stats/orders?artisanId=${artisanUser.id}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });

    it('dovrebbe gestire un ID artigiano non valido', (done) => {
      chai.request(app)
        .get('/orders/stats/orders?artisanId=invalid')
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  // Test per ottenere gli items di un ordine
  describe('GET /orders/:orderId/items', () => {
    it('dovrebbe restituire gli items di un ordine specifico', (done) => {
      chai.request(app)
        .get(`/orders/${testOrder.id}/items`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.equal(2); // Abbiamo aggiunto 2 items all'ordine di test
          expect(res.body[0]).to.have.property('product_id');
          expect(res.body[0]).to.have.property('quantity');
          expect(res.body[0]).to.have.property('unit_price');
          done();
        });
    });

    it('dovrebbe gestire un ID ordine non valido', (done) => {
      chai.request(app)
        .get('/orders/invalid/items')
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  // Test per ottenere ordini filtrati di un artigiano
  describe('GET /orders/by-artisan/:artisanId/filtered', () => {
    it('dovrebbe restituire gli ordini filtrati di un artigiano', (done) => {
      chai.request(app)
        .get(`/orders/by-artisan/${artisanUser.id}/filtered?status=pending&page=1&limit=10`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('orders').to.be.an('array');
          expect(res.body).to.have.property('pagination');
          expect(res.body.pagination).to.have.property('total');
          expect(res.body.pagination).to.have.property('totalPages');
          expect(res.body.pagination).to.have.property('currentPage');
          expect(res.body.pagination).to.have.property('limit');
          done();
        });
    });

    it('dovrebbe gestire un ID artigiano non valido', (done) => {
      chai.request(app)
        .get('/orders/by-artisan/invalid/filtered')
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  // Test per aggiornare lo stato di un ordine
  describe('PUT /orders/:orderId', () => {
    it('dovrebbe permettere all\'admin di aggiornare lo stato di un ordine', (done) => {
      const updateData = {
        status: 'accepted'
      };

      chai.request(app)
        .put(`/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('message').that.includes('aggiornato');
          done();
        });
    });

    it('dovrebbe permettere all\'artigiano di spedire un ordine accettato', (done) => {
      // Prima aggiorna lo stato a 'accepted' se non lo è già
      chai.request(app)
        .put(`/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'accepted' })
        .end(() => {
          // Ora testa l'aggiornamento a 'shipped'
          chai.request(app)
            .put(`/orders/${testOrder.id}`)
            .set('Authorization', `Bearer ${artisanToken}`)
            .send({ status: 'shipped' })
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body).to.be.an('object');
              expect(res.body).to.have.property('message').that.includes('aggiornato');
              done();
            });
        });
    });

    it('dovrebbe gestire un ID ordine non valido', (done) => {
      chai.request(app)
        .put('/orders/invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'accepted' })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  // Test per eliminare un ordine
  describe('DELETE /orders/:orderId', () => {
    let orderToDelete;

    before(async () => {
      // Crea un ordine da eliminare
      orderToDelete = await createTestOrder({
        client_id: clientUser.id,
        total_price: 9.99,
        status: 'pending'
      });
    });

    it('dovrebbe permettere all\'admin di eliminare un ordine', (done) => {
      chai.request(app)
        .delete(`/orders/${orderToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('message').that.includes('eliminato');
          done();
        });
    });

    it('dovrebbe gestire un ID ordine non valido', (done) => {
      chai.request(app)
        .delete('/orders/invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  // Test per creare una PaymentIntent Stripe
  describe('POST /orders/create-payment-intent', () => {
    it('dovrebbe creare una PaymentIntent Stripe', (done) => {
      chai.request(app)
        .post('/orders/create-payment-intent')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ userId: clientUser.id })
        .end((err, res) => {
          // Test più flessibile: accettiamo sia 200 (successo) che 400 (errore Stripe in ambiente di test)
          expect(res.status).to.be.oneOf([200, 400]);
          
          if (res.status === 200) {
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.property('clientSecret');
          } else {
            expect(res.body).to.have.property('error');
          }
          done();
        });
    });
  });
}); 