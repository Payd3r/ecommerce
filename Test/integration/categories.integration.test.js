/**
 * Test di integrazione per le API delle categorie
 * Questi test si connettono al backend reale in esecuzione su localhost:3015
 */
const request = require('supertest');
const { setupTestEnvironment, teardownTestEnvironment, getAuthToken } = require('./config');

let app;
let adminToken;
let clientToken;

describe('Categories API Integration Tests', () => {
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
  
  // Variabili per i test
  let categoryId;
  
  test('Dovrebbe restituire tutte le categorie', async () => {
    const response = await request(app)
      .get('/categories');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    
    // Salva un ID di categoria per i test successivi
    categoryId = response.body[0].id;
  });
  
  test('Dovrebbe restituire una categoria specifica', async () => {
    const response = await request(app)
      .get(`/categories/${categoryId}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', categoryId);
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('description');
  });
  
  test('Dovrebbe restituire 404 per una categoria inesistente', async () => {
    const response = await request(app)
      .get('/categories/9999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Categoria non trovata');
  });
  
  // Test del flusso completo CRUD
  describe('CRUD operations', () => {
    let createdCategoryId;
    
    test('Dovrebbe creare una nuova categoria (admin)', async () => {
      const newCategory = {
        name: 'Categoria Test Integration',
        description: 'Categoria creata per il test di integrazione',
        dad_id: 1 // Root category
      };
      
      const response = await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newCategory);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Categoria Test Integration');
      
      createdCategoryId = response.body.id;
    });
    
    test('Dovrebbe aggiornare la categoria creata (admin)', async () => {
      const updatedCategory = {
        name: 'Categoria Test Updated',
        description: 'Descrizione aggiornata',
        dad_id: 1
      };
      
      const response = await request(app)
        .put(`/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedCategory);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', createdCategoryId);
      expect(response.body).toHaveProperty('name', 'Categoria Test Updated');
    });
    
    test('Dovrebbe impedire a un client di aggiornare una categoria', async () => {
      const updatedCategory = {
        name: 'Categoria Test Client Update',
        description: 'Descrizione aggiornata da client',
        dad_id: 1
      };
      
      const response = await request(app)
        .put(`/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updatedCategory);
      
      expect(response.status).toBe(403);
    });
    
    test('Dovrebbe eliminare la categoria creata (admin)', async () => {
      const response = await request(app)
        .delete(`/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(204);
      
      // Verifica che la categoria sia stata effettivamente eliminata
      const checkResponse = await request(app)
        .get(`/categories/${createdCategoryId}`);
      
      expect(checkResponse.status).toBe(404);
    });
  });
  
  // Test dell'albero delle categorie
  test('Dovrebbe restituire l\'albero delle categorie', async () => {
    const response = await request(app)
      .get('/categories/tree');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // Verifica la struttura dell'albero
    if (response.body.length > 0) {
      const firstCategory = response.body[0];
      expect(firstCategory).toHaveProperty('id');
      expect(firstCategory).toHaveProperty('name');
      
      // Se ha figli, verifica la struttura dei figli
      if (firstCategory.children && firstCategory.children.length > 0) {
        expect(Array.isArray(firstCategory.children)).toBe(true);
        expect(firstCategory.children[0]).toHaveProperty('id');
        expect(firstCategory.children[0]).toHaveProperty('name');
      }
    }
  });
}); 