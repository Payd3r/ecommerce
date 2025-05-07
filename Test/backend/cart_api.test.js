const request = require('supertest');
// Utilizziamo l'app mockata per i test
const app = require('./__mocks__/app');
const { generateTestToken } = require('./auth.service');

test('GET /cart richiede autenticazione e restituisce il carrello utente', async () => {
    // Genera un token di autenticazione per un utente
    const userToken = generateTestToken({ role: 'client' });
    
    const response = await request(app)
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('items');
    expect(Array.isArray(response.body.data.items)).toBe(true);
});

test('GET /cart senza token di autenticazione dovrebbe restituire errore', async () => {
    const response = await request(app).get('/cart');
    
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
});

test('POST /cart/add dovrebbe aggiungere un prodotto al carrello', async () => {
    // Genera un token di autenticazione per un utente
    const userToken = generateTestToken({ role: 'client' });
    
    const cartItemData = {
        product_id: 1,
        quantity: 1
    };
    
    const response = await request(app)
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send(cartItemData);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
});

test('DELETE /cart/item/:id dovrebbe rimuovere un prodotto dal carrello', async () => {
    // Genera un token di autenticazione per un utente
    const userToken = generateTestToken({ role: 'client' });
    
    // Rimuovi l'elemento dal carrello
    const deleteResponse = await request(app)
        .delete(`/cart/item/1`)
        .set('Authorization', `Bearer ${userToken}`);
    
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
}); 