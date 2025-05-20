/**
 * Test di integrazione per le API dei prodotti
 * Questi test si connettono al backend reale in esecuzione su localhost:3015
 */
const request = require('supertest');
const { API_BASE_URL, TEST_USER } = require('./config');

// IDs necessari per i test
let authToken;
let productId;
let categoryId;

// Test suite per le API dei prodotti
describe('Products API Integration Tests', () => {
  
  // Prima di tutti i test, ottieni un token di autenticazione
  beforeAll(async () => {
    try {
      // Login per ottenere un token
      const loginResponse = await request(API_BASE_URL)
        .post('/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        });
      
      // Estrai il token in base alla struttura della risposta
      if (loginResponse.body.data && loginResponse.body.data.token) {
        authToken = loginResponse.body.data.token;
      } else if (loginResponse.body.token) {
        authToken = loginResponse.body.token;
      }
      
      // Ottieni l'ID di una categoria esistente
      const categoriesResponse = await request(API_BASE_URL)
        .get('/categories');
      
      if (categoriesResponse.body && Array.isArray(categoriesResponse.body)) {
        // Se la risposta è direttamente un array
        categoryId = categoriesResponse.body[0].id;
      } else if (categoriesResponse.body.data && Array.isArray(categoriesResponse.body.data)) {
        // Se la risposta ha un campo data che è un array
        categoryId = categoriesResponse.body.data[0].id;
      }
    } catch (error) {
      console.error('Errore durante il setup dei test dei prodotti:', error.message);
    }
  });
  
  // Test per ottenere tutti i prodotti
  test('GET /products dovrebbe restituire un elenco di prodotti', async () => {
    const response = await request(API_BASE_URL)
      .get('/products');
    
    expect(response.status).toBe(200);
    
    // Verifica che la risposta contenga un array di prodotti
    // Nota: la struttura esatta dipende dall'implementazione del backend
    expect(Array.isArray(response.body.data) || Array.isArray(response.body.products)).toBe(true);
    
    // Salva l'ID di un prodotto per i test successivi
    if (response.body.data && response.body.data.length > 0) {
      productId = response.body.data[0].id;
    } else if (response.body.products && response.body.products.length > 0) {
      productId = response.body.products[0].id;
    }
  });
  
  // Test per ottenere un singolo prodotto
  test('GET /products/:id dovrebbe restituire un singolo prodotto', async () => {
    // Verifica che l'ID del prodotto sia stato ottenuto nel test precedente
    if (!productId) {
      console.log('Nessun prodotto trovato per il test');
      return;
    }
    
    const response = await request(API_BASE_URL)
      .get(`/products/${productId}`);
    
    expect(response.status).toBe(200);
    // Verifica che la risposta contenga i dettagli del prodotto
    if (response.body.data) {
      expect(response.body.data).toHaveProperty('id', productId);
    } else {
      expect(response.body).toHaveProperty('id', productId);
    }
  });
  
  // Test per ottenere prodotti per categoria
  test('GET /products?category=:id dovrebbe restituire prodotti per categoria', async () => {
    // Verifica che l'ID della categoria sia stato ottenuto
    if (!categoryId) {
      console.log('Nessuna categoria trovata per il test');
      return;
    }
    
    const response = await request(API_BASE_URL)
      .get(`/products?category=${categoryId}`);
    
    expect(response.status).toBe(200);
    // Verifica che la risposta contenga un array di prodotti
    expect(Array.isArray(response.body.data) || Array.isArray(response.body.products)).toBe(true);
  });
  
  // Test per la ricerca di prodotti
  test('GET /products?search=:term dovrebbe restituire prodotti filtrati', async () => {
    const searchTerm = 'test'; // Termine di ricerca generico
    
    const response = await request(API_BASE_URL)
      .get(`/products?search=${searchTerm}`);
    
    expect(response.status).toBe(200);
    // Verifica che la risposta contenga un array di prodotti
    expect(Array.isArray(response.body.data) || Array.isArray(response.body.products)).toBe(true);
  });
  
  // Test per la creazione di un prodotto come client (non dovrebbe essere permesso)
  test('POST /products come client NON dovrebbe creare un nuovo prodotto', async () => {
    // Verifica che il token e l'ID della categoria siano stati ottenuti
    if (!authToken || !categoryId) {
      console.log('Token o categoria non disponibili per il test');
      return;
    }
    
    const newProduct = {
      name: `Test Product Client ${Date.now()}`,
      description: 'Un prodotto creato dai test di integrazione client',
      price: 19.99,
      stock: 20,
      category_id: categoryId
    };
    
    const response = await request(API_BASE_URL)
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newProduct);
    
    // I client non dovrebbero poter creare prodotti, quindi ci aspettiamo un errore
    console.log('Client create product response:', response.status, JSON.stringify(response.body, null, 2));
    expect(response.status).toBe(403);
  });
  
  // Test per la creazione di un prodotto come artisan
  test('POST /products come artisan dovrebbe creare un nuovo prodotto', async () => {
    // Per questo test, facciamo login come artisan
    const artisanLoginResponse = await request(API_BASE_URL)
      .post('/auth/login')
      .send({
        email: 'marco@gmail.com', // Presumiamo che questo sia un utente artisan
        password: '1234'
      });
    
    let artisanToken;
    if (artisanLoginResponse.body.data && artisanLoginResponse.body.data.token) {
      artisanToken = artisanLoginResponse.body.data.token;
    } else if (artisanLoginResponse.body.token) {
      artisanToken = artisanLoginResponse.body.token;
    }
    
    // Verifica che l'ID della categoria sia stato ottenuto
    if (!artisanToken || !categoryId) {
      console.log('Token artisan o categoria non disponibili per il test');
      return;
    }
    
    const newProduct = {
      name: `Test Product Artisan ${Date.now()}`,
      description: 'Un prodotto creato dai test di integrazione artisan',
      price: 29.99,
      stock: 50,
      category_id: categoryId
    };
    
    const response = await request(API_BASE_URL)
      .post('/products')
      .set('Authorization', `Bearer ${artisanToken}`)
      .send(newProduct);
    
    // Gli artisan dovrebbero poter creare prodotti
    console.log('Artisan create product response:', response.status, JSON.stringify(response.body, null, 2));
    expect([200, 201]).toContain(response.status);
  });
  
  // Test per la creazione di un prodotto come admin
  test('POST /products come admin NON dovrebbe creare un nuovo prodotto', async () => {
    // Per questo test, facciamo login come admin
    const adminLoginResponse = await request(API_BASE_URL)
      .post('/auth/login')
      .send({
        email: 'luca@gmail.com', // Presumiamo che questo sia un utente admin
        password: '1234'
      });
    
    let adminToken;
    if (adminLoginResponse.body.data && adminLoginResponse.body.data.token) {
      adminToken = adminLoginResponse.body.data.token;
    } else if (adminLoginResponse.body.token) {
      adminToken = adminLoginResponse.body.token;
    }
    
    // Verifica che l'ID della categoria sia stato ottenuto
    if (!adminToken || !categoryId) {
      console.log('Token admin o categoria non disponibili per il test');
      return;
    }
    
    const newProduct = {
      name: `Test Product Admin ${Date.now()}`,
      description: 'Un prodotto creato dai test di integrazione admin',
      price: 39.99,
      stock: 100,
      category_id: categoryId
    };
    
    const response = await request(API_BASE_URL)
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newProduct);
    
    // In base all'implementazione attuale, gli admin non possono creare prodotti
    console.log('Admin create product response:', response.status, JSON.stringify(response.body, null, 2));
    expect(response.status).toBe(403);
  });
}); 