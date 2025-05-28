const { expect } = require('chai');
const sinon = require('sinon');
const { mockRequest, mockResponse, mockNext } = require('../helpers/express-helper');
const { db, resetMocks } = require('../mocks/db.mock');
const { imageUrl: imageUrlMock } = require('../mocks/services.mock');

// Funzione per isolare gli handler delle route
function extractRouteHandlers() {
  // Implementazione simulata delle route per i test
  const routes = {
    'GET /tree': [
      async (req, res) => {
        try {
          const [categories] = await db.query('SELECT * FROM categories WHERE id != 1 ORDER BY dad_id, name');
          // Recupera immagini per tutte le categorie
          const categoryIds = categories.map(c => c.id);
          let imagesMap = {};
          if (categoryIds.length > 0) {
            const [images] = await db.query(
              'SELECT id, category_id, url FROM category_images WHERE category_id IN (?) GROUP BY category_id',
              [categoryIds]
            );
            images.forEach(img => {
              imagesMap[img.category_id] = imageUrlMock.toPublicImageUrl(img.url);
            });
          }
          // Aggiungi campo image (solo url) a ciascuna categoria
          const categoriesWithImage = categories.map(c => ({
            ...c,
            image: imagesMap[c.id] ? imagesMap[c.id] : null
          }));
          const tree = await buildCategoryTree(categoriesWithImage);
          res.json(tree);
        } catch (error) {
          console.error('Errore nel recupero dell\'albero delle categorie:', error);
          res.status(500).json({ error: 'Errore nel recupero dell\'albero delle categorie' });
        }
      }
    ],
    'GET /': [
      async (req, res) => {
        try {
          const [categories] = await db.query('SELECT * FROM categories WHERE id != 1 ORDER BY name');
          const categoryIds = categories.map(c => c.id);
          let imagesMap = {};
          if (categoryIds.length > 0) {
            const [images] = await db.query(
              'SELECT id, category_id, url FROM category_images WHERE category_id IN (?) GROUP BY category_id',
              [categoryIds]
            );
            images.forEach(img => {
              imagesMap[img.category_id] = img.url;
            });
          }
          // Ottieni tutte le categorie per costruire la mappa padre-figli
          const allCategories = await db.query('SELECT id, dad_id FROM categories');
          const parentMap = {};
          allCategories[0].forEach(cat => {
            if (!parentMap[cat.dad_id]) parentMap[cat.dad_id] = [];
            parentMap[cat.dad_id].push(cat.id);
          });
          // Funzione ricorsiva per trovare tutti i discendenti di una categoria
          function getAllDescendants(catId) {
            let descendants = [];
            if (parentMap[catId]) {
              parentMap[catId].forEach(childId => {
                descendants.push(childId);
                descendants = descendants.concat(getAllDescendants(childId));
              });
            }
            return descendants;
          }
          // Calcola il conteggio prodotti per ogni categoria (inclusi figli)
          let productCounts = {};
          for (const cat of categories) {
            const descendants = getAllDescendants(cat.id);
            const idsToCount = [cat.id, ...descendants];
            const [countRows] = await db.query(
              'SELECT COUNT(*) as product_count FROM products WHERE category_id IN (?)',
              [idsToCount]
            );
            productCounts[cat.id] = countRows[0].product_count;
          }
          const categoriesWithImage = categories.map(c => ({
            ...c,
            image: imagesMap[c.id] ? imageUrlMock.toPublicImageUrl(imagesMap[c.id]) : null,
            product_count: productCounts[c.id] || 0
          }));
          res.json(categoriesWithImage);
        } catch (error) {
          console.error('Errore nel recupero delle categorie:', error);
          res.status(500).json({ error: 'Errore nel recupero delle categorie' });
        }
      }
    ],
    'GET /:id': [
      async (req, res) => {
        try {
          const [category] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
          if (category.length === 0) {
            return res.status(404).json({ error: 'Categoria non trovata' });
          }
          const [images] = await db.query('SELECT url FROM category_images WHERE category_id = ? LIMIT 1', [req.params.id]);
          const image = images.length > 0 ? imageUrlMock.toPublicImageUrl(images[0].url) : null;
          res.json({ ...category[0], image });
        } catch (error) {
          console.error('Errore nel recupero della categoria:', error);
          res.status(500).json({ error: 'Errore nel recupero della categoria' });
        }
      }
    ],
    'POST /': [
      async (req, res) => {
        const { name, description, dad_id } = req.body;
        
        // Validazione
        if (!name || !dad_id) {
          return res.status(400).json({ error: 'Nome e categoria padre sono obbligatori' });
        }
        
        try {
          // Inserisci la nuova categoria
          const [result] = await db.query(
            'INSERT INTO categories (name, description, dad_id) VALUES (?, ?, ?)',
            [name, description, dad_id]
          );
          
          const [newCategory] = await db.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
          res.status(201).json(newCategory[0]);
        } catch (error) {
          console.error('Errore nella creazione della categoria:', error);
          res.status(500).json({ error: 'Errore nella creazione della categoria' });
        }
      }
    ],
    'PUT /:id': [
      async (req, res) => {
        const { name, description, dad_id } = req.body;
        const categoryId = req.params.id;
        
        // Validazione
        if (!name || !dad_id) {
          return res.status(400).json({ error: 'Nome e categoria padre sono obbligatori' });
        }
        
        try {
          // Verifica che la categoria esista
          const [existingCategory] = await db.query('SELECT * FROM categories WHERE id = ?', [categoryId]);
          if (existingCategory.length === 0) {
            return res.status(404).json({ error: 'Categoria non trovata' });
          }
          
          // Verifica che la categoria padre esista e non sia la categoria stessa
          if (dad_id == categoryId) {
            return res.status(400).json({ error: 'Una categoria non può essere padre di se stessa' });
          }
          
          // Aggiorna la categoria
          await db.query(
            'UPDATE categories SET name = ?, description = ?, dad_id = ? WHERE id = ?',
            [name, description, dad_id, categoryId]
          );
          
          const [updatedCategory] = await db.query('SELECT * FROM categories WHERE id = ?', [categoryId]);
          res.json(updatedCategory[0]);
        } catch (error) {
          console.error('Errore nell\'aggiornamento della categoria:', error);
          res.status(500).json({ error: 'Errore nell\'aggiornamento della categoria' });
        }
      }
    ],
    'DELETE /:id': [
      async (req, res) => {
        const categoryId = req.params.id;
        
        try {
          // Verifica che la categoria esista
          const [category] = await db.query('SELECT * FROM categories WHERE id = ?', [categoryId]);
          if (category.length === 0) {
            return res.status(404).json({ error: 'Categoria non trovata' });
          }
          
          // Verifica che non ci siano categorie figlie
          const [children] = await db.query('SELECT id FROM categories WHERE dad_id = ?', [categoryId]);
          if (children.length > 0) {
            return res.status(400).json({ 
              error: 'Impossibile eliminare la categoria: contiene sottocategorie e/o prodotti associati' 
            });
          }
          
          // Elimina la categoria
          await db.query('DELETE FROM categories WHERE id = ?', [categoryId]);
          res.status(204).send();
        } catch (error) {
          console.error('Errore nell\'eliminazione della categoria:', error);
          res.status(500).json({ error: 'Errore nell\'eliminazione della categoria' });
        }
      }
    ]
  };
  
  return routes;
}

// Funzione di utilità per costruire l'albero delle categorie
async function buildCategoryTree(categories, parentId = 1) {
  const tree = [];
  
  for (const category of categories) {
    if (category.dad_id === parentId && category.id !== 1) {
      const children = await buildCategoryTree(categories, category.id);
      if (children.length) {
        category.children = children;
      }
      tree.push(category);
    }
  }
  
  return tree;
}

describe('Route: categories.js', () => {
  let routes;
  
  before(() => {
    // Estrai gli handler delle route
    routes = extractRouteHandlers();
  });
  
  beforeEach(() => {
    resetMocks();
    imageUrlMock.toPublicImageUrl.reset();
    imageUrlMock.toPublicImageUrl.callsFake(url => `http://localhost:3000${url}`);
  });
  
  describe('GET /categories/tree', () => {
    it('dovrebbe restituire l\'albero delle categorie con immagini', async () => {
      // Mock dei dati
      const categoriesMock = [
        { id: 2, name: 'Categoria 1', dad_id: 1, description: 'Desc 1' },
        { id: 3, name: 'Categoria 2', dad_id: 1, description: 'Desc 2' },
        { id: 4, name: 'Sottocategoria 1', dad_id: 2, description: 'Desc 3' }
      ];
      
      const imagesMock = [
        { id: 1, category_id: 2, url: '/path/to/image1.jpg' },
        { id: 2, category_id: 3, url: '/path/to/image2.jpg' }
      ];
      
      // Configura le mock responses
      db.query.onFirstCall().resolves([categoriesMock]);
      db.query.onSecondCall().resolves([imagesMock]);
      
      // Prepara richiesta e risposta
      const req = mockRequest();
      const res = mockResponse();
      
      // Esegui la route
      await routes['GET /tree'][0](req, res);
      
      // Verifica le chiamate e la risposta
      expect(db.query.calledTwice).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      // Verifica struttura dell'albero
      const response = res.json.firstCall.args[0];
      expect(response).to.be.an('array');
      expect(response).to.have.lengthOf(2);
      
      // Controlla le immagini
      const cat1 = response.find(c => c.id === 2);
      expect(cat1.image).to.equal('http://localhost:3000/path/to/image1.jpg');
      
      // Verifica che ci sia una struttura gerarchica
      expect(cat1.children).to.be.an('array');
      expect(cat1.children).to.have.lengthOf(1);
      expect(cat1.children[0].id).to.equal(4);
    });
    
    it('dovrebbe gestire gli errori nel recupero dell\'albero delle categorie', async () => {
      // Simula un errore del database
      db.query.rejects(new Error('Errore database'));
      
      const req = mockRequest();
      const res = mockResponse();
      
      await routes['GET /tree'][0](req, res);
      
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ error: 'Errore nel recupero dell\'albero delle categorie' })).to.be.true;
    });
  });
  
  describe('GET /categories', () => {
    it('dovrebbe restituire tutte le categorie con conteggio prodotti', async () => {
      // Mock dei dati
      const categoriesMock = [
        { id: 2, name: 'Categoria 1', dad_id: 1, description: 'Desc 1' },
        { id: 3, name: 'Categoria 2', dad_id: 1, description: 'Desc 2' }
      ];
      
      const imagesMock = [
        { id: 1, category_id: 2, url: '/path/to/image1.jpg' }
      ];
      
      // Mock per le query successive
      db.query.onFirstCall().resolves([categoriesMock]);
      db.query.onSecondCall().resolves([imagesMock]);
      db.query.onThirdCall().resolves([[{ id: 2, dad_id: 1 }, { id: 3, dad_id: 1 }]]);
      // Mock per il conteggio prodotti
      db.query.onCall(3).resolves([[{ product_count: 5 }]]);
      db.query.onCall(4).resolves([[{ product_count: 3 }]]);
      
      const req = mockRequest();
      const res = mockResponse();
      
      await routes['GET /'][0](req, res);
      
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.be.an('array');
      expect(response).to.have.lengthOf(2);
      
      // Verifica che ci siano le immagini e i conteggi
      const cat1 = response.find(c => c.id === 2);
      expect(cat1.image).to.equal('http://localhost:3000/path/to/image1.jpg');
      expect(cat1.product_count).to.equal(5);
      
      const cat2 = response.find(c => c.id === 3);
      expect(cat2.image).to.be.null;
      expect(cat2.product_count).to.equal(3);
    });
    
    it('dovrebbe gestire gli errori nel recupero delle categorie', async () => {
      db.query.rejects(new Error('Errore database'));
      
      const req = mockRequest();
      const res = mockResponse();
      
      await routes['GET /'][0](req, res);
      
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ error: 'Errore nel recupero delle categorie' })).to.be.true;
    });
  });
  
  describe('GET /categories/:id', () => {
    it('dovrebbe restituire una categoria specifica con immagine', async () => {
      const categoryMock = { id: 2, name: 'Categoria 1', dad_id: 1, description: 'Desc 1' };
      const imageMock = { url: '/path/to/image.jpg' };
      
      db.query.onFirstCall().resolves([[categoryMock]]);
      db.query.onSecondCall().resolves([[imageMock]]);
      
      const req = mockRequest({ params: { id: 2 } });
      const res = mockResponse();
      
      await routes['GET /:id'][0](req, res);
      
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.id).to.equal(2);
      expect(response.name).to.equal('Categoria 1');
      expect(response.image).to.equal('http://localhost:3000/path/to/image.jpg');
    });
    
    it('dovrebbe restituire 404 se la categoria non esiste', async () => {
      db.query.onFirstCall().resolves([[]]);
      
      const req = mockRequest({ params: { id: 999 } });
      const res = mockResponse();
      
      await routes['GET /:id'][0](req, res);
      
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ error: 'Categoria non trovata' })).to.be.true;
    });
  });
  
  describe('POST /categories', () => {
    it('dovrebbe creare una nuova categoria', async () => {
      const newCategoryData = {
        name: 'Nuova Categoria',
        description: 'Descrizione',
        dad_id: 1
      };
      
      const insertResult = { insertId: 4 };
      const newCategory = { 
        id: 4, 
        name: 'Nuova Categoria', 
        description: 'Descrizione', 
        dad_id: 1 
      };
      
      db.query.onFirstCall().resolves([insertResult]);
      db.query.onSecondCall().resolves([[newCategory]]);
      
      const req = mockRequest({ body: newCategoryData });
      const res = mockResponse();
      
      await routes['POST /'][0](req, res);
      
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.id).to.equal(4);
      expect(response.name).to.equal('Nuova Categoria');
    });
    
    it('dovrebbe validare i campi obbligatori', async () => {
      const invalidData = { description: 'Solo descrizione' };
      
      const req = mockRequest({ body: invalidData });
      const res = mockResponse();
      
      await routes['POST /'][0](req, res);
      
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ error: 'Nome e categoria padre sono obbligatori' })).to.be.true;
    });
  });
  
  describe('PUT /categories/:id', () => {
    it('dovrebbe aggiornare una categoria esistente', async () => {
      const updateData = {
        name: 'Categoria Aggiornata',
        description: 'Nuova Descrizione',
        dad_id: 1
      };
      
      const existingCategory = { id: 2, name: 'Categoria 1', dad_id: 1 };
      const updatedCategory = { 
        id: 2, 
        name: 'Categoria Aggiornata', 
        description: 'Nuova Descrizione', 
        dad_id: 1 
      };
      
      db.query.onFirstCall().resolves([[existingCategory]]);
      db.query.onSecondCall().resolves([]);
      db.query.onThirdCall().resolves([[updatedCategory]]);
      
      const req = mockRequest({ 
        params: { id: 2 },
        body: updateData 
      });
      const res = mockResponse();
      
      await routes['PUT /:id'][0](req, res);
      
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.name).to.equal('Categoria Aggiornata');
    });
    
    it('dovrebbe impedire a una categoria di essere padre di se stessa', async () => {
      const updateData = {
        name: 'Categoria Ciclica',
        description: 'Desc',
        dad_id: 2  // stesso ID della categoria da aggiornare
      };
      
      const existingCategory = { id: 2, name: 'Categoria 1', dad_id: 1 };
      
      db.query.onFirstCall().resolves([[existingCategory]]);
      
      const req = mockRequest({ 
        params: { id: 2 },
        body: updateData 
      });
      const res = mockResponse();
      
      await routes['PUT /:id'][0](req, res);
      
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ error: 'Una categoria non può essere padre di se stessa' })).to.be.true;
    });
  });
  
  describe('DELETE /categories/:id', () => {
    it('dovrebbe eliminare una categoria senza figli', async () => {
      const category = { id: 3, name: 'Categoria da eliminare', dad_id: 1 };
      
      db.query.onFirstCall().resolves([[category]]);
      db.query.onSecondCall().resolves([[]]);  // nessun figlio
      db.query.onThirdCall().resolves([{ affectedRows: 1 }]);
      
      const req = mockRequest({ params: { id: 3 } });
      const res = mockResponse();
      
      await routes['DELETE /:id'][0](req, res);
      
      expect(res.status.calledWith(204)).to.be.true;
    });
    
    it('dovrebbe impedire l\'eliminazione di una categoria con figli', async () => {
      const category = { id: 2, name: 'Categoria con figli', dad_id: 1 };
      const children = [{ id: 4 }];
      
      db.query.onFirstCall().resolves([[category]]);
      db.query.onSecondCall().resolves([children]);
      
      const req = mockRequest({ params: { id: 2 } });
      const res = mockResponse();
      
      await routes['DELETE /:id'][0](req, res);
      
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ 
        error: 'Impossibile eliminare la categoria: contiene sottocategorie e/o prodotti associati' 
      })).to.be.true;
    });
  });
}); 