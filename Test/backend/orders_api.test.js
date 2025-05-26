const request = require('supertest');
const app = require('./__mocks__/app');
const db = require('./__mocks__/db');

// Mock delle risposte del database e altre dipendenze
jest.mock('../models/db', () => require('./__mocks__/db'));
jest.mock('stripe', () => {
  return function() {
    return {
      paymentIntents: {
        create: jest.fn().mockResolvedValue({ client_secret: 'test_client_secret' }),
        retrieve: jest.fn().mockResolvedValue({ status: 'succeeded' })
      }
    };
  };
});

describe('Orders API Tests', () => {
  // Simula un utente autenticato per i test
  const authUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'client'
  };
  
  // Ripristina i mock prima di ogni test
  beforeEach(() => {
    db.query.mockClear();
    db.getConnection.mockClear();
  });

  test('GET /orders dovrebbe restituire tutti gli ordini', async () => {
    // Mock della risposta del database
    const mockOrders = [
      { id: 1, client_id: 1, total_price: 100.00, status: 'pending', created_at: '2023-01-01T12:00:00Z' },
      { id: 2, client_id: 1, total_price: 150.00, status: 'accepted', created_at: '2023-01-02T12:00:00Z' }
    ];
    
    db.query.mockImplementationOnce(() => [mockOrders]);
    
    const response = await request(app)
      .get('/orders')
      .set('Authorization', 'Bearer valid_token'); // Il middleware verifyToken è mockato
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockOrders);
  });

  test('GET /orders?clientId=1 dovrebbe restituire gli ordini di un cliente specifico', async () => {
    // Mock della risposta del database
    const mockOrders = [
      { id: 1, client_id: 1, total_price: 100.00, status: 'pending', created_at: '2023-01-01T12:00:00Z' }
    ];
    
    db.query.mockImplementationOnce(() => [mockOrders]);
    
    const response = await request(app)
      .get('/orders?clientId=1')
      .set('Authorization', 'Bearer valid_token');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockOrders);
  });

  test('POST /orders dovrebbe creare un nuovo ordine', async () => {
    const newOrder = {
      client_id: 1,
      total_price: 100.00,
      status: 'pending'
    };
    
    // Mock per l'inserimento e il recupero
    db.query.mockImplementationOnce(() => [{ insertId: 3 }]);
    db.query.mockImplementationOnce(() => [[{ id: 3, ...newOrder }]]);
    
    const response = await request(app)
      .post('/orders')
      .send(newOrder);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', 3);
    expect(response.body).toHaveProperty('client_id', 1);
    expect(response.body).toHaveProperty('total_price', 100.00);
  });

  test('POST /orders dovrebbe restituire 400 se mancano client_id o total_price', async () => {
    const invalidOrder = {
      // client_id mancante
      total_price: 100.00
    };
    
    const response = await request(app)
      .post('/orders')
      .send(invalidOrder);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'client_id e total_price sono obbligatori');
  });

  test('POST /orders/checkout dovrebbe creare un ordine dal carrello', async () => {
    // Mock delle connessioni e transazioni
    const mockConnection = {
      query: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    
    db.getConnection.mockResolvedValue(mockConnection);
    
    // Mock delle query sul carrello
    mockConnection.query.mockResolvedValueOnce([[{ id: 1 }]]); // Trova carrello
    mockConnection.query.mockResolvedValueOnce([[ // Prendi items
      { product_id: 1, quantity: 2, price: 10.00, discount: 0, name: 'Prodotto 1' },
      { product_id: 2, quantity: 1, price: 20.00, discount: 10, name: 'Prodotto 2' }
    ]]);
    mockConnection.query.mockResolvedValueOnce([{ insertId: 4 }]); // Crea ordine
    mockConnection.query.mockResolvedValueOnce([]); // Inserisci order_items (prima)
    mockConnection.query.mockResolvedValueOnce([]); // Inserisci order_items (seconda)
    mockConnection.query.mockResolvedValueOnce([]); // Svuota carrello
    
    const response = await request(app)
      .post('/orders/checkout')
      .set('Authorization', 'Bearer valid_token')
      .send({ userId: 1 });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('order_id', 4);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.commit).toHaveBeenCalled();
    expect(mockConnection.release).toHaveBeenCalled();
  });

  test('PUT /orders/:orderId dovrebbe aggiornare lo stato di un ordine', async () => {
    // Mock delle query per verificare l'ordine e aggiornarlo
    db.query.mockImplementationOnce(() => [[{ status: 'pending', client_id: 1 }]]);
    db.query.mockImplementationOnce(() => [{ affectedRows: 1 }]);
    
    const response = await request(app)
      .put('/orders/1')
      .set('Authorization', 'Bearer valid_token')
      .send({ status: 'accepted' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Stato ordine aggiornato (admin)');
  });

  test('PUT /orders/:orderId dovrebbe restituire 400 se lo stato non è valido', async () => {
    const response = await request(app)
      .put('/orders/1')
      .set('Authorization', 'Bearer valid_token')
      .send({ }); // Stato mancante
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('DELETE /orders/:orderId dovrebbe eliminare un ordine', async () => {
    // Mock per ottenere gli order_items
    db.query.mockImplementationOnce(() => [[{ product_id: 1, quantity: 2 }]]);
    // Mock per restituire le scorte al magazzino
    db.query.mockImplementationOnce(() => [{ affectedRows: 1 }]);
    // Mock per eliminare gli order_items
    db.query.mockImplementationOnce(() => [{ affectedRows: 1 }]);
    // Mock per eliminare l'ordine
    db.query.mockImplementationOnce(() => [{ affectedRows: 1 }]);
    
    const response = await request(app)
      .delete('/orders/1')
      .set('Authorization', 'Bearer valid_token');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Ordine eliminato');
  });

  test('POST /orders/create-payment-intent dovrebbe creare un intent di pagamento', async () => {
    // Mock per trovare il carrello
    db.query.mockImplementationOnce(() => [[{ id: 1 }]]);
    // Mock per gli items del carrello
    db.query.mockImplementationOnce(() => [[
      { quantity: 2, price: 10.00, discount: 0 },
      { quantity: 1, price: 20.00, discount: 10 }
    ]]);
    
    const response = await request(app)
      .post('/orders/create-payment-intent')
      .set('Authorization', 'Bearer valid_token')
      .send({ userId: 1 });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('clientSecret', 'test_client_secret');
  });
}); 