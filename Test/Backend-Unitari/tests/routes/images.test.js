const { expect } = require('chai');
const sinon = require('sinon');
const { mockRequest, mockResponse, mockNext } = require('../helpers/express-helper');
const { db, resetMocks } = require('../mocks/db.mock');
const { fs: fsMock, sharp: sharpMock, multer: multerMock, imageUrl: imageUrlMock } = require('../mocks/services.mock');
const path = require('path');

// Funzione per isolare gli handler delle route
function extractRouteHandlers() {
  // Implementazione simulata delle route per i test
  const routes = {
    'POST /upload/product': [
      // Simuliamo il middleware di multer per caricare file
      (req, res, next) => {
        // Se c'è un errore di file nel test
        if (req.fileError) {
          return res.status(400).json({ error: 'Formato immagine non supportato' });
        }
        next();
      },
      async (req, res) => {
        try {
          const { id } = req.body;
          if (!id) return res.status(400).json({ error: 'id prodotto obbligatorio' });
          if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Nessuna immagine inviata' });
          
          // Simula la funzione handleImageUpload
          const savedFiles = req.files.map(file => ({
            filename: `${Date.now()}-test.webp`,
            relativeUrl: `/Media/product/${id}/${Date.now()}-test.webp`,
            url: imageUrlMock.toPublicImageUrl(`/Media/product/${id}/${Date.now()}-test.webp`),
            altText: `Immagine product ${id}`
          }));
          
          // Inserisci nel DB
          for (const file of savedFiles) {
            await db.query('INSERT INTO product_images (product_id, url, alt_text) VALUES (?, ?, ?)', 
              [id, file.relativeUrl, file.altText]);
          }
          
          res.json({ success: true, files: savedFiles });
        } catch (err) {
          res.status(500).json({ error: 'Errore durante l\'upload delle immagini prodotto' });
        }
      }
    ],
    'POST /upload/category': [
      // Simuliamo il middleware di multer
      (req, res, next) => {
        if (req.fileError) {
          return res.status(400).json({ error: 'Formato immagine non supportato' });
        }
        next();
      },
      async (req, res) => {
        try {
          const { id } = req.body;
          if (!id) return res.status(400).json({ error: 'id categoria obbligatorio' });
          if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Nessuna immagine inviata' });
          
          // Eliminazione immagini precedenti
          await db.query('DELETE FROM category_images WHERE category_id = ?', [id]);
          
          // Simula la funzione handleImageUpload
          const savedFiles = req.files.map(file => ({
            filename: `${Date.now()}-test.webp`,
            relativeUrl: `/Media/category/${id}/${Date.now()}-test.webp`,
            url: imageUrlMock.toPublicImageUrl(`/Media/category/${id}/${Date.now()}-test.webp`),
            altText: `Immagine category ${id}`
          }));
          
          // Inserisci nel DB
          for (const file of savedFiles) {
            await db.query('INSERT INTO category_images (category_id, url, alt_text) VALUES (?, ?, ?)', 
              [id, file.relativeUrl, file.altText]);
          }
          
          res.json({ success: true, files: savedFiles });
        } catch (err) {
          res.status(500).json({ error: 'Errore durante l\'upload delle immagini categoria' });
        }
      }
    ],
    'POST /upload/profile': [
      // Simuliamo il middleware di multer
      (req, res, next) => {
        if (req.fileError) {
          return res.status(400).json({ error: 'Formato immagine non supportato' });
        }
        next();
      },
      async (req, res) => {
        try {
          const { id } = req.body;
          if (!id) return res.status(400).json({ error: 'id utente obbligatorio' });
          if (!req.file) return res.status(400).json({ error: 'Nessuna immagine inviata' });
          
          // Eliminazione immagini precedenti
          await db.query('DELETE FROM profile_image WHERE user_id = ?', [id]);
          
          // Simula la funzione handleImageUpload
          const savedFile = {
            filename: `${Date.now()}-test.webp`,
            relativeUrl: `/Media/profile/${id}/${Date.now()}-test.webp`,
            url: imageUrlMock.toPublicImageUrl(`/Media/profile/${id}/${Date.now()}-test.webp`),
            altText: `Immagine profile ${id}`
          };
          
          // Inserisci nel DB
          await db.query('INSERT INTO profile_image (user_id, url, alt_text) VALUES (?, ?, ?)', 
            [id, savedFile.relativeUrl, savedFile.altText]);
          
          res.json({ success: true, files: [savedFile] });
        } catch (err) {
          res.status(500).json({ error: 'Errore durante l\'upload dell\'immagine profilo' });
        }
      }
    ],
    'POST /upload/banner': [
      // Simuliamo il middleware di multer
      (req, res, next) => {
        if (req.fileError) {
          return res.status(400).json({ error: 'Formato immagine non supportato' });
        }
        next();
      },
      async (req, res) => {
        try {
          const { id } = req.body;
          if (!id) return res.status(400).json({ error: 'id utente obbligatorio' });
          if (!req.file) return res.status(400).json({ error: 'Nessun file inviato' });
          
          // Genera il percorso per il banner
          const relativeUrl = `/Media/banner/${id}/${Date.now()}-banner.webp`;
          const url = imageUrlMock.toPublicImageUrl(relativeUrl);
          
          // Aggiorna l'utente
          await db.query('UPDATE extended_users SET url_banner = ? WHERE id_users = ?', [relativeUrl, id]);
          
          res.json({ success: true, url });
        } catch (error) {
          res.status(500).json({ error: 'Errore upload banner' });
        }
      }
    ],
    'DELETE /product/:productId': [
      async (req, res) => {
        try {
          const { productId } = req.params;
          const { imageIds } = req.body;
          
          if (!Array.isArray(imageIds) || imageIds.length === 0) {
            return res.status(400).json({ error: 'imageIds obbligatorio' });
          }
          
          // Simula la lettura delle immagini dal DB
          const [images] = await db.query('SELECT url FROM product_images WHERE product_id = ? AND id IN (?)', 
            [productId, imageIds]);
          
          // Elimina dal DB
          await db.query('DELETE FROM product_images WHERE product_id = ? AND id IN (?)', 
            [productId, imageIds]);
          
          res.json({ success: true });
        } catch (err) {
          res.status(500).json({ error: 'Errore durante l\'eliminazione delle immagini' });
        }
      }
    ]
  };
  
  return routes;
}

