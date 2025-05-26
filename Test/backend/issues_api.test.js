const request = require('supertest');
const app = require('./__mocks__/app');
const db = require('./__mocks__/db');

// Mock delle risposte del database
jest.mock('../models/db', () => require('./__mocks__/db'));

describe('Issues API Tests', () => {
  // Ripristina i mock prima di ogni test
  beforeEach(() => {
    db.query.mockClear();
  });

  test('GET /issues dovrebbe restituire le segnalazioni con paginazione', async () => {
    // Mock per il conteggio totale
    db.query.mockImplementationOnce(() => [[{ total: 20 }]]);
    
    // Mock per la query paginata
    const mockIssues = [
      { 
        id_issue: 1, 
        title: 'Problema grafico', 
        client_name: 'Mario Rossi', 
        description: 'Bottoni disallineati per la login', 
        status: 'open', 
        created_at: '2023-01-01', 
        admin_note: null,
        id_client: 2
      },
      { 
        id_issue: 2, 
        title: 'Errore pagamento', 
        client_name: 'Luigi Bianchi', 
        description: 'Il pagamento con carta viene rifiutato senza motivo', 
        status: 'closed', 
        created_at: '2023-01-02', 
        admin_note: 'Risolto dal supporto tecnico.',
        id_client: 39
      }
    ];
    db.query.mockImplementationOnce(() => [mockIssues]);
    
    const response = await request(app)
      .get('/issues?page=1&pageSize=10');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('issues');
    expect(response.body).toHaveProperty('total', 20);
    expect(response.body.issues).toEqual(mockIssues);
    
    // Verifica la chiamata alla query con i parametri corretti
    expect(db.query).toHaveBeenCalledTimes(2);
    expect(db.query.mock.calls[1][1]).toEqual([10, 0]);
  });

  test('POST /issues dovrebbe creare una nuova segnalazione', async () => {
    const newIssue = {
      title: 'Problema con l\'ordine',
      description: 'Non ho ricevuto la conferma dell\'ordine via email',
      status: 'open',
      created_at: '2023-01-05',
      id_client: 40,
      admin_note: null
    };
    
    // Mock per l'inserimento
    db.query.mockImplementationOnce(() => [{ insertId: 5 }]);
    
    const response = await request(app)
      .post('/issues')
      .send(newIssue);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    
    // Verifica che la query sia stata chiamata con i parametri corretti
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][1]).toEqual([
      newIssue.title,
      newIssue.description,
      newIssue.status,
      newIssue.created_at,
      newIssue.id_client,
      newIssue.admin_note
    ]);
  });

  test('POST /issues dovrebbe restituire 400 se manca id_client', async () => {
    const invalidIssue = {
      title: 'Problema con l\'ordine',
      description: 'Non ho ricevuto la conferma dell\'ordine via email',
      status: 'open',
      created_at: '2023-01-05'
      // id_client mancante
    };
    
    const response = await request(app)
      .post('/issues')
      .send(invalidIssue);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'id_client obbligatorio per la creazione della segnalazione');
  });

  test('PUT /issues/:id dovrebbe aggiornare una segnalazione', async () => {
    const updatedIssue = {
      title: 'Problema risolto',
      description: 'Bottoni disallineati per la login',
      status: 'closed',
      created_at: '2023-01-01',
      admin_note: 'Fixato nel CSS'
    };
    
    // Mock per l'aggiornamento
    db.query.mockImplementationOnce(() => [{ affectedRows: 1 }]);
    
    const response = await request(app)
      .put('/issues/1')
      .send(updatedIssue);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    
    // Verifica che la query sia stata chiamata con i parametri corretti
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][1]).toEqual([
      updatedIssue.title,
      updatedIssue.description,
      updatedIssue.status,
      updatedIssue.created_at,
      updatedIssue.admin_note,
      '1' // ID dell'issue
    ]);
  });

  test('PUT /issues/:id dovrebbe gestire gli errori del database', async () => {
    // Mock per simulare un errore del database
    db.query.mockImplementationOnce(() => {
      throw new Error('Database error');
    });
    
    const response = await request(app)
      .put('/issues/1')
      .send({
        title: 'Problema aggiornato',
        description: 'Descrizione aggiornata',
        status: 'closed',
        created_at: '2023-01-01',
        admin_note: 'Nota aggiornata'
      });
    
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Errore nell\'aggiornamento della segnalazione');
  });
}); 