const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Funzione di utilità per costruire l'albero delle categorie
const buildCategoryTree = async (categories, parentId = 1) => {
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
};

// GET /categories/tree - Ottieni l'albero completo delle categorie
router.get('/tree', async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories WHERE id != 1 ORDER BY dad_id, name');
        const tree = await buildCategoryTree(categories);
        res.json(tree);
    } catch (error) {
        console.error('Errore nel recupero dell\'albero delle categorie:', error);
        res.status(500).json({ error: 'Errore nel recupero dell\'albero delle categorie' });
    }
});

// GET /categories - Ottieni tutte le categorie
router.get('/', async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories ORDER BY name');
        res.json(categories);
    } catch (error) {
        console.error('Errore nel recupero delle categorie:', error);
        res.status(500).json({ error: 'Errore nel recupero delle categorie' });
    }
});

// GET /categories/:id - Ottieni una categoria specifica
router.get('/:id', async (req, res) => {
    try {
        const [category] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
        
        if (category.length === 0) {
            return res.status(404).json({ error: 'Categoria non trovata' });
        }
        
        res.json(category[0]);
    } catch (error) {
        console.error('Errore nel recupero della categoria:', error);
        res.status(500).json({ error: 'Errore nel recupero della categoria' });
    }
});


// POST /categories - Crea una nuova categoria
router.post('/', async (req, res) => {
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
});

// PUT /categories/:id - Aggiorna una categoria esistente
router.put('/:id', async (req, res) => {
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
});

// DELETE /categories/:id - Elimina una categoria
router.delete('/:id', async (req, res) => {
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
});

module.exports = router; 