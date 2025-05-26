const request = require('supertest');
const app = require('./__mocks__/app');
const db = require('./__mocks__/db');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Mock delle dipendenze
jest.mock('../models/db', () => require('./__mocks__/db'));
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn(),
  lstatSync: jest.fn(),
  unlinkSync: jest.fn()
}));
jest.mock('path', () => ({
  resolve: jest.fn((_, ...rest) => rest.join('/')),
  join: jest.fn((...args) => args.join('/'))
}));
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    toFormat: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue({})
  }));
});

describe('Images API Tests', () => {
  beforeEach(() => {
    db.query.mockClear();
    fs.existsSync.mockClear();
    fs.mkdirSync.mockClear();
    fs.readdirSync.mockClear();
    fs.lstatSync.mockClear();
    fs.unlinkSync.mockClear();
    sharp.mockClear();
  });

  test('POST /images/upload/product dovrebbe caricare immagini per un prodotto', async () => {
    // Mock delle dipendenze
    fs.existsSync.mockReturnValue(true);
    
    // Mock delle query al db
    db.query.mockResolvedValue([{ insertId: 1 }]);
    
    const response = await request(app)
      .post('/images/upload/product')
      .field('id', '15')
      .attach('images', Buffer.from('fake image data'), 'test-image.jpg');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('files');
    expect(Array.isArray(response.body.files)).toBe(true);
    
    // Verifica che sharp sia stato chiamato per processare l'immagine
    expect(sharp).toHaveBeenCalled();
    // Verifica che la query per inserire nel db sia stata chiamata
    expect(db.query).toHaveBeenCalled();
  });

  test('POST /images/upload/product dovrebbe restituire 400 se manca l\'id del prodotto', async () => {
    const response = await request(app)
      .post('/images/upload/product')
      .attach('images', Buffer.from('fake image data'), 'test-image.jpg');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'id prodotto obbligatorio');
  });

  test('POST /images/upload/category dovrebbe caricare un\'immagine per una categoria', async () => {
    // Mock delle dipendenze
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue(['old-image.jpg']);
    fs.lstatSync.mockReturnValue({ isFile: () => true });
    
    // Mock delle query al db
    db.query.mockResolvedValueOnce([[]]);  // Nessuna immagine trovata
    db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);  // Delete
    db.query.mockResolvedValueOnce([{ insertId: 1 }]);  // Insert
    
    const response = await request(app)
      .post('/images/upload/category')
      .field('id', '21')
      .attach('images', Buffer.from('fake image data'), 'category-image.jpg');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('files');
    
    // Verifica che il vecchio file sia stato eliminato
    expect(fs.unlinkSync).toHaveBeenCalled();
    // Verifica che la categoria sia stata aggiornata nel db
    expect(db.query).toHaveBeenCalledTimes(3);
  });

  test('POST /images/upload/profile dovrebbe caricare un\'immagine profilo', async () => {
    // Mock delle dipendenze
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue(['old-profile.jpg']);
    fs.lstatSync.mockReturnValue({ isFile: () => true });
    
    // Mock delle query al db
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);  // Delete
    db.query.mockResolvedValueOnce([{ insertId: 1 }]);  // Insert
    
    const response = await request(app)
      .post('/images/upload/profile')
      .field('id', '1')
      .attach('image', Buffer.from('fake image data'), 'profile.jpg');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    
    // Verifica che i vecchi file siano stati eliminati
    expect(fs.unlinkSync).toHaveBeenCalled();
    // Verifica che il profilo sia stato aggiornato nel db
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  test('POST /images/upload/banner dovrebbe caricare un banner per un artigiano', async () => {
    // Mock delle dipendenze
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue(['old-banner.jpg']);
    fs.lstatSync.mockReturnValue({ isFile: () => true });
    
    // Mock delle query al db
    db.query.mockResolvedValueOnce([[{ url_banner: '/Media/banner/1/old-banner.jpg' }]]);
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    
    const response = await request(app)
      .post('/images/upload/banner')
      .field('id', '1')
      .attach('banner', Buffer.from('fake image data'), 'banner.jpg');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('url');
    
    // Verifica che il vecchio banner sia stato eliminato
    expect(fs.unlinkSync).toHaveBeenCalled();
    // Verifica che il banner sia stato aggiornato nel db
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  test('DELETE /images/product/:productId dovrebbe eliminare immagini specifiche', async () => {
    // Mock delle query al db per ottenere gli URL
    db.query.mockResolvedValueOnce([[
      { url: '/Media/product/15/image1.webp' },
      { url: '/Media/product/15/image2.webp' }
    ]]);
    // Mock per l'eliminazione dal db
    db.query.mockResolvedValueOnce([{ affectedRows: 2 }]);
    
    // Mock per la verifica dell'esistenza dei file
    fs.existsSync.mockReturnValue(true);
    
    const response = await request(app)
      .delete('/images/product/15')
      .send({ imageIds: [1, 2] });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    
    // Verifica che i file siano stati eliminati
    expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
    // Verifica che i record siano stati eliminati dal db
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  test('DELETE /images/product/:productId dovrebbe restituire 400 se imageIds non è valido', async () => {
    const response = await request(app)
      .delete('/images/product/15')
      .send({ /* imageIds mancante */ });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'imageIds obbligatorio');
  });
}); 