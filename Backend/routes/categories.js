const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { toPublicImageUrl } = require('../services/imageUrl');

/**
 * @swagger
 * /categories/tree:
 *   get:
 *     summary: Ottieni l'albero completo delle categorie
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Albero delle categorie
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
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
        // Recupera immagini per tutte le categorie
        const categoryIds = categories.map(c => c.id);
        let imagesMap = {};
        if (categoryIds.length > 0) {
            const [images] = await db.query(
                'SELECT id, category_id, url FROM category_images WHERE category_id IN (?) GROUP BY category_id',
                [categoryIds]
            );
            images.forEach(img => {
                imagesMap[img.category_id] = toPublicImageUrl(img.url);
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
});

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Ottieni tutte le categorie
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Lista delle categorie
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
// GET /categories - Ottieni tutte le categorie
router.get('/', async (req, res) => {
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
            image: imagesMap[c.id] ? toPublicImageUrl(imagesMap[c.id]) : null,
            product_count: productCounts[c.id] || 0
        }));
        res.json(categoriesWithImage);
    } catch (error) {
        console.error('Errore nel recupero delle categorie:', error);
        res.status(500).json({ error: 'Errore nel recupero delle categorie' });
    }
});

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Ottieni una categoria specifica
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID della categoria
 *     responses:
 *       200:
 *         description: Categoria trovata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Categoria non trovata
 */
// GET /categories/:id - Ottieni una categoria specifica
router.get('/:id', async (req, res) => {
    try {
        const [category] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
        if (category.length === 0) {
            return res.status(404).json({ error: 'Categoria non trovata' });
        }
        const [images] = await db.query('SELECT url FROM category_images WHERE category_id = ? LIMIT 1', [req.params.id]);
        const image = images.length > 0 ? toPublicImageUrl(images[0].url) : null;
        res.json({ ...category[0], image });
    } catch (error) {
        console.error('Errore nel recupero della categoria:', error);
        res.status(500).json({ error: 'Errore nel recupero della categoria' });
    }
});

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Crea una nuova categoria
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - dad_id
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               dad_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Categoria creata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Nome e categoria padre sono obbligatori
 */
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

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Aggiorna una categoria esistente
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID della categoria
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - dad_id
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               dad_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Categoria aggiornata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Nome e categoria padre sono obbligatori o categoria non valida
 *       404:
 *         description: Categoria non trovata
 */
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

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Elimina una categoria
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID della categoria
 *     responses:
 *       204:
 *         description: Categoria eliminata
 *       400:
 *         description: "Impossibile eliminare la categoria: contiene sottocategorie e/o prodotti associati"
 *       404:
 *         description: Categoria non trovata
 */
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