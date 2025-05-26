const express = require('express');
const router = express.Router();
const db = require('../../db');
const multer = require('multer');

// Mock dell'upload middleware
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 10 }
});

// Upload immagini prodotto
router.post('/upload/product', upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id prodotto obbligatorio' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Nessuna immagine inviata' });
    
    // Simula il salvataggio delle immagini
    const savedFiles = req.files.map((file, index) => ({
      filename: `${Date.now()}-${index}.webp`,
      url: `/Media/product/${id}/${Date.now()}-${index}.webp`,
      altText: `Immagine product ${id}`,
      relativeUrl: `/Media/product/${id}/${Date.now()}-${index}.webp`
    }));
    
    // Simula l'inserimento nel database
    for (const file of savedFiles) {
      await db.query('INSERT INTO product_images (product_id, url, alt_text) VALUES (?, ?, ?)', [id, file.relativeUrl, file.altText]);
    }
    
    res.json({ success: true, files: savedFiles });
  } catch (err) {
    res.status(500).json({ error: 'Errore durante l\'upload delle immagini prodotto' });
  }
});

// Upload immagini categoria
router.post('/upload/category', upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id categoria obbligatorio' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Nessuna immagine inviata' });
    
    // Simula la rimozione delle vecchie immagini
    await db.query('DELETE FROM category_images WHERE category_id = ?', [id]);
    
    // Simula il salvataggio delle nuove immagini
    const savedFiles = req.files.map((file, index) => ({
      filename: `${Date.now()}-${index}.webp`,
      url: `/Media/category/${id}/${Date.now()}-${index}.webp`,
      altText: `Immagine category ${id}`,
      relativeUrl: `/Media/category/${id}/${Date.now()}-${index}.webp`
    }));
    
    // Simula l'inserimento nel database
    for (const file of savedFiles) {
      await db.query('INSERT INTO category_images (category_id, url, alt_text) VALUES (?, ?, ?)', [id, file.relativeUrl, file.altText]);
    }
    
    res.json({ success: true, files: savedFiles });
  } catch (err) {
    res.status(500).json({ error: 'Errore durante l\'upload delle immagini categoria' });
  }
});

// Upload immagine profilo
router.post('/upload/profile', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id utente obbligatorio' });
    if (!req.file) return res.status(400).json({ error: 'Nessuna immagine inviata' });
    
    // Simula la rimozione dell'immagine vecchia
    await db.query('DELETE FROM profile_image WHERE user_id = ?', [id]);
    
    // Simula il salvataggio della nuova immagine
    const relativeUrl = `/Media/profile/${id}/${id}-profile-${Date.now()}.webp`;
    
    // Simula l'inserimento nel database
    await db.query('INSERT INTO profile_image (user_id, url, alt_text) VALUES (?, ?, ?)', [id, relativeUrl, null]);
    
    res.json({ 
      success: true, 
      files: [{
        filename: `${id}-profile-${Date.now()}.webp`,
        url: relativeUrl,
        altText: null,
        relativeUrl
      }]
    });
  } catch (err) {
    res.status(500).json({ error: 'Errore durante l\'upload dell\'immagine profilo' });
  }
});

// Upload banner artigiano
router.post('/upload/banner', upload.single('banner'), async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id utente obbligatorio' });
    if (!req.file) return res.status(400).json({ error: 'Nessun file inviato' });
    
    // Simula il recupero del vecchio banner
    const result = await db.query('SELECT url_banner FROM extended_users WHERE id_users = ?', [id]);
    
    // Simula il salvataggio del nuovo banner
    const relativeUrl = `/Media/banner/${id}/${id}-banner-${Date.now()}.webp`;
    
    // Simula l'aggiornamento nel database
    await db.query('UPDATE extended_users SET url_banner = ? WHERE id_users = ?', [relativeUrl, id]);
    
    res.json({ success: true, url: relativeUrl });
  } catch (err) {
    res.status(500).json({ error: 'Errore upload banner' });
  }
});

// Elimina immagini specifiche di un prodotto
router.delete('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { imageIds } = req.body;
    
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ error: 'imageIds obbligatorio' });
    }
    
    // Simula il recupero delle URL delle immagini
    const result = await db.query('SELECT url FROM product_images WHERE product_id = ? AND id IN (?)', [productId, imageIds]);
    
    // Simula l'eliminazione dal database
    await db.query('DELETE FROM product_images WHERE product_id = ? AND id IN (?)', [productId, imageIds]);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore durante l\'eliminazione delle immagini' });
  }
});

module.exports = router; 