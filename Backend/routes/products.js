// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { verifyToken, checkRole } = require('../middleware/auth');
const { toPublicImageUrl } = require('../services/imageUrl');

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Ottieni tutti i prodotti con paginazione e filtri
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numero della pagina
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Numero di prodotti per pagina
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Testo da cercare nel nome del prodotto
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *         description: ID della categoria
 *       - in: query
 *         name: artisan
 *         schema:
 *           type: integer
 *         description: ID dell'artigiano
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Prezzo minimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Prezzo massimo
 *     responses:
 *       200:
 *         description: Lista dei prodotti con paginazione
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 */
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

/**
 * @swagger
 * /products/best-sellers:
 *   get:
 *     summary: Ottieni i prodotti più acquistati
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Numero massimo di prodotti da restituire
 *     responses:
 *       200:
 *         description: Lista dei prodotti più acquistati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 */
// GET /products/best-sellers - Prodotti più acquistati
router.get('/best-sellers', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        // Query: somma le quantità vendute per prodotto
        const [products] = await db.query(`
            SELECT p.*, u.name as artisan_name, c.name as category_name, 
                   COALESCE(SUM(oi.quantity), 0) as total_sold
            FROM products p
            LEFT JOIN order_items oi ON p.id = oi.product_id
            LEFT JOIN users u ON p.artisan_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            GROUP BY p.id
            ORDER BY total_sold DESC, p.created_at DESC
            LIMIT ?
        `, [limit]);
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
            total_sold: p.total_sold !== undefined && p.total_sold !== null ? Number(p.total_sold) : 0,
            image: imagesMap[p.id] || null
        }));
        res.json({
            products: productsWithImage
        });
    } catch (error) {
        console.error('Errore nel recupero dei best seller:', error);
        res.status(500).json({ error: 'Errore nel recupero dei best seller' });
    }
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Ottieni un prodotto specifico
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del prodotto
 *     responses:
 *       200:
 *         description: Dettaglio del prodotto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *                 stock:
 *                   type: integer
 *                 category_id:
 *                   type: integer
 *                 artisan_id:
 *                   type: integer
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       url:
 *                         type: string
 *                       alt_text:
 *                         type: string
 *       404:
 *         description: Prodotto non trovato
 */
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

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Crea un nuovo prodotto (solo artigiani)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               category_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Prodotto creato
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Nome e prezzo sono obbligatori
 *       401:
 *         description: Non autorizzato
 */
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

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Aggiorna un prodotto (admin o artigiano proprietario)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del prodotto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               category_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Prodotto aggiornato
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Nome e prezzo sono obbligatori
 *       401:
 *         description: Non autorizzato
 *       404:
 *         description: Prodotto non trovato o permessi insufficienti
 */
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

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Elimina un prodotto (solo l'artigiano proprietario)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del prodotto
 *     responses:
 *       204:
 *         description: Prodotto eliminato
 *       401:
 *         description: Non autorizzato
 *       404:
 *         description: Prodotto non trovato o permessi insufficienti
 */
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

/**
 * @swagger
 * /products/by-artisan/{id}:
 *   get:
 *     summary: Ottieni tutti i prodotti di un artigiano specifico
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dell'artigiano
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numero della pagina
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Numero di prodotti per pagina
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Testo da cercare nel nome del prodotto
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Prezzo minimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Prezzo massimo
 *     responses:
 *       200:
 *         description: Lista dei prodotti dell'artigiano
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *       400:
 *         description: ID artigiano non valido
 */
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
