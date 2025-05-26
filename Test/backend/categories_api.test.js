const request = require('supertest');
const app = require('./__mocks__/app');
const db = require('./__mocks__/db');

// Mock delle risposte del database
jest.mock('../models/db', () => require('./__mocks__/db'));

describe('Categories API Tests', () => {
  // Ripristina i mock prima di ogni test
  beforeEach(() => {
    db.query.mockClear();
  });

  test('GET /categories dovrebbe restituire tutte le categorie', async () => {
    // Mock della risposta del database
    const mockCategories = [
      { id: 21, name: 'Lattiero-Caseari', description: 'Prodotti del latte tipici', dad_id: 1 },
      { id: 22, name: 'Carne e Salumi', description: 'Tutti i migliori tagli di carne', dad_id: 1 }
    ];
    
    // Mock per le query: categories e images
    db.query.mockImplementationOnce(() => [[...mockCategories]]);
    db.query.mockImplementationOnce(() => [[{ category_id: 21, url: '/Media/category/21/image.webp' }]]);
    // Mock per query su allCategories
    db.query.mockImplementationOnce(() => [[
      { id: 21, dad_id: 1 },
      { id: 22, dad_id: 1 },
      { id: 24, dad_id: 21 },
      { id: 25, dad_id: 21 }
    ]]);
    // Mock per conteggio prodotti
    db.query.mockImplementation(() => [[{ product_count: 5 }]]);
    
    const response = await request(app)
      .get('/categories');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('name', 'Lattiero-Caseari');
    expect(response.body[0]).toHaveProperty('image');
    expect(response.body[0]).toHaveProperty('product_count');
  });

  test('GET /categories/:id dovrebbe restituire una categoria specifica', async () => {
    // Mock della risposta del database
    const mockCategory = { id: 21, name: 'Lattiero-Caseari', description: 'Prodotti del latte tipici', dad_id: 1 };
    const mockImage = { url: '/Media/category/21/image.webp' };
    
    db.query.mockImplementationOnce(() => [[mockCategory]]);
    db.query.mockImplementationOnce(() => [[mockImage]]);
    
    const response = await request(app)
      .get('/categories/21');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 21);
    expect(response.body).toHaveProperty('name', 'Lattiero-Caseari');
    expect(response.body).toHaveProperty('image');
  });

  test('GET /categories/:id dovrebbe restituire 404 se la categoria non esiste', async () => {
    db.query.mockImplementationOnce(() => [[]]);
    
    const response = await request(app)
      .get('/categories/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Categoria non trovata');
  });

  test('POST /categories dovrebbe creare una nuova categoria', async () => {
    const newCategory = {
      name: 'Nuova Categoria',
      description: 'Descrizione della nuova categoria',
      dad_id: 1
    };
    
    // Mock per l'inserimento
    db.query.mockImplementationOnce(() => [{ insertId: 31 }]);
    // Mock per il recupero
    db.query.mockImplementationOnce(() => [[{ id: 31, ...newCategory }]]);
    
    const response = await request(app)
      .post('/categories')
      .send(newCategory);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id', 31);
    expect(response.body).toHaveProperty('name', 'Nuova Categoria');
  });

  test('POST /categories dovrebbe restituire 400 se name o dad_id mancano', async () => {
    const invalidCategory = {
      description: 'Descrizione senza nome'
      // name e dad_id mancanti
    };
    
    const response = await request(app)
      .post('/categories')
      .send(invalidCategory);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Nome e categoria padre sono obbligatori');
  });

  test('PUT /categories/:id dovrebbe aggiornare una categoria', async () => {
    const updatedCategory = {
      name: 'Categoria Aggiornata',
      description: 'Descrizione aggiornata',
      dad_id: 1
    };
    
    // Mock per verificare esistenza
    db.query.mockImplementationOnce(() => [[{ id: 21 }]]);
    // Mock per l'aggiornamento
    db.query.mockImplementationOnce(() => [{ affectedRows: 1 }]);
    // Mock per il recupero post-aggiornamento
    db.query.mockImplementationOnce(() => [[{ id: 21, ...updatedCategory }]]);
    
    const response = await request(app)
      .put('/categories/21')
      .send(updatedCategory);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 21);
    expect(response.body).toHaveProperty('name', 'Categoria Aggiornata');
  });

  test('PUT /categories/:id dovrebbe restituire 404 se la categoria non esiste', async () => {
    db.query.mockImplementationOnce(() => [[]]);
    
    const response = await request(app)
      .put('/categories/999')
      .send({ name: 'Test', description: 'Test', dad_id: 1 });
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Categoria non trovata');
  });

  test('DELETE /categories/:id dovrebbe eliminare una categoria', async () => {
    // Mock per verificare esistenza
    db.query.mockImplementationOnce(() => [[{ id: 30 }]]);
    // Mock per verificare che non ci siano categorie figlie
    db.query.mockImplementationOnce(() => [[]]);
    // Mock per l'eliminazione
    db.query.mockImplementationOnce(() => [{ affectedRows: 1 }]);
    
    const response = await request(app)
      .delete('/categories/30');
    
    expect(response.status).toBe(204);
  });

  test('DELETE /categories/:id dovrebbe restituire 400 se ci sono categorie figlie', async () => {
    // Mock per verificare esistenza
    db.query.mockImplementationOnce(() => [[{ id: 21 }]]);
    // Mock per verificare categorie figlie (ci sono figli)
    db.query.mockImplementationOnce(() => [[{ id: 24 }, { id: 25 }]]);
    
    const response = await request(app)
      .delete('/categories/21');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Impossibile eliminare la categoria: contiene sottocategorie e/o prodotti associati');
  });
}); 