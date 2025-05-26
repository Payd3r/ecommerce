const request = require('supertest');
const app = require('../../Backend/app');
const db = require('../../Backend/db');

// Mock del database
jest.mock('../../Backend/db');

describe('Auth API', () => {
  // Test di login
  describe('POST /auth/login', () => {
    it('dovrebbe effettuare il login con credenziali valide', async () => {
      // Mock della risposta del database
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'client'
        }]
      });
      
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data.token');
      expect(res.body).toHaveProperty('data.user');
    });

    it('dovrebbe rifiutare login con credenziali non valide', async () => {
      // Mock della risposta vuota del database
      db.query.mockResolvedValueOnce({ rows: [] });
      
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  // Test di registrazione
  describe('POST /auth/register', () => {
    it('dovrebbe registrare un nuovo utente', async () => {
      // Mock per verificare che l'email non esista già
      db.query.mockResolvedValueOnce({ rows: [] });
      // Mock per l'inserimento dell'utente
      db.query.mockResolvedValueOnce({ 
        rows: [{ id: 100, email: 'new@example.com', name: 'New User', role: 'client' }] 
      });
      
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'New User',
          email: 'new@example.com',
          password: 'newpassword123',
          role: 'client'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('data.user');
    });

    it('dovrebbe rifiutare registrazione con email già esistente', async () => {
      // Mock per simulare email già esistente
      db.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, email: 'existing@example.com' }] 
      });
      
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Existing User',
          email: 'existing@example.com',
          password: 'password123',
          role: 'client'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  // Test di verifica token
  describe('GET /auth/verify', () => {
    it('dovrebbe verificare un token valido', async () => {
      // Prima otteniamo un token valido tramite login
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'client'
        }]
      });
      
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      const token = loginRes.body.data.token;
      
      // Ora verifichiamo il token
      const res = await request(app)
        .get('/auth/verify')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data.valid', true);
    });

    it('dovrebbe rifiutare un token non valido', async () => {
      const res = await request(app)
        .get('/auth/verify')
        .set('Authorization', 'Bearer invalidtoken');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error');
    });
  });
}); 