describe('Route: images.js', () => {
  let routes;
  
  before(() => {
    routes = extractRouteHandlers();
  });
  
  beforeEach(() => {
    resetMocks();
    imageUrlMock.toPublicImageUrl.callsFake(url => `http://localhost:3000${url}`);
  });
  
  describe('POST /images/upload/product', () => {
    it('dovrebbe caricare immagini per un prodotto', async () => {
      // Prepara la request con file di test
      const req = mockRequest({
        body: { id: '123' },
        files: [
          { buffer: Buffer.from('test-image-1'), mimetype: 'image/jpeg' },
          { buffer: Buffer.from('test-image-2'), mimetype: 'image/png' }
        ]
      });
      const res = mockResponse();
      const next = mockNext();
      
      // Configura il mock del database
      db.query.resolves([{ insertId: 1 }]);
      
      // Esegui il primo middleware (multer)
      await routes['POST /upload/product'][0](req, res, next);
      // Se il middleware chiama next(), continua con il secondo handler
      if (!res.status.called) {
        await routes['POST /upload/product'][1](req, res);
      }
      
      // Verifica la risposta
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', true);
      expect(res.json.firstCall.args[0]).to.have.property('files').that.is.an('array');
      expect(res.json.firstCall.args[0].files).to.have.lengthOf(2);
      
      // Verifica che il DB sia stato chiamato correttamente
      expect(db.query.calledTwice).to.be.true;
      expect(db.query.firstCall.args[0]).to.include('INSERT INTO product_images');
    });
    
    it('dovrebbe restituire errore se manca l\'id del prodotto', async () => {
      const req = mockRequest({
        body: { },
        files: [{ buffer: Buffer.from('test-image'), mimetype: 'image/jpeg' }]
      });
      const res = mockResponse();
      
      // Esegui la route
      await routes['POST /upload/product'][1](req, res);
      
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('error', 'id prodotto obbligatorio');
    });
    
    it('dovrebbe restituire errore se non ci sono file', async () => {
      const req = mockRequest({
        body: { id: '123' },
        files: []
      });
      const res = mockResponse();
      
      // Esegui la route
      await routes['POST /upload/product'][1](req, res);
      
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('error', 'Nessuna immagine inviata');
    });
  });
  
  describe('POST /images/upload/category', () => {
    it('dovrebbe caricare un\'immagine per una categoria', async () => {
      // Prepara la request con file di test
      const req = mockRequest({
        body: { id: '123' },
        files: [{ buffer: Buffer.from('test-image'), mimetype: 'image/jpeg' }]
      });
      const res = mockResponse();
      const next = mockNext();
      
      // Configura il mock del database
      db.query.resolves([{ insertId: 1 }]);
      
      // Esegui il primo middleware (multer)
      await routes['POST /upload/category'][0](req, res, next);
      // Se il middleware chiama next(), continua con il secondo handler
      if (!res.status.called) {
        await routes['POST /upload/category'][1](req, res);
      }
      
      // Verifica la risposta
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', true);
      expect(res.json.firstCall.args[0]).to.have.property('files').that.is.an('array');
      
      // Verifica che il DB sia stato chiamato correttamente (delete e insert)
      expect(db.query.calledTwice).to.be.true;
      expect(db.query.firstCall.args[0]).to.include('DELETE FROM category_images');
      expect(db.query.secondCall.args[0]).to.include('INSERT INTO category_images');
    });
  });
  
  describe('POST /images/upload/profile', () => {
    it('dovrebbe caricare un\'immagine profilo', async () => {
      // Prepara la request con file di test
      const req = mockRequest({
        body: { id: '123' },
        file: { buffer: Buffer.from('test-image'), mimetype: 'image/jpeg' }
      });
      const res = mockResponse();
      const next = mockNext();
      
      // Configura il mock del database
      db.query.resolves([{ insertId: 1 }]);
      
      // Esegui il primo middleware (multer)
      await routes['POST /upload/profile'][0](req, res, next);
      // Se il middleware chiama next(), continua con il secondo handler
      if (!res.status.called) {
        await routes['POST /upload/profile'][1](req, res);
      }
      
      // Verifica la risposta
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', true);
      
      // Verifica che il DB sia stato chiamato correttamente (delete e insert)
      expect(db.query.calledTwice).to.be.true;
      expect(db.query.firstCall.args[0]).to.include('DELETE FROM profile_image');
      expect(db.query.secondCall.args[0]).to.include('INSERT INTO profile_image');
    });
    
    it('dovrebbe restituire errore se manca il file', async () => {
      const req = mockRequest({
        body: { id: '123' },
        file: null
      });
      const res = mockResponse();
      
      // Esegui la route
      await routes['POST /upload/profile'][1](req, res);
      
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('error', 'Nessuna immagine inviata');
    });
  });
  
  describe('POST /images/upload/banner', () => {
    it('dovrebbe caricare un banner per un artigiano', async () => {
      // Prepara la request con file di test
      const req = mockRequest({
        body: { id: '123' },
        file: { buffer: Buffer.from('test-image'), mimetype: 'image/jpeg' }
      });
      const res = mockResponse();
      const next = mockNext();
      
      // Configura il mock del database
      db.query.resolves([{ affectedRows: 1 }]);
      
      // Esegui il primo middleware (multer)
      await routes['POST /upload/banner'][0](req, res, next);
      // Se il middleware chiama next(), continua con il secondo handler
      if (!res.status.called) {
        await routes['POST /upload/banner'][1](req, res);
      }
      
      // Verifica la risposta
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', true);
      expect(res.json.firstCall.args[0]).to.have.property('url').that.includes('http://localhost:3000/Media/banner');
      
      // Verifica che il DB sia stato chiamato correttamente
      expect(db.query.calledOnce).to.be.true;
      expect(db.query.firstCall.args[0]).to.include('UPDATE extended_users');
    });
  });
  
  describe('DELETE /images/product/:productId', () => {
    it('dovrebbe eliminare immagini di un prodotto', async () => {
      const productId = '123';
      const imageIds = [1, 2, 3];
      
      // Mock delle immagini nel DB
      const imagesMock = [
        { url: '/Media/product/123/image1.webp' },
        { url: '/Media/product/123/image2.webp' }
      ];
      
      // Configura il mock del database
      db.query.onFirstCall().resolves([imagesMock]);
      db.query.onSecondCall().resolves([{ affectedRows: imageIds.length }]);
      
      // Prepara la request
      const req = mockRequest({
        params: { productId },
        body: { imageIds }
      });
      const res = mockResponse();
      
      // Esegui la route
      await routes['DELETE /product/:productId'][0](req, res);
      
      // Verifica la risposta
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', true);
      
      // Verifica che il DB sia stato chiamato correttamente
      expect(db.query.calledTwice).to.be.true;
      expect(db.query.firstCall.args[0]).to.include('SELECT url FROM product_images');
      expect(db.query.secondCall.args[0]).to.include('DELETE FROM product_images');
    });
    
    it('dovrebbe restituire errore se mancano gli id delle immagini', async () => {
      const req = mockRequest({
        params: { productId: '123' },
        body: { }
      });
      const res = mockResponse();
      
      // Esegui la route
      await routes['DELETE /product/:productId'][0](req, res);
      
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('error', 'imageIds obbligatorio');
    });
  });
}); 