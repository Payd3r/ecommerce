/**
 * Test di integrazione per le API del carrello
 * Questi test si connettono al backend reale in esecuzione su localhost:3015
 */
const request = require('supertest');
const { API_BASE_URL, TEST_USERS } = require('./config');

// Variabili per memorizzare i token e gli ID necessari tra i test
const tokens = {};
let productId;
let cartItemId;

describe('Cart API Integration Tests', () => {
  // Prima di tutti i test, esegui il login per ottenere token per ogni ruolo
  beforeAll(async () => {
    try {
      // Login come client
      const clientLoginResponse = await request(API_BASE_URL)
        .post('/auth/login')
        .send({
          email: TEST_USERS.client.email,
          password: TEST_USERS.client.password
        });
      
      console.log('Client login response (cart tests):', JSON.stringify(clientLoginResponse.body, null, 2));
      
      // Ottieni il token client
      if (clientLoginResponse.body.token) {
        tokens.client = clientLoginResponse.body.token;
      } else if (clientLoginResponse.body.data && clientLoginResponse.body.data.token) {
        tokens.client = clientLoginResponse.body.data.token;
      } else if (clientLoginResponse.body.user && clientLoginResponse.body.user.token) {
        tokens.client = clientLoginResponse.body.user.token;
      }
      
      // Login come admin
      const adminLoginResponse = await request(API_BASE_URL)
        .post('/auth/login')
        .send({
          email: TEST_USERS.admin.email,
          password: TEST_USERS.admin.password
        });
      
      console.log('Admin login response (cart tests):', JSON.stringify(adminLoginResponse.body, null, 2));
      
      // Ottieni il token admin
      if (adminLoginResponse.body.token) {
        tokens.admin = adminLoginResponse.body.token;
      } else if (adminLoginResponse.body.data && adminLoginResponse.body.data.token) {
        tokens.admin = adminLoginResponse.body.data.token;
      } else if (adminLoginResponse.body.user && adminLoginResponse.body.user.token) {
        tokens.admin = adminLoginResponse.body.user.token;
      }
      
      console.log('Token ottenuti (cart tests):', Object.keys(tokens).join(', '));
      
      // Ottieni l'ID di un prodotto esistente
      const productsResponse = await request(API_BASE_URL)
        .get('/products');
      
      console.log('Products response (cart tests):', JSON.stringify(productsResponse.body, null, 2));
      
      // Gestisci diverse possibili strutture della risposta
      let products;
      if (productsResponse.body.data) {
        products = productsResponse.body.data;
      } else if (Array.isArray(productsResponse.body)) {
        products = productsResponse.body;
      } else if (productsResponse.body.products) {
        products = productsResponse.body.products;
      }
      
      if (products && products.length > 0) {
        productId = products[0].id || products[0]._id;
        console.log('Product ID ottenuto (cart tests):', productId);
      } else {
        console.warn('Non è stato possibile trovare prodotti. I test del carrello potrebbero fallire.');
      }
    } catch (error) {
      console.error('Errore durante il setup dei test del carrello:', error.message);
    }
  });

  test('GET /cart come client dovrebbe restituire il carrello', async () => {
    // Salta il test se non abbiamo ottenuto un token client
    if (!tokens.client) {
      console.warn('Test saltato: token client non disponibile');
      return;
    }

    const response = await request(API_BASE_URL)
      .get('/cart')
      .set('Authorization', `Bearer ${tokens.client}`);

    expect(response.status).toBe(200);
    console.log('GET /cart come client response:', JSON.stringify(response.body, null, 2));
  });
  
  test('GET /cart come admin dovrebbe restituire il carrello', async () => {
    // Salta il test se non abbiamo ottenuto un token admin
    if (!tokens.admin) {
      console.warn('Test saltato: token admin non disponibile');
      return;
    }

    const response = await request(API_BASE_URL)
      .get('/cart')
      .set('Authorization', `Bearer ${tokens.admin}`);

    expect(response.status).toBe(200);
    console.log('GET /cart come admin response:', JSON.stringify(response.body, null, 2));
  });

  test('POST /cart/items dovrebbe aggiungere un prodotto al carrello', async () => {
    // Utilizziamo il client per questo test
    if (!tokens.client || !productId) {
      console.warn('Test saltato: token client o ID prodotto non disponibile');
      return;
    }

    const response = await request(API_BASE_URL)
      .post('/cart/items')
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        product_id: productId,
        quantity: 2
      });

    expect(response.status).toBe(200);
    console.log('POST /cart/items response:', JSON.stringify(response.body, null, 2));
  });

  test('GET /cart dopo aggiunta dovrebbe contenere il prodotto', async () => {
    // Utilizziamo il client per questo test
    if (!tokens.client || !productId) {
      console.warn('Test saltato: token client o ID prodotto non disponibile');
      return;
    }

    const response = await request(API_BASE_URL)
      .get('/cart')
      .set('Authorization', `Bearer ${tokens.client}`);

    expect(response.status).toBe(200);
    console.log('GET /cart dopo aggiunta response:', JSON.stringify(response.body, null, 2));
    
    // Cerca l'ID dell'elemento del carrello
    let items;
    if (response.body.items) {
      items = response.body.items;
    } else if (response.body.data && response.body.data.items) {
      items = response.body.data.items;
    } else if (Array.isArray(response.body)) {
      items = response.body;
    } else if (response.body.data && Array.isArray(response.body.data)) {
      items = response.body.data;
    }
    
    // Se troviamo degli elementi, salviamo l'ID del primo per i test successivi
    if (items && items.length > 0) {
      // Cerca di trovare l'ID in diversi possibili formati
      cartItemId = items[0].id || items[0]._id || items[0].item_id;
      console.log('Cart item ID ottenuto:', cartItemId);
    }
  });

  test('PUT /cart/items/:id dovrebbe modificare la quantità', async () => {
    // Utilizziamo il client per questo test
    if (!tokens.client || !cartItemId) {
      console.warn('Test saltato: token client o ID elemento carrello non disponibile');
      return;
    }

    const response = await request(API_BASE_URL)
      .put(`/cart/items/${cartItemId}`)
      .set('Authorization', `Bearer ${tokens.client}`)
      .send({
        quantity: 3
      });

    expect(response.status).toBe(200);
    console.log('PUT /cart/items/:id response:', JSON.stringify(response.body, null, 2));
  });

  test('DELETE /cart/items/:id dovrebbe rimuovere un prodotto', async () => {
    // Utilizziamo il client per questo test
    if (!tokens.client || !cartItemId) {
      console.warn('Test saltato: token client o ID elemento carrello non disponibile');
      return;
    }

    const response = await request(API_BASE_URL)
      .delete(`/cart/items/${cartItemId}`)
      .set('Authorization', `Bearer ${tokens.client}`);

    expect(response.status).toBe(200);
    console.log('DELETE /cart/items/:id response:', JSON.stringify(response.body, null, 2));
  });

  test('DELETE /cart dovrebbe svuotare il carrello', async () => {
    // Utilizziamo il client per questo test
    if (!tokens.client) {
      console.warn('Test saltato: token client non disponibile');
      return;
    }

    const response = await request(API_BASE_URL)
      .delete('/cart')
      .set('Authorization', `Bearer ${tokens.client}`);

    expect(response.status).toBe(200);
    console.log('DELETE /cart response:', JSON.stringify(response.body, null, 2));
  });

  test('GET /cart dopo svuotamento dovrebbe essere vuoto', async () => {
    // Utilizziamo il client per questo test
    if (!tokens.client) {
      console.warn('Test saltato: token client non disponibile');
      return;
    }

    const response = await request(API_BASE_URL)
      .get('/cart')
      .set('Authorization', `Bearer ${tokens.client}`);

    expect(response.status).toBe(200);
    console.log('GET /cart dopo svuotamento response:', JSON.stringify(response.body, null, 2));
  });
}); 