const request = require('supertest');
const app = require('./__mocks__/app');
const db = require('./__mocks__/db');
const bcrypt = require('bcrypt');

// Mock delle risposte del database
jest.mock('../models/db', () => require('./__mocks__/db'));
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('mocked_hash'),
  compare: jest.fn().mockResolvedValue(true)
}));

describe('Users API Tests', () => {
  // Ripristina i mock prima di ogni test
  beforeEach(() => {
    db.query.mockClear();
    bcrypt.hash.mockClear();
  });

  test('GET /users dovrebbe restituire gli utenti con paginazione', async () => {
    // Mock della risposta del database
    const mockUsers = [
      { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin', created_at: '2023-01-01T12:00:00Z' },
      { id: 2, name: 'Client User', email: 'client@example.com', role: 'client', created_at: '2023-01-02T12:00:00Z' }
    ];
    
    db.query.mockImplementationOnce(() => [mockUsers]);
    db.query.mockImplementationOnce(() => [[{ total: 50 }]]);
    
    const response = await request(app)
      .get('/users?page=1&limit=10')
      .set('Authorization', 'Bearer admin_token');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('users');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toHaveProperty('total', 50);
    expect(response.body.users).toEqual(mockUsers);
  });

  test('GET /users/artisans dovrebbe restituire gli artisani', async () => {
    // Mock della risposta del database
    const mockArtisans = [
      { id: 3, name: 'Artisan 1', created_at: '2023-01-01T12:00:00Z', image: '/Media/profile/3/profile.webp', url_banner: '/Media/banner/3/banner.webp', bio: 'Bio artisan 1', approved_at: '2023-01-01T12:00:00Z' },
      { id: 4, name: 'Artisan 2', created_at: '2023-01-02T12:00:00Z', image: '/Media/profile/4/profile.webp', url_banner: '/Media/banner/4/banner.webp', bio: 'Bio artisan 2', approved_at: '2023-01-02T12:00:00Z' }
    ];
    
    db.query.mockImplementationOnce(() => [mockArtisans]);
    db.query.mockImplementationOnce(() => [[{ total: 20 }]]);
    
    const response = await request(app)
      .get('/users/artisans?page=1&limit=10');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toHaveProperty('total', 20);
    expect(response.body.data).toEqual(mockArtisans);
  });

  test('GET /users/artisans?id=3 dovrebbe restituire un singolo artisano', async () => {
    // Mock della risposta del database
    const mockArtisan = {
      id: 3,
      name: 'Artisan 1',
      created_at: '2023-01-01T12:00:00Z',
      image: '/Media/profile/3/profile.webp',
      url_banner: '/Media/banner/3/banner.webp',
      bio: 'Bio artisan 1',
      approved_at: '2023-01-01T12:00:00Z'
    };
    
    db.query.mockImplementationOnce(() => [[mockArtisan]]);
    
    const response = await request(app)
      .get('/users/artisans?id=3');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data', mockArtisan);
  });

  test('GET /users/counts dovrebbe restituire i conteggi degli utenti', async () => {
    db.query.mockImplementationOnce(() => [[{ clients: 30 }]]);
    db.query.mockImplementationOnce(() => [[{ artisans: 15 }]]);
    db.query.mockImplementationOnce(() => [[{ admins: 5 }]]);
    db.query.mockImplementationOnce(() => [[{ total: 50 }]]);
    
    const response = await request(app)
      .get('/users/counts')
      .set('Authorization', 'Bearer admin_token');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('clients', 30);
    expect(response.body).toHaveProperty('artisans', 15);
    expect(response.body).toHaveProperty('admins', 5);
    expect(response.body).toHaveProperty('total', 50);
  });

  test('POST /users dovrebbe creare un nuovo utente', async () => {
    const newUser = {
      name: 'New User',
      email: 'new@example.com',
      password: 'password123',
      role: 'client'
    };
    
    // Mock per verificare l'email non esistente
    db.query.mockImplementationOnce(() => [[]]);
    // Mock per l'inserimento
    db.query.mockImplementationOnce(() => [{ insertId: 100 }]);
    
    const response = await request(app)
      .post('/users')
      .set('Authorization', 'Bearer admin_token')
      .send(newUser);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', 100);
    expect(response.body).toHaveProperty('name', 'New User');
    expect(response.body).toHaveProperty('email', 'new@example.com');
    expect(response.body).toHaveProperty('role', 'client');
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
  });

  test('POST /users dovrebbe restituire 400 se l\'email è già registrata', async () => {
    const newUser = {
      name: 'New User',
      email: 'existing@example.com',
      password: 'password123',
      role: 'client'
    };
    
    // Mock per verificare l'email esistente
    db.query.mockImplementationOnce(() => [[{ id: 50 }]]);
    
    const response = await request(app)
      .post('/users')
      .set('Authorization', 'Bearer admin_token')
      .send(newUser);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Email già registrata');
  });

  test('GET /users/:id dovrebbe restituire un utente specifico', async () => {
    // Mock della risposta del database
    const mockUser = {
      id: 1,
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      created_at: '2023-01-01T12:00:00Z'
    };
    
    db.query.mockImplementationOnce(() => [[mockUser]]);
    
    const response = await request(app)
      .get('/users/1')
      .set('Authorization', 'Bearer admin_token');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUser);
  });

  test('GET /users/:id dovrebbe restituire 403 se l\'utente non ha i permessi', async () => {
    const response = await request(app)
      .get('/users/1')
      .set('Authorization', 'Bearer client_token');
    
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error', 'Non hai i permessi per visualizzare questo profilo');
  });

  test('PUT /users/:id dovrebbe aggiornare un utente', async () => {
    const updatedUser = {
      name: 'Updated Name',
      email: 'updated@example.com'
    };
    
    // Mock per verificare che l'utente esista
    db.query.mockImplementationOnce(() => [[{ id: 1 }]]);
    // Mock per verificare che l'email non sia già in uso
    db.query.mockImplementationOnce(() => [[]]);
    // Mock per l'aggiornamento
    db.query.mockImplementationOnce(() => [{ affectedRows: 1 }]);
    // Mock per il recupero post-aggiornamento
    db.query.mockImplementationOnce(() => [[{ id: 1, ...updatedUser, role: 'admin', created_at: '2023-01-01T12:00:00Z' }]]);
    
    const response = await request(app)
      .put('/users/1')
      .set('Authorization', 'Bearer admin_token')
      .send(updatedUser);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('name', 'Updated Name');
    expect(response.body).toHaveProperty('email', 'updated@example.com');
  });

  test('PUT /users/:id dovrebbe restituire 400 se l\'email è già in uso', async () => {
    const updatedUser = {
      name: 'Updated Name',
      email: 'existing@example.com'
    };
    
    // Mock per verificare che l'utente esista
    db.query.mockImplementationOnce(() => [[{ id: 1 }]]);
    // Mock per verificare che l'email sia già in uso
    db.query.mockImplementationOnce(() => [[{ id: 2 }]]);
    
    const response = await request(app)
      .put('/users/1')
      .set('Authorization', 'Bearer admin_token')
      .send(updatedUser);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Email già in uso');
  });

  test('DELETE /users/:id dovrebbe eliminare un utente', async () => {
    // Mock per verificare che l'utente esista
    db.query.mockImplementationOnce(() => [[{ id: 1 }]]);
    // Mock per l'eliminazione
    db.query.mockImplementationOnce(() => [{ affectedRows: 1 }]);
    
    const response = await request(app)
      .delete('/users/1')
      .set('Authorization', 'Bearer admin_token');
    
    expect(response.status).toBe(204);
  });

  test('PUT /users/:id/approve dovrebbe approvare un artigiano', async () => {
    // Mock per l'aggiornamento del ruolo
    db.query.mockImplementationOnce(() => [{ affectedRows: 1 }]);
    // Mock per l'aggiornamento dello stato di approvazione
    db.query.mockImplementationOnce(() => [{ affectedRows: 1 }]);
    
    const response = await request(app)
      .put('/users/3/approve')
      .set('Authorization', 'Bearer admin_token');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Utente approvato con successo');
    expect(db.query).toHaveBeenCalledTimes(2);
  });
}); 