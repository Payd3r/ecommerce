const axios = require('axios');
const config = require('../config');

const API_BASE_URL = config.server.baseUrl;

describe('Cart Integration Tests', () => {
  let authTokens;
  let testProduct;
  let cartItemId;

  beforeAll(async () => {
    // Usa i token dall'auth test o crea un nuovo cliente
    authTokens = global.authTokensForIntegration || {};
    testProduct = global.testProductForIntegration;
    
    if (!authTokens.client) {
      const clientUser = {
        email: 'client.cart@integration.test',
        password: 'TestPassword123!',
        name: 'Client Cart',
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

    // Se non abbiamo un prodotto di test, ne otteniamo uno esistente
    if (!testProduct) {
      const productsResponse = await axios.get(`${API_BASE_URL}/products?limit=1`);
      if (productsResponse.data.products.length > 0) {
        testProduct = productsResponse.data.products[0];
        global.testProductForIntegration = testProduct;
      }
    }
  });

  describe('POST /cart', () => {
    it('dovrebbe creare un nuovo carrello', async () => {
      const response = await axios.post(`${API_BASE_URL}/cart`, {}, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });

      expect(response.status).toBe(201);
      expect(response.data.message).toContain('Carrello creato');
      expect(response.data.cart_id).toBeDefined();
    });

    it('dovrebbe riconoscere carrello già esistente', async () => {
      const response = await axios.post(`${API_BASE_URL}/cart`, {}, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('Carrello già esistente');
      expect(response.data.cart_id).toBeDefined();
    });

    it('dovrebbe rifiutare creazione carrello senza autenticazione', async () => {
      try {
        await axios.post(`${API_BASE_URL}/cart`, {});
        fail('Dovrebbe lanciare errore senza autenticazione');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('POST /cart/items', () => {
    it('dovrebbe aggiungere prodotto al carrello', async () => {
      const response = await axios.post(`${API_BASE_URL}/cart/items`, {
        product_id: testProduct.id,
        quantity: 2
      }, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('aggiunto');
    });

    it('dovrebbe aggiornare quantità prodotto già presente', async () => {
      const response = await axios.post(`${API_BASE_URL}/cart/items`, {
        product_id: testProduct.id,
        quantity: 1
      }, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('aggiornato');
    });

    it('dovrebbe rifiutare aggiunta senza dati validi', async () => {
      try {
        await axios.post(`${API_BASE_URL}/cart/items`, {
          product_id: testProduct.id
          // quantity mancante
        }, {
          headers: {
            'Authorization': `Bearer ${authTokens.client}`
          }
        });
        fail('Dovrebbe lanciare errore per dati non validi');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    it('dovrebbe rifiutare quantità non valida', async () => {
      try {
        await axios.post(`${API_BASE_URL}/cart/items`, {
          product_id: testProduct.id,
          quantity: 0
        }, {
          headers: {
            'Authorization': `Bearer ${authTokens.client}`
          }
        });
        fail('Dovrebbe lanciare errore per quantità non valida');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    it('dovrebbe rifiutare aggiunta senza autenticazione', async () => {
      try {
        await axios.post(`${API_BASE_URL}/cart/items`, {
          product_id: testProduct.id,
          quantity: 1
        });
        fail('Dovrebbe lanciare errore senza autenticazione');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('GET /cart', () => {
    it('dovrebbe restituire carrello con prodotti', async () => {
      const response = await axios.get(`${API_BASE_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.items).toBeDefined();
      expect(Array.isArray(response.data.items)).toBe(true);
      expect(response.data.items.length).toBeGreaterThan(0);

      const item = response.data.items[0];
      expect(item.item_id).toBeDefined();
      expect(item.product_id).toBe(testProduct.id);
      expect(item.quantity).toBeGreaterThan(0);
      expect(item.name).toBeDefined();
      expect(item.price).toBeDefined();
      
      // Salva l'item_id per i test successivi
      cartItemId = item.item_id;
    });

    it('dovrebbe restituire carrello vuoto per nuovo utente', async () => {
      // Crea un nuovo cliente
      const newClientUser = {
        email: 'newclient.cart@integration.test',
        password: 'TestPassword123!',
        name: 'New Client Cart',
        role: 'client'
      };
      
      let newClientToken;
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, newClientUser);
        newClientToken = response.data.data.token;
      } catch (error) {
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: newClientUser.email,
          password: newClientUser.password
        });
        newClientToken = loginResponse.data.data.token;
      }

      const response = await axios.get(`${API_BASE_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${newClientToken}`
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.items).toBeDefined();
      expect(Array.isArray(response.data.items)).toBe(true);
      expect(response.data.items.length).toBe(0);
    });

    it('dovrebbe rifiutare accesso carrello senza autenticazione', async () => {
      try {
        await axios.get(`${API_BASE_URL}/cart`);
        fail('Dovrebbe lanciare errore senza autenticazione');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('PUT /cart/items/:item_id', () => {
    it('dovrebbe aggiornare quantità prodotto nel carrello', async () => {
      const newQuantity = 5;
      const response = await axios.put(`${API_BASE_URL}/cart/items/${cartItemId}`, {
        quantity: newQuantity
      }, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('aggiornata');

      // Verifica che la quantità sia stata aggiornata
      const cartResponse = await axios.get(`${API_BASE_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });
      
      const updatedItem = cartResponse.data.items.find(item => item.item_id === cartItemId);
      expect(updatedItem.quantity).toBe(newQuantity);
    });

    it('dovrebbe rifiutare aggiornamento con quantità non valida', async () => {
      try {
        await axios.put(`${API_BASE_URL}/cart/items/${cartItemId}`, {
          quantity: 0
        }, {
          headers: {
            'Authorization': `Bearer ${authTokens.client}`
          }
        });
        fail('Dovrebbe lanciare errore per quantità non valida');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    it('dovrebbe rifiutare aggiornamento item inesistente', async () => {
      try {
        await axios.put(`${API_BASE_URL}/cart/items/99999`, {
          quantity: 2
        }, {
          headers: {
            'Authorization': `Bearer ${authTokens.client}`
          }
        });
        fail('Dovrebbe lanciare errore per item inesistente');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });

    it('dovrebbe rifiutare aggiornamento senza autenticazione', async () => {
      try {
        await axios.put(`${API_BASE_URL}/cart/items/${cartItemId}`, {
          quantity: 2
        });
        fail('Dovrebbe lanciare errore senza autenticazione');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('DELETE /cart/items/:item_id', () => {
    it('dovrebbe rimuovere prodotto dal carrello', async () => {
      // Prima aggiungi un altro prodotto per il test di rimozione
      await axios.post(`${API_BASE_URL}/cart/items`, {
        product_id: testProduct.id,
        quantity: 1
      }, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });

      // Ottieni l'item più recente
      const cartResponse = await axios.get(`${API_BASE_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });
      
      const itemToRemove = cartResponse.data.items[cartResponse.data.items.length - 1];

      const response = await axios.delete(`${API_BASE_URL}/cart/items/${itemToRemove.item_id}`, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('rimosso');

      // Verifica che l'item sia stato rimosso
      const updatedCartResponse = await axios.get(`${API_BASE_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });
      
      const removedItem = updatedCartResponse.data.items.find(item => item.item_id === itemToRemove.item_id);
      expect(removedItem).toBeUndefined();
    });

    it('dovrebbe rifiutare rimozione item inesistente', async () => {
      try {
        await axios.delete(`${API_BASE_URL}/cart/items/99999`, {
          headers: {
            'Authorization': `Bearer ${authTokens.client}`
          }
        });
        fail('Dovrebbe lanciare errore per item inesistente');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });

    it('dovrebbe rifiutare rimozione senza autenticazione', async () => {
      try {
        await axios.delete(`${API_BASE_URL}/cart/items/${cartItemId}`);
        fail('Dovrebbe lanciare errore senza autenticazione');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('DELETE /cart', () => {
    it('dovrebbe svuotare il carrello', async () => {
      const response = await axios.delete(`${API_BASE_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toMatch(/svuotato|già vuoto/);

      // Verifica che il carrello sia vuoto
      const cartResponse = await axios.get(`${API_BASE_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });
      
      expect(cartResponse.data.items.length).toBe(0);
    });

    it('dovrebbe gestire svuotamento carrello già vuoto', async () => {
      const response = await axios.delete(`${API_BASE_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${authTokens.client}`
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('già vuoto');
    });

    it('dovrebbe rifiutare svuotamento senza autenticazione', async () => {
      try {
        await axios.delete(`${API_BASE_URL}/cart`);
        fail('Dovrebbe lanciare errore senza autenticazione');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });
}); 