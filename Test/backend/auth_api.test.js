const request = require('supertest');
// Utilizziamo l'app mockata per i test
const app = require('./__mocks__/app');

// Test per l'endpoint di login
test('POST /auth/login con credenziali valide dovrebbe restituire un token', async () => {
    // Nota: questo test utilizza l'app mockata
    const credentials = {
        email: 'test@example.com',
        password: 'password123'
    };
    
    const response = await request(app)
        .post('/auth/login')
        .send(credentials);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data).toHaveProperty('user');
});

test('POST /auth/login con credenziali non valide dovrebbe restituire un errore', async () => {
    const credentials = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
    };
    
    const response = await request(app)
        .post('/auth/login')
        .send(credentials);
    
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
});

// Test per l'endpoint di registrazione
test('POST /auth/register dovrebbe registrare un nuovo utente', async () => {
    // Genera un'email casuale per evitare conflitti
    const randomEmail = `test${Date.now()}@example.com`;
    
    const userData = {
        name: 'Utente Test',
        email: randomEmail,
        password: 'password123',
        role: 'client'
    };
    
    const response = await request(app)
        .post('/auth/register')
        .send(userData);
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data.user.email).toBe(userData.email);
}); 