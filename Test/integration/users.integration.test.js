/**
 * Test di integrazione per le API degli utenti
 * Questi test si connettono al backend reale in esecuzione su localhost:3015
 */
const request = require('supertest');
const { setupTestEnvironment, teardownTestEnvironment, getAuthToken } = require('./config');

let app;
let adminToken;
let clientToken;

describe('Users API Integration Tests', () => {
  // Setup e teardown dell'ambiente di test
  beforeAll(async () => {
    // Inizializza l'ambiente di test con database reale
    app = await setupTestEnvironment();
    
    // Ottieni token di autenticazione
    adminToken = await getAuthToken(app, 'admin@example.com', 'adminpassword');
    clientToken = await getAuthToken(app, 'client@example.com', 'clientpassword');
  });
  
  afterAll(async () => {
    await teardownTestEnvironment();
  });
  
  // Variabile per i test
  let newUserId;
  
  test('Dovrebbe restituire tutti gli utenti (admin)', async () => {
    const response = await request(app)
      .get('/users?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('users');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.users.length).toBeGreaterThan(0);
  });
  
  test('Dovrebbe restituire 403 se un client tenta di ottenere tutti gli utenti', async () => {
    const response = await request(app)
      .get('/users?page=1&limit=10')
      .set('Authorization', `Bearer ${clientToken}`);
    
    expect(response.status).toBe(403);
  });
  
  test('Dovrebbe restituire tutti gli artisani', async () => {
    const response = await request(app)
      .get('/users/artisans?page=1&limit=10');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
  });
  
  test('Dovrebbe restituire i conteggi degli utenti (admin)', async () => {
    const response = await request(app)
      .get('/users/counts')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('clients');
    expect(response.body).toHaveProperty('artisans');
    expect(response.body).toHaveProperty('admins');
    expect(response.body).toHaveProperty('total');
  });
  
  // Test del flusso completo CRUD
  describe('CRUD operations', () => {
    test('Dovrebbe creare un nuovo utente', async () => {
      const newUser = {
        name: 'Test Integration User',
        email: `test-integration-${Date.now()}@example.com`,
        password: 'password123',
        role: 'client'
      };
      
      const response = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', newUser.name);
      expect(response.body).toHaveProperty('email', newUser.email);
      expect(response.body).toHaveProperty('role', 'client');
      
      newUserId = response.body.id;
    });
    
    test('Dovrebbe restituire un utente specifico (admin)', async () => {
      const response = await request(app)
        .get(`/users/${newUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', newUserId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('email');
    });
    
    test('Dovrebbe impedire a un client di vedere il profilo di un altro utente', async () => {
      const response = await request(app)
        .get(`/users/${newUserId}`)
        .set('Authorization', `Bearer ${clientToken}`);
      
      expect(response.status).toBe(403);
    });
    
    test('Dovrebbe aggiornare un utente (admin)', async () => {
      const updatedUser = {
        name: 'Updated Integration User',
        email: `updated-${Date.now()}@example.com`
      };
      
      const response = await request(app)
        .put(`/users/${newUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedUser);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', newUserId);
      expect(response.body).toHaveProperty('name', updatedUser.name);
      expect(response.body).toHaveProperty('email', updatedUser.email);
    });
    
    test('Dovrebbe cambiare un utente da client ad artisan (admin)', async () => {
      const updatedRole = {
        role: 'artisan'
      };
      
      const response = await request(app)
        .put(`/users/${newUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedRole);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('role', 'artisan');
    });
    
    test('Dovrebbe approvare un artisan (admin)', async () => {
      const response = await request(app)
        .put(`/users/${newUserId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Utente approvato con successo');
      
      // Verifica che ora appaia negli artisan approvati
      const artisansResponse = await request(app)
        .get(`/users/artisans?id=${newUserId}`);
      
      // Questo potrebbe fallire se mancano dati relativi nella tabella extended_users
      // che potrebbe richiedere dati aggiuntivi come bio, etc.
      expect(artisansResponse.status).toBe(200);
    });
    
    test('Dovrebbe eliminare un utente (admin)', async () => {
      const response = await request(app)
        .delete(`/users/${newUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(204);
      
      // Verifica che l'utente sia stato effettivamente eliminato
      const checkResponse = await request(app)
        .get(`/users/${newUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(checkResponse.status).toBe(404);
    });
  });
  
  // Test validazioni e errori
  describe('Validazioni e errori', () => {
    test('Dovrebbe restituire 400 se l\'email non è valida', async () => {
      const invalidUser = {
        name: 'Invalid User',
        email: 'not-an-email',
        password: 'password123',
        role: 'client'
      };
      
      const response = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUser);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email non valida');
    });
    
    test('Dovrebbe restituire 400 se il ruolo non è valido', async () => {
      const invalidUser = {
        name: 'Invalid Role User',
        email: 'valid@example.com',
        password: 'password123',
        role: 'invalid_role'
      };
      
      const response = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUser);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Ruolo non valido');
    });
    
    test('Dovrebbe restituire 400 se mancano dati obbligatori', async () => {
      const incompleteUser = {
        name: 'Incomplete User',
        // Manca email
        password: 'password123',
        role: 'client'
      };
      
      const response = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteUser);
      
      expect(response.status).toBe(400);
    });
  });
}); 