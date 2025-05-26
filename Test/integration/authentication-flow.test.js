const request = require('supertest');
const app = require('../../Backend/app');
const db = require('../../Backend/db');

// Mock del database
jest.mock('../../Backend/db');

describe('Flusso di Autenticazione', () => {
  // Dati di test
  const testUser = {
    name: 'Utente Test',
    email: 'test.new@example.com',
    password: 'TestPassword123',
    role: 'client'
  };
  
  let authToken;
  let userId;
  
  // Test del flusso completo
  it('dovrebbe completare il flusso di registrazione, login e accesso risorse protette', async () => {
    // 1. Registrazione nuovo utente
    db.query.mockResolvedValueOnce({ rows: [] }); // Email non esistente
    db.query.mockResolvedValueOnce({
      rows: [{ 
        id: 100,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role
      }]
    });
    
    const registerRes = await request(app)
      .post('/auth/register')
      .send(testUser);
    
    expect(registerRes.statusCode).toEqual(201);
    expect(registerRes.body).toHaveProperty('data.user');
    expect(registerRes.body.data.user.email).toEqual(testUser.email);
    
    userId = registerRes.body.data.user.id;
    
    // 2. Login con il nuovo utente
    db.query.mockResolvedValueOnce({
      rows: [{
        id: userId,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role
      }]
    });
    
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    expect(loginRes.statusCode).toEqual(200);
    expect(loginRes.body).toHaveProperty('data.token');
    expect(loginRes.body).toHaveProperty('data.user');
    expect(loginRes.body.data.user.email).toEqual(testUser.email);
    
    authToken = loginRes.body.data.token;
    
    // 3. Verifica validità del token
    const verifyRes = await request(app)
      .get('/auth/verify')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(verifyRes.statusCode).toEqual(200);
    expect(verifyRes.body).toHaveProperty('data.valid', true);
    
    // 4. Accesso a risorsa protetta (profilo utente)
    db.query.mockResolvedValueOnce({
      rows: [{
        id: userId,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        created_at: new Date().toISOString()
      }]
    });
    
    const profileRes = await request(app)
      .get(`/users/${userId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(profileRes.statusCode).toEqual(200);
    expect(profileRes.body).toHaveProperty('data');
    expect(profileRes.body.data.id).toEqual(userId);
    expect(profileRes.body.data.email).toEqual(testUser.email);
    
    // 5. Tentativo di accesso senza token
    const unauthorizedRes = await request(app)
      .get('/orders');
    
    expect(unauthorizedRes.statusCode).toEqual(401);
    expect(unauthorizedRes.body).toHaveProperty('error');
    
    // 6. Tentativo di accesso con token invalido
    const invalidTokenRes = await request(app)
      .get('/orders')
      .set('Authorization', 'Bearer invalid.token.here');
    
    expect(invalidTokenRes.statusCode).toEqual(401);
    expect(invalidTokenRes.body).toHaveProperty('error');
  });
  
  it('dovrebbe rifiutare la registrazione con email esistente', async () => {
    // Mock per email già esistente
    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, email: testUser.email }]
    });
    
    const duplicateRegisterRes = await request(app)
      .post('/auth/register')
      .send(testUser);
    
    expect(duplicateRegisterRes.statusCode).toEqual(400);
    expect(duplicateRegisterRes.body).toHaveProperty('error');
  });
  
  it('dovrebbe rifiutare il login con credenziali errate', async () => {
    // Mock per risposta vuota (credenziali errate)
    db.query.mockResolvedValueOnce({ rows: [] });
    
    const failedLoginRes = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'PasswordSbagliata'
      });
    
    expect(failedLoginRes.statusCode).toEqual(401);
    expect(failedLoginRes.body).toHaveProperty('error');
  });
}); 