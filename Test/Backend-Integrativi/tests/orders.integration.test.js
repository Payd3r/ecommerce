const axios = require('axios');
const config = require('../config');

const API_BASE_URL = config.server.baseUrl;

describe('Orders Integration Tests', () => {
  let authTokens;
  let testProduct;
  let testOrder;

  beforeAll(async () => {
    // Usa i token dai test precedenti
    authTokens = global.authTokensForIntegration || {};
    testProduct = global.testProductForIntegration;
    
    // Assicurati che abbiamo tutti i ruoli necessari
    if (!authTokens.client) {
      const clientUser = {
        email: 'client.orders@integration.test',
        password: 'TestPassword123!',
        name: 'Client Orders',
        role: 'client'
      };
      
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, clientUser);
        authTokens.client = response.data.data.token;
      } catch (error) {
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: clientUser.email,
          password: clientUser.password
        });
        authTokens.client = loginResponse.data.data.token;
      }
    }

    if (!authTokens.admin) {
      const adminUser = {
        email: 'admin.orders@integration.test',
        password: 'TestPassword123!',
        name: 'Admin Orders',
        role: 'admin'
      };
      
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, adminUser);
        authTokens.admin = response.data.data.token;
      } catch (error) {
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: adminUser.email,
          password: adminUser.password
        });
        authTokens.admin = loginResponse.data.data.token;
      }
    }

    // Ottieni un prodotto se non ce l'abbiamo
    if (!testProduct) {
      const productsResponse = await axios.get(`${API_BASE_URL}/products?limit=1`);
      if (productsResponse.data.products.length > 0) {
        testProduct = productsResponse.data.products[0];
        global.testProductForIntegration = testProduct;
      }
    }
  });

  describe('POST /orders', () => {
    it('dovrebbe creare un nuovo ordine', async () => {
      // Prima ottieni l'user ID del cliente
      const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });
      const clientId = profileResponse.data.data.id;

      const orderData = {
        client_id: clientId,
        total_price: 25.99,
        status: 'pending'
      };

      const response = await axios.post(`${API_BASE_URL}/orders`, orderData);

      expect(response.status).toBe(201);
      expect(response.data.client_id).toBe(clientId);
      expect(response.data.total_price).toBe('25.99');
      expect(response.data.status).toBe('pending');
      expect(response.data.id).toBeDefined();

      testOrder = response.data;
    });

    it('dovrebbe rifiutare creazione ordine con dati mancanti', async () => {
      try {
        await axios.post(`${API_BASE_URL}/orders`, {
          client_id: 1
          // total_price mancante
        });
        fail('Dovrebbe lanciare errore per dati mancanti');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    it('dovrebbe usare status default "pending" se non specificato', async () => {
      const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });
      const clientId = profileResponse.data.data.id;

      const response = await axios.post(`${API_BASE_URL}/orders`, {
        client_id: clientId,
        total_price: 15.50
      });

      expect(response.status).toBe(201);
      expect(response.data.status).toBe('pending');
    });
  });

  describe('POST /orders/checkout', () => {
    beforeEach(async () => {
      // Prepara il carrello con un prodotto
      await axios.post(`${API_BASE_URL}/cart/items`, {
        product_id: testProduct.id,
        quantity: 2
      }, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });
    });

    it('dovrebbe creare ordine dal carrello con checkout', async () => {
      const response = await axios.post(`${API_BASE_URL}/orders/checkout`, {}, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });

      expect(response.status).toBe(201);
      expect(response.data.message).toContain('Ordine creato');
      expect(response.data.order_id).toBeDefined();
      expect(response.data.total).toBeDefined();

      // Verifica che il carrello sia stato svuotato
      const cartResponse = await axios.get(`${API_BASE_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });
      expect(cartResponse.data.items.length).toBe(0);
    });

    it('dovrebbe rifiutare checkout senza autenticazione', async () => {
      try {
        await axios.post(`${API_BASE_URL}/orders/checkout`, {});
        fail('Dovrebbe lanciare errore senza autenticazione');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('dovrebbe rifiutare checkout con carrello vuoto', async () => {
      // Svuota il carrello prima
      await axios.delete(`${API_BASE_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });

      try {
        await axios.post(`${API_BASE_URL}/orders/checkout`, {}, {
          headers: {
            'Authorization': `Bearer ${authTokens.client}`
          }
        });
        fail('Dovrebbe lanciare errore per carrello vuoto');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain('Carrello vuoto');
      }
    });
  });

  describe('GET /orders', () => {
    it('dovrebbe restituire tutti gli ordini per admin', async () => {
      const response = await axios.get(`${API_BASE_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${authTokens.admin}`
        }
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      if (response.data.length > 0) {
        const order = response.data[0];
        expect(order.id).toBeDefined();
        expect(order.client_id).toBeDefined();
        expect(order.client_name).toBeDefined();
        expect(order.total_price).toBeDefined();
        expect(order.status).toBeDefined();
      }
    });

    it('dovrebbe restituire ordini specifici del cliente', async () => {
      const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });
      const clientId = profileResponse.data.data.id;

      const response = await axios.get(`${API_BASE_URL}/orders?clientId=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      response.data.forEach(order => {
        expect(order.client_id).toBe(clientId);
      });
    });

    it('dovrebbe rifiutare accesso a ordini di altri clienti', async () => {
      // Crea un altro cliente
      const otherClientUser = {
        email: 'otherclient.orders@integration.test',
        password: 'TestPassword123!',
        name: 'Other Client',
        role: 'client'
      };
      
      let otherClientToken;
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, otherClientUser);
        otherClientToken = response.data.data.token;
      } catch (error) {
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: otherClientUser.email,
          password: otherClientUser.password
        });
        otherClientToken = loginResponse.data.data.token;
      }

      // Ottieni l'ID del primo cliente
      const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });
      const firstClientId = profileResponse.data.data.id;

      try {
        await axios.get(`${API_BASE_URL}/orders?clientId=${firstClientId}`, {
          headers: {
            'Authorization': `Bearer ${otherClientToken}`
          }
        });
        fail('Dovrebbe lanciare errore per accesso non autorizzato');
      } catch (error) {
        expect(error.response.status).toBe(403);
      }
    });

    it('dovrebbe rifiutare accesso senza autenticazione', async () => {
      try {
        await axios.get(`${API_BASE_URL}/orders`);
        fail('Dovrebbe lanciare errore senza autenticazione');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('GET /orders/by-artisan/:artisanId', () => {
    it('dovrebbe restituire ordini per prodotti di un artigiano', async () => {
      // Ottieni l'ID dell'artigiano dal prodotto di test
      if (testProduct && testProduct.artisan_id) {
        const response = await axios.get(`${API_BASE_URL}/orders/by-artisan/${testProduct.artisan_id}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        // Se ci sono ordini, verifica che contengano prodotti dell'artigiano
        // (Questo test dipende dall'esistenza di ordini nel database)
      }
    });

    it('dovrebbe rifiutare ID artigiano non valido', async () => {
      try {
        await axios.get(`${API_BASE_URL}/orders/by-artisan/invalid_id`);
        fail('Dovrebbe lanciare errore per ID non valido');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    it('dovrebbe restituire array vuoto per artigiano senza ordini', async () => {
      const response = await axios.get(`${API_BASE_URL}/orders/by-artisan/99999`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(0);
    });
  });

  describe('GET /orders/stats/sales', () => {
    it('dovrebbe restituire statistiche vendite mensili per artigiano', async () => {
      if (testProduct && testProduct.artisan_id) {
        const response = await axios.get(`${API_BASE_URL}/orders/stats/sales?artisanId=${testProduct.artisan_id}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        // Ogni elemento dovrebbe avere month e total_sales
        response.data.forEach(stat => {
          expect(stat.month).toBeDefined();
          expect(stat.total_sales).toBeDefined();
        });
      }
    });

    it('dovrebbe rifiutare richiesta senza artisanId', async () => {
      try {
        await axios.get(`${API_BASE_URL}/orders/stats/sales`);
        fail('Dovrebbe lanciare errore senza artisanId');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    it('dovrebbe rifiutare artisanId non valido', async () => {
      try {
        await axios.get(`${API_BASE_URL}/orders/stats/sales?artisanId=invalid`);
        fail('Dovrebbe lanciare errore per ID non valido');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('GET /orders/stats/orders', () => {
    it('dovrebbe restituire statistiche ordini mensili per artigiano', async () => {
      if (testProduct && testProduct.artisan_id) {
        const response = await axios.get(`${API_BASE_URL}/orders/stats/orders?artisanId=${testProduct.artisan_id}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        // Ogni elemento dovrebbe avere month e total_orders
        response.data.forEach(stat => {
          expect(stat.month).toBeDefined();
          expect(stat.total_orders).toBeDefined();
        });
      }
    });

    it('dovrebbe rifiutare richiesta senza artisanId', async () => {
      try {
        await axios.get(`${API_BASE_URL}/orders/stats/orders`);
        fail('Dovrebbe lanciare errore senza artisanId');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('PUT /orders/:orderId', () => {
    it('dovrebbe restituire item di un ordine specifico', async () => {
      if (testOrder && testOrder.id) {
        const response = await axios.put(`${API_BASE_URL}/orders/${testOrder.id}`, {}, {
          headers: {
            'Authorization': `Bearer ${authTokens.client}`
          }
        });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        // Gli item dovrebbero avere struttura corretta
        response.data.forEach(item => {
          expect(item.id).toBeDefined();
          expect(item.product_id).toBeDefined();
          expect(item.quantity).toBeDefined();
          expect(item.unit_price).toBeDefined();
        });
      }
    });

    it('dovrebbe rifiutare accesso senza autenticazione', async () => {
      if (testOrder && testOrder.id) {
        try {
          await axios.put(`${API_BASE_URL}/orders/${testOrder.id}`, {});
          fail('Dovrebbe lanciare errore senza autenticazione');
        } catch (error) {
          expect(error.response.status).toBe(401);
        }
      }
    });
  });

  describe('DELETE /orders/:orderId', () => {
    it('dovrebbe eliminare ordine come admin', async () => {
      // Crea un ordine da eliminare
      const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });
      const clientId = profileResponse.data.data.id;

      const orderToDelete = await axios.post(`${API_BASE_URL}/orders`, {
        client_id: clientId,
        total_price: 10.00,
        status: 'pending'
      });

      const response = await axios.delete(`${API_BASE_URL}/orders/${orderToDelete.data.id}`, {
        headers: {
          'Authorization': `Bearer ${authTokens.admin}`
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('eliminato');
    });

    it('dovrebbe rifiutare eliminazione senza autenticazione', async () => {
      if (testOrder && testOrder.id) {
        try {
          await axios.delete(`${API_BASE_URL}/orders/${testOrder.id}`);
          fail('Dovrebbe lanciare errore senza autenticazione');
        } catch (error) {
          expect(error.response.status).toBe(401);
        }
      }
    });

    it('dovrebbe rifiutare eliminazione ordine inesistente', async () => {
      try {
        await axios.delete(`${API_BASE_URL}/orders/99999`, {
          headers: {
            'Authorization': `Bearer ${authTokens.admin}`
          }
        });
        fail('Dovrebbe lanciare errore per ordine inesistente');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('POST /orders/create-payment-intent', () => {
    beforeEach(async () => {
      // Prepara il carrello per il payment intent
      await axios.post(`${API_BASE_URL}/cart/items`, {
        product_id: testProduct.id,
        quantity: 1
      }, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });
    });

    it('dovrebbe creare payment intent per checkout', async () => {
      const response = await axios.post(`${API_BASE_URL}/orders/create-payment-intent`, {}, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.clientSecret).toBeDefined();
      expect(response.data.amount).toBeDefined();
    });

    it('dovrebbe rifiutare payment intent senza autenticazione', async () => {
      try {
        await axios.post(`${API_BASE_URL}/orders/create-payment-intent`, {});
        fail('Dovrebbe lanciare errore senza autenticazione');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('dovrebbe rifiutare payment intent con carrello vuoto', async () => {
      // Svuota il carrello
      await axios.delete(`${API_BASE_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });

      try {
        await axios.post(`${API_BASE_URL}/orders/create-payment-intent`, {}, {
          headers: {
            'Authorization': `Bearer ${authTokens.client}`
          }
        });
        fail('Dovrebbe lanciare errore per carrello vuoto');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  // Esporta dati per altri test
  global.testOrderForIntegration = testOrder;
}); 