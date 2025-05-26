const express = require('express');
const router = express.Router();
const db = require('../../db');

// GET /categories - Ottieni tutte le categorie
router.get('/', async (req, res) => {
  try {
    const categoriesResult = await db.query('SELECT * FROM categories WHERE id != 1 ORDER BY name');
    const categories = categoriesResult[0];
    
    // Recupera immagini e conteggio prodotti
    const imagesResult = await db.query('SELECT id, category_id, url FROM category_images');
    const images = imagesResult[0];
    
    // Semplice mock per la risposta
    const categoriesWithImage = categories.map(c => ({
      ...c,
      image: images.find(img => img.category_id === c.id)?.url || null,
      product_count: Math.floor(Math.random() * 20) // Simulazione conteggio prodotti
    }));
    
    res.json(categoriesWithImage);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero delle categorie' });
  }
});

// GET /categories/tree
router.get('/tree', (req, res) => {
  return res.status(200).json([
    { 
      id: 21, 
      name: 'Lattiero-Caseari', 
      description: 'Prodotti del latte tipici', 
      dad_id: 1, 
      image: 'http://localhost:3015/Media/category/21/image.webp',
      children: [
        { id: 24, name: 'Latte fresco', description: 'Latte appena munto', dad_id: 21, image: 'http://localhost:3015/Media/category/24/image.webp' },
        { id: 25, name: 'Formaggi freschi', description: 'Sapori freschi', dad_id: 21, image: 'http://localhost:3015/Media/category/25/image.webp' }
      ]
    },
    { 
      id: 22, 
      name: 'Carne e Salumi', 
      description: 'Tutti i migliori tagli di carne', 
      dad_id: 1, 
      image: 'http://localhost:3015/Media/category/22/image.webp',
      children: [
        { id: 26, name: 'Salumi artigianali', description: 'Gusto vero', dad_id: 22, image: 'http://localhost:3015/Media/category/26/image.webp' },
        { id: 27, name: 'Carne fresca', description: 'Carne locale', dad_id: 22, image: 'http://localhost:3015/Media/category/27/image.webp' }
      ]
    }
  ]);
});

// GET /categories/:id - Ottieni una categoria specifica
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    const category = result[0][0];
    
    if (!category) {
      return res.status(404).json({ error: 'Categoria non trovata' });
    }
    
    const imagesResult = await db.query('SELECT url FROM category_images WHERE category_id = ? LIMIT 1', [req.params.id]);
    const image = imagesResult[0][0]?.url || null;
    
    res.json({ ...category, image });
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero della categoria' });
  }
});

// POST /categories - Crea una nuova categoria
router.post('/', async (req, res) => {
  const { name, description, dad_id } = req.body;
  
  if (!name || !dad_id) {
    return res.status(400).json({ error: 'Nome e categoria padre sono obbligatori' });
  }
  
  try {
    const result = await db.query(
      'INSERT INTO categories (name, description, dad_id) VALUES (?, ?, ?)',
      [name, description, dad_id]
    );
    
    const newCategory = {
      id: result[0].insertId,
      name,
      description,
      dad_id
    };
    
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione della categoria' });
  }
});

// PUT /categories/:id - Aggiorna una categoria esistente
router.put('/:id', async (req, res) => {
  const { name, description, dad_id } = req.body;
  const categoryId = req.params.id;
  
  if (!name || !dad_id) {
    return res.status(400).json({ error: 'Nome e categoria padre sono obbligatori' });
  }
  
  try {
    const result = await db.query('SELECT * FROM categories WHERE id = ?', [categoryId]);
    const existingCategory = result[0][0];
    
    if (!existingCategory) {
      return res.status(404).json({ error: 'Categoria non trovata' });
    }
    
    if (dad_id == categoryId) {
      return res.status(400).json({ error: 'Una categoria non può essere padre di se stessa' });
    }
    
    await db.query(
      'UPDATE categories SET name = ?, description = ?, dad_id = ? WHERE id = ?',
      [name, description, dad_id, categoryId]
    );
    
    res.json({
      id: parseInt(categoryId),
      name,
      description,
      dad_id
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento della categoria' });
  }
});

// DELETE /categories/:id - Elimina una categoria
router.delete('/:id', async (req, res) => {
  const categoryId = req.params.id;
  
  try {
    const categoryResult = await db.query('SELECT * FROM categories WHERE id = ?', [categoryId]);
    const category = categoryResult[0][0];
    
    if (!category) {
      return res.status(404).json({ error: 'Categoria non trovata' });
    }
    
    const childrenResult = await db.query('SELECT id FROM categories WHERE dad_id = ?', [categoryId]);
    const children = childrenResult[0];
    
    if (children.length > 0) {
      return res.status(400).json({ 
        error: 'Impossibile eliminare la categoria: contiene sottocategorie e/o prodotti associati' 
      });
    }
    
    await db.query('DELETE FROM categories WHERE id = ?', [categoryId]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione della categoria' });
  }
});

module.exports = router; 