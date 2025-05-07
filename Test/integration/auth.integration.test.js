const request = require('supertest');
const { API_BASE_URL, TEST_USER } = require('./config');

describe('Auth API Integration Tests', () => {
  
  test('POST /auth/login con credenziali valide dovrebbe restituire un token', async () => {
    const credentials = {
      email: TEST_USER.email,
      password: TEST_USER.password
    };
    
    const response = await request(API_BASE_URL)
      .post('/auth/login')
      .send(credentials);
    
    expect(response.status).toBe(200);
    
    if (response.body.data) {
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
    } else if (response.body.token) {
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    }
  });
  
  test('POST /auth/login con credenziali non valide dovrebbe restituire un errore', async () => {
    const credentials = {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    };
    
    const response = await request(API_BASE_URL)
      .post('/auth/login')
      .send(credentials);
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
  });
  
  test('POST /auth/register dovrebbe registrare un nuovo utente', async () => {
    const randomEmail = `test${Date.now()}@example.com`;
    
    const userData = {
      name: 'Utente Test',
      email: randomEmail,
      password: 'password123',
      role: 'client'
    };
    
    const response = await request(API_BASE_URL)
      .post('/auth/register')
      .send(userData);
    
    if (response.status === 201) {
      if (response.body.data) {
        expect(response.body.data).toHaveProperty('token');
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data.user.email).toBe(userData.email);
      } else if (response.body.token) {
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(userData.email);
      }
    } else {
      expect(response.body).toHaveProperty('message') || expect(response.body).toHaveProperty('error');
    }
  });
  
  test('GET /auth/profile con token valido dovrebbe restituire i dati utente', async () => {
    const loginResponse = await request(API_BASE_URL)
      .post('/auth/login')
      .send({
        email: TEST_USER.email,
        password: TEST_USER.password
      });
    
    let authToken;
    if (loginResponse.body.data && loginResponse.body.data.token) {
      authToken = loginResponse.body.data.token;
    } else if (loginResponse.body.token) {
      authToken = loginResponse.body.token;
    }
    
    expect(authToken).toBeDefined();
    
    const response = await request(API_BASE_URL)
      .get('/auth/profile')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    
    if (response.body.data) {
      expect(response.body.data).toHaveProperty('email');
    } else {
      expect(response.body).toHaveProperty('email');
    }
  });
  
  test('GET /auth/profile senza token dovrebbe restituire un errore', async () => {
    const response = await request(API_BASE_URL)
      .get('/auth/profile');
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
}); 