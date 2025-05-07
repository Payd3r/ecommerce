const request = require('supertest');
// Utilizziamo l'app mockata per i test
const app = require('./__mocks__/app');
const { generateTestToken } = require('./auth.service');

test('GET /products dovrebbe restituire un elenco di prodotti', async () => {
    const response = await request(app).get('/products');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
});

test('GET /products/:id dovrebbe restituire un singolo prodotto', async () => {
    const productId = 1;
    const response = await request(app).get(`/products/${productId}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id', productId);
});

test('GET /products/category/:id dovrebbe restituire prodotti per categoria', async () => {
    const categoryId = 1;
    const response = await request(app).get(`/products/category/${categoryId}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
});

test('POST /products con autorizzazione admin dovrebbe creare un nuovo prodotto', async () => {
    // Genera un token di autenticazione per un utente admin
    const adminToken = generateTestToken({ role: 'admin' });
    
    const productData = {
        name: 'Prodotto Test',
        description: 'Descrizione di test',
        price: 99.99,
        category_id: 1,
        stock: 10
    };
    
    const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.name).toBe(productData.name);
}); 