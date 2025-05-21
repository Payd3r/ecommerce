// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { verifyToken, checkRole } = require('../middleware/auth');
const { toPublicImageUrl } = require('../services/imageUrl');

// GET /products - Ottieni tutti i prodotti con paginazione e filtri
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const category = parseInt(req.query.category) || null;
        const artisan = parseInt(req.query.artisan) || null;
        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;

        // Costruisci la query di base
        let query = `
            SELECT p.*, u.name as artisan_name, c.name as category_name 
            FROM products p
            LEFT JOIN users u ON p.artisan_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.price >= ? AND p.price <= ?
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM products p WHERE price >= ? AND price <= ?';
        const queryParams = [minPrice, maxPrice];
        const countParams = [minPrice, maxPrice];

        // Aggiungi filtri se presenti
        if (search) {
            query += ' AND p.name LIKE ?';
            countQuery += ' AND name LIKE ?';
            queryParams.push(`%${search}%`);
            countParams.push(`%${search}%`);
        }
        let categories = req.query['category[]'];
        if (categories) {
            if (!Array.isArray(categories)) {
                categories = [categories];
            }
            if (categories.length > 0) {
                query += ` AND p.category_id IN (${categories.map(() => '?').join(',')})`;
                countQuery += ` AND category_id IN (${categories.map(() => '?').join(',')})`;
                queryParams.push(...categories);
                countParams.push(...categories);
            }
        }
        if (artisan) {
            query += ' AND p.artisan_id = ?';
            countQuery += ' AND artisan_id = ?';
            queryParams.push(artisan);
            countParams.push(artisan);
        }

        // Aggiungi ordinamento e paginazione
        query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        // Esegui le query
        const [products] = await db.query(query, queryParams);
        const [totalCount] = await db.query(countQuery, countParams);

        // Recupera la prima immagine per ogni prodotto
        const productIds = products.map(p => p.id);
        let imagesMap = {};
        if (productIds.length > 0) {
            const [images] = await db.query(
                'SELECT id, product_id, url, alt_text FROM product_images WHERE product_id IN (?) GROUP BY product_id',
                [productIds]
            );
            images.forEach(img => {
                imagesMap[img.product_id] = { ...img, url: toPublicImageUrl(img.url) };
            });
        }
        const productsWithImage = products.map(p => ({
            ...p,
            price: p.price !== undefined && p.price !== null ? Number(p.price) : 0,
            discount: p.discount !== undefined && p.discount !== null ? Number(p.discount) : 0,
            stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 0,
            image: imagesMap[p.id] || null
        }));

        // Calcola la paginazione
        const total = totalCount[0].total;
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.json({
            products: productsWithImage,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage,
                hasPrevPage
            }
        });
    } catch (error) {
        console.error('Errore nel recupero dei prodotti:', error);
        res.status(500).json({ error: 'Errore nel recupero dei prodotti' });
    }
});

// GET /products/:id - Ottieni un prodotto specifico
router.get('/:id', async (req, res) => {
    try {
        const [product] = await db.query(
            `SELECT p.*, u.name as artisan_name, c.name as category_name 
             FROM products p
             LEFT JOIN users u ON p.artisan_id = u.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ?`,
            [req.params.id]
        );

        if (product.length === 0) {
            return res.status(404).json({ error: 'Prodotto non trovato' });
        }

        // Recupera tutte le immagini collegate al prodotto
        const [images] = await db.query(
            'SELECT id, url, alt_text FROM product_images WHERE product_id = ?',
            [req.params.id]
        );

        // Restituisci il prodotto con le immagini
        res.json({
            ...product[0],
            images: images.map(img => ({ ...img, url: toPublicImageUrl(img.url) }))
        });
    } catch (error) {
        console.error('Errore nel recupero del prodotto:', error);
        res.status(500).json({ error: 'Errore nel recupero del prodotto' });
    }
});

// POST /products - Crea un nuovo prodotto (solo artigiani)
router.post('/', verifyToken, checkRole('artisan'), async (req, res) => {
    const { name, description, price, stock, category_id } = req.body;
    const artisan_id = req.user.id; // Prendi l'ID dell'artigiano dal token
    // Validazione
    if (!name || !price) {
        return res.status(400).json({ error: 'Nome e prezzo sono obbligatori' });
    }

    try {
        // Inserisci il nuovo prodotto
        const [result] = await db.query(
            `INSERT INTO products (artisan_id, name, description, price, stock, category_id) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [artisan_id, name, description, price, stock || 0, category_id]
        );

        const [newProduct] = await db.query(
            `SELECT p.*, u.name as artisan_name, c.name as category_name 
             FROM products p
             LEFT JOIN users u ON p.artisan_id = u.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ?`,
            [result.insertId]
        );

        res.status(201).json(newProduct[0]);
    } catch (error) {
        console.error('Errore nella creazione del prodotto:', error);
        res.status(500).json({ error: 'Errore nella creazione del prodotto' });
    }
});

// PUT /products/:id - Aggiorna un prodotto (admin o artigiano proprietario)
router.put('/:id', verifyToken, checkRole('artisan', 'admin'), async (req, res) => {
    const { name, description, price, stock, category_id } = req.body;
    const productId = req.params.id;
    const user = req.user;

    // Validazione
    if (!name || !price) {
        return res.status(400).json({ error: 'Nome e prezzo sono obbligatori' });
    }

    try {
        let product;
        if (user.role === 'admin') {
            // L'admin può modificare qualsiasi prodotto
            [product] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
        } else {
            // L'artigiano solo i suoi
            [product] = await db.query('SELECT * FROM products WHERE id = ? AND artisan_id = ?', [productId, user.id]);
        }

        if (product.length === 0) {
            return res.status(404).json({ 
                error: 'Prodotto non trovato o non hai i permessi per modificarlo' 
            });
        }

        // Aggiorna il prodotto (non filtrare per artisan_id se admin)
        if (user.role === 'admin') {
            await db.query(
                `UPDATE products 
                 SET name = ?, description = ?, price = ?, discount = ?, stock = ?, category_id = ?
                 WHERE id = ?`,
                [name, description, price, req.body.discount || 0, stock, category_id, productId]
            );
        } else {
            await db.query(
                `UPDATE products 
                 SET name = ?, description = ?, price = ?, discount = ?, stock = ?, category_id = ?
                 WHERE id = ? AND artisan_id = ?`,
                [name, description, price, req.body.discount || 0, stock, category_id, productId, user.id]
            );
        }

        const [updatedProduct] = await db.query(
            `SELECT p.*, u.name as artisan_name, c.name as category_name 
             FROM products p
             LEFT JOIN users u ON p.artisan_id = u.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ?`,
            [productId]
        );

        res.json(updatedProduct[0]);
    } catch (error) {
        console.error('Errore nell\'aggiornamento del prodotto:', error);
        res.status(500).json({ error: 'Errore nell\'aggiornamento del prodotto' });
    }
});

// DELETE /products/:id - Elimina un prodotto (solo l'artigiano proprietario)
router.delete('/:id', verifyToken, checkRole('artisan'), async (req, res) => {
    const productId = req.params.id;
    const artisan_id = req.user.id;

    try {
        // Verifica che il prodotto esista e appartenga all'artigiano
        const [product] = await db.query(
            'SELECT * FROM products WHERE id = ? AND artisan_id = ?',
            [productId, artisan_id]
        );

        if (product.length === 0) {
            return res.status(404).json({ 
                error: 'Prodotto non trovato o non hai i permessi per eliminarlo' 
            });
        }

        // Elimina il prodotto
        await db.query('DELETE FROM products WHERE id = ? AND artisan_id = ?', [productId, artisan_id]);
        res.status(204).send();
    } catch (error) {
        console.error('Errore nell\'eliminazione del prodotto:', error);
        res.status(500).json({ error: 'Errore nell\'eliminazione del prodotto' });
    }
});

// GET /products/by-artisan/:id - Ottieni tutti i prodotti di un artigiano specifico (pubblico)
router.get('/by-artisan/:id', async (req, res) => {
    try {
        const artisanId = parseInt(req.params.id);
        if (isNaN(artisanId)) {
            return res.status(400).json({ error: 'ID artigiano non valido' });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;

        let query = `
            SELECT p.*, u.name as artisan_name, c.name as category_name 
            FROM products p
            LEFT JOIN users u ON p.artisan_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.artisan_id = ? AND p.price >= ? AND p.price <= ?
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM products WHERE artisan_id = ? AND price >= ? AND price <= ?';
        const queryParams = [artisanId, minPrice, maxPrice];
        const countParams = [artisanId, minPrice, maxPrice];

        if (search) {
            query += ' AND p.name LIKE ?';
            countQuery += ' AND name LIKE ?';
            queryParams.push(`%${search}%`);
            countParams.push(`%${search}%`);
        }

        query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [products] = await db.query(query, queryParams);
        const [totalCount] = await db.query(countQuery, countParams);

        // Recupera la prima immagine per ogni prodotto
        const productIds = products.map(p => p.id);
        let imagesMap = {};
        if (productIds.length > 0) {
            const [images] = await db.query(
                'SELECT id, product_id, url, alt_text FROM product_images WHERE product_id IN (?) GROUP BY product_id',
                [productIds]
            );
            images.forEach(img => {
                imagesMap[img.product_id] = { ...img, url: toPublicImageUrl(img.url) };
            });
        }
        const productsWithImage = products.map(p => ({
            ...p,
            price: p.price !== undefined && p.price !== null ? Number(p.price) : 0,
            discount: p.discount !== undefined && p.discount !== null ? Number(p.discount) : 0,
            stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 0,
            image: imagesMap[p.id] || null
        }));

        const total = totalCount[0].total;
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.json({
            products: productsWithImage,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage,
                hasPrevPage
            }
        });
    } catch (error) {
        console.error('Errore nel recupero dei prodotti per artigiano:', error);
        res.status(500).json({ error: 'Errore nel recupero dei prodotti per artigiano' });
    }
});

module.exports = router;
