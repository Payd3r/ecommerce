const request = require('supertest');
const app = require('./__mocks__/app');
const db = require('./__mocks__/db');

// Mock delle risposte del database
jest.mock('../models/db', () => require('./__mocks__/db'));

describe('Address API Tests', () => {
  // Ripristina i mock prima di ogni test
  beforeEach(() => {
    db.query.mockClear();
  });

  test('GET /address/me dovrebbe restituire l\'indirizzo dell\'utente loggato', async () => {
    // Mock della risposta del database
    const mockAddress = {
      id: 1,
      user_id: 1,
      stato: 'Italia',
      citta: 'Milano',
      provincia: 'MI',
      via: 'Via Monte Napoleone',
      cap: '20121',
      numero_civico: 12,
      name: 'Antonio',
      surname: 'Rossi'
    };
    
    db.query.mockImplementationOnce(() => [[mockAddress]]);
    
    const response = await request(app)
      .get('/address/me')
      .set('Authorization', 'Bearer valid_token'); // Il middleware verifyToken è mockato
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toEqual(mockAddress);
  });

  test('GET /address/me dovrebbe restituire null se l\'utente non ha un indirizzo', async () => {
    db.query.mockImplementationOnce(() => [[]]);
    
    const response = await request(app)
      .get('/address/me')
      .set('Authorization', 'Bearer valid_token');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data', null);
  });

  test('POST /address dovrebbe creare un nuovo indirizzo se non esiste', async () => {
    const newAddress = {
      stato: 'Italia',
      citta: 'Roma',
      provincia: 'RM',
      via: 'Via del Corso',
      cap: '00186',
      numero_civico: 45,
      name: 'Mario',
      surname: 'Bianchi'
    };
    
    // Mock per verificare se esiste già un indirizzo
    db.query.mockImplementationOnce(() => [[]]);
    // Mock per l'inserimento
    db.query.mockImplementationOnce(() => [{ insertId: 5 }]);
    
    const response = await request(app)
      .post('/address')
      .set('Authorization', 'Bearer valid_token')
      .send(newAddress);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('user_id');
    expect(response.body.data).toHaveProperty('stato', 'Italia');
    expect(response.body.data).toHaveProperty('citta', 'Roma');
  });

  test('POST /address dovrebbe aggiornare un indirizzo esistente', async () => {
    const updatedAddress = {
      stato: 'Italia',
      citta: 'Roma',
      provincia: 'RM',
      via: 'Via del Corso',
      cap: '00186',
      numero_civico: 45,
      name: 'Mario',
      surname: 'Bianchi'
    };
    
    // Mock per verificare se esiste già un indirizzo (sì, esiste)
    db.query.mockImplementationOnce(() => [[{ id: 5, user_id: 1 }]]);
    // Mock per l'aggiornamento
    db.query.mockImplementationOnce(() => [{ affectedRows: 1 }]);
    
    const response = await request(app)
      .post('/address')
      .set('Authorization', 'Bearer valid_token')
      .send(updatedAddress);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
  });

  test('POST /address dovrebbe restituire 400 se mancano campi obbligatori', async () => {
    const invalidAddress = {
      stato: 'Italia',
      citta: 'Roma',
      // Altri campi mancanti
    };
    
    const response = await request(app)
      .post('/address')
      .set('Authorization', 'Bearer valid_token')
      .send(invalidAddress);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message', 'Tutti i campi sono obbligatori');
  });

  test('GET /address/user/:userId dovrebbe restituire l\'indirizzo di un utente specifico (admin)', async () => {
    // Mock della risposta del database
    const mockAddress = {
      id: 5,
      user_id: 2,
      stato: 'Italia',
      citta: 'Firenze',
      provincia: 'FI',
      via: 'Via dei Neri',
      cap: '50122',
      numero_civico: 23,
      name: 'Davide',
      surname: 'Ferrari'
    };
    
    db.query.mockImplementationOnce(() => [[mockAddress]]);
    
    const response = await request(app)
      .get('/address/user/2')
      .set('Authorization', 'Bearer valid_token'); // Presuppone che il token sia di un admin
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toEqual(mockAddress);
  });

  test('GET /address/user/:userId dovrebbe restituire 403 se non admin o artisan', async () => {
    // Supponiamo che il verifyToken mock sia configurato per restituire un utente client
    const response = await request(app)
      .get('/address/user/2')
      .set('Authorization', 'Bearer client_token'); // Token di un client
    
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message', 'Non autorizzato');
  });
}); 