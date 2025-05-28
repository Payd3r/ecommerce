const { chai, app, expect, config } = require('../setup');
const { generateToken, createTestUser, createTestCategory } = require('../utils/testHelpers');

describe('API Categories - Test Integrativi', () => {
  let adminUser, adminToken, clientUser, clientToken, rootCategoryId, testCategory;

  // Prepara i dati di test prima dei test
  before(async () => {
    // Crea un admin di test
    adminUser = await createTestUser({
      email: 'admincategories@test.com',
      password: 'Password123',
      name: 'Admin Categories',
      role: 'admin'
    });

    // Crea un client di test
    clientUser = await createTestUser({
      email: 'clientcategories@test.com',
      password: 'Password123',
      name: 'Client Categories',
      role: 'client'
    });

    // Genera token
    adminToken = generateToken(adminUser);
    clientToken = generateToken(clientUser);

    // Trova l'ID della categoria root
    const connection = await require('../utils/testHelpers').getTestDbConnection();
    try {
      const [rootCategory] = await connection.query('SELECT id FROM categories WHERE name = "root"');
      rootCategoryId = rootCategory[0].id;
    } finally {
      await connection.end();
    }

    // Crea una categoria di test
    testCategory = await createTestCategory({
      name: 'Categoria Test',
      description: 'Categoria per test integrativi',
      dad_id: rootCategoryId
    });
  });

  // Test per ottenere tutte le categorie
  describe('GET /categories', () => {
    it('dovrebbe restituire tutte le categorie', (done) => {
      chai.request(app)
        .get('/categories')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.be.at.least(1);
          expect(res.body[0]).to.have.property('id');
          expect(res.body[0]).to.have.property('name');
          expect(res.body[0]).to.have.property('product_count');
          done();
        });
    });
  });

  // Test per ottenere l'albero delle categorie
  describe('GET /categories/tree', () => {
    it('dovrebbe restituire l\'albero completo delle categorie', (done) => {
      chai.request(app)
        .get('/categories/tree')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          
          // Se ci sono categorie con figli, controlliamo la struttura ad albero
          if (res.body.some(cat => cat.children)) {
            const categoryWithChildren = res.body.find(cat => cat.children);
            expect(categoryWithChildren.children).to.be.an('array');
          }
          
          done();
        });
    });
  });

  // Test per ottenere una categoria specifica
  describe('GET /categories/:id', () => {
    it('dovrebbe restituire una categoria specifica', (done) => {
      chai.request(app)
        .get(`/categories/${testCategory.id}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('id').equal(testCategory.id);
          expect(res.body).to.have.property('name').equal(testCategory.name);
          expect(res.body).to.have.property('description').equal(testCategory.description);
          done();
        });
    });

    it('dovrebbe restituire 404 per una categoria inesistente', (done) => {
      chai.request(app)
        .get('/categories/9999')
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });
  });

  // Test per creare una nuova categoria
  describe('POST /categories', () => {
    it('dovrebbe creare una nuova categoria', (done) => {
      const categoryData = {
        name: 'Nuova Categoria',
        description: 'Descrizione nuova categoria',
        dad_id: rootCategoryId
      };

      chai.request(app)
        .post('/categories')
        .send(categoryData)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('name').equal(categoryData.name);
          expect(res.body).to.have.property('description').equal(categoryData.description);
          expect(res.body).to.have.property('dad_id').equal(categoryData.dad_id);
          done();
        });
    });

    it('dovrebbe creare una sottocategoria', (done) => {
      const subcategoryData = {
        name: 'Sottocategoria',
        description: 'Descrizione sottocategoria',
        dad_id: testCategory.id
      };

      chai.request(app)
        .post('/categories')
        .send(subcategoryData)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('name').equal(subcategoryData.name);
          expect(res.body).to.have.property('dad_id').equal(subcategoryData.dad_id);
          done();
        });
    });

    it('dovrebbe rifiutare la creazione di una categoria senza nome', (done) => {
      const incompleteCategoryData = {
        description: 'Descrizione senza nome',
        dad_id: rootCategoryId
      };

      chai.request(app)
        .post('/categories')
        .send(incompleteCategoryData)
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it('dovrebbe rifiutare la creazione di una categoria senza categoria padre', (done) => {
      const incompleteCategoryData = {
        name: 'Categoria Senza Padre',
        description: 'Descrizione categoria senza padre'
      };

      chai.request(app)
        .post('/categories')
        .send(incompleteCategoryData)
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  // Test per aggiornare una categoria
  describe('PUT /categories/:id', () => {
    it('dovrebbe aggiornare una categoria esistente', (done) => {
      const updateData = {
        name: 'Categoria Aggiornata',
        description: 'Descrizione aggiornata',
        dad_id: rootCategoryId
      };

      chai.request(app)
        .put(`/categories/${testCategory.id}`)
        .send(updateData)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('id').equal(testCategory.id);
          expect(res.body).to.have.property('name').equal(updateData.name);
          expect(res.body).to.have.property('description').equal(updateData.description);
          done();
        });
    });

    it('dovrebbe rifiutare l\'aggiornamento con una categoria padre uguale a se stessa', (done) => {
      const invalidUpdateData = {
        name: 'Categoria Ciclo',
        description: 'Descrizione categoria ciclo',
        dad_id: testCategory.id // ID uguale a quello della categoria che stiamo aggiornando
      };

      chai.request(app)
        .put(`/categories/${testCategory.id}`)
        .send(invalidUpdateData)
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it('dovrebbe restituire 404 per l\'aggiornamento di una categoria inesistente', (done) => {
      const updateData = {
        name: 'Categoria Inesistente',
        description: 'Descrizione categoria inesistente',
        dad_id: rootCategoryId
      };

      chai.request(app)
        .put('/categories/9999')
        .send(updateData)
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });
  });

  // Test per eliminare una categoria
  describe('DELETE /categories/:id', () => {
    let categoryToDelete;

    before(async () => {
      // Crea una categoria da eliminare
      categoryToDelete = await createTestCategory({
        name: 'Categoria Da Eliminare',
        description: 'Questa categoria verrà eliminata',
        dad_id: rootCategoryId
      });
    });

    it('dovrebbe eliminare una categoria senza figli', (done) => {
      chai.request(app)
        .delete(`/categories/${categoryToDelete.id}`)
        .end((err, res) => {
          expect(res).to.have.status(204);
          
          // Verifica che la categoria sia stata effettivamente eliminata
          chai.request(app)
            .get(`/categories/${categoryToDelete.id}`)
            .end((err, res) => {
              expect(res).to.have.status(404);
              done();
            });
        });
    });

    it('dovrebbe rifiutare l\'eliminazione di una categoria con sottocategorie', (done) => {
      // Prima creiamo una categoria e una sottocategoria
      createTestCategory({
        name: 'Categoria Padre',
        description: 'Categoria padre con figli',
        dad_id: rootCategoryId
      }).then(parentCategory => {
        createTestCategory({
          name: 'Categoria Figlio',
          description: 'Sottocategoria',
          dad_id: parentCategory.id
        }).then(() => {
          // Ora tentiamo di eliminare la categoria padre
          chai.request(app)
            .delete(`/categories/${parentCategory.id}`)
            .end((err, res) => {
              expect(res).to.have.status(400);
              done();
            });
        });
      });
    });

    it('dovrebbe restituire 404 per l\'eliminazione di una categoria inesistente', (done) => {
      chai.request(app)
        .delete('/categories/9999')
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });
  });

  // Test per verificare il comportamento dell'albero delle categorie
  describe('Struttura ad albero delle categorie', () => {
    let parentCategory, childCategory1, childCategory2, grandchildCategory;

    before(async () => {
      // Crea una struttura ad albero per i test
      parentCategory = await createTestCategory({
        name: 'Categoria Albero',
        description: 'Categoria padre per test albero',
        dad_id: rootCategoryId
      });
      
      childCategory1 = await createTestCategory({
        name: 'Figlio 1',
        description: 'Prima sottocategoria',
        dad_id: parentCategory.id
      });
      
      childCategory2 = await createTestCategory({
        name: 'Figlio 2',
        description: 'Seconda sottocategoria',
        dad_id: parentCategory.id
      });
      
      grandchildCategory = await createTestCategory({
        name: 'Nipote',
        description: 'Categoria di terzo livello',
        dad_id: childCategory1.id
      });
    });

    it('dovrebbe restituire un albero con la struttura corretta', (done) => {
      chai.request(app)
        .get('/categories/tree')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          
          // Cerca la categoria principale nell'albero
          const parentInTree = res.body.find(cat => cat.id === parentCategory.id);
          expect(parentInTree).to.exist;
          expect(parentInTree).to.have.property('children').to.be.an('array');
          expect(parentInTree.children.length).to.equal(2);
          
          // Cerca le sottocategorie
          const child1InTree = parentInTree.children.find(cat => cat.id === childCategory1.id);
          expect(child1InTree).to.exist;
          expect(child1InTree).to.have.property('children').to.be.an('array');
          expect(child1InTree.children.length).to.equal(1);
          
          // Cerca la categoria di terzo livello
          const grandchildInTree = child1InTree.children.find(cat => cat.id === grandchildCategory.id);
          expect(grandchildInTree).to.exist;
          
          done();
        });
    });
  });
}); 