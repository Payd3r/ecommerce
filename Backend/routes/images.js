const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const db = require('../models/db');
const { toPublicImageUrl } = require('../services/imageUrl');

const router = express.Router();

// Configurazione multer
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { files: 10 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato immagine non supportato'));
        }
    }
});

// Funzione per creare la directory se non esiste
function ensureDirSync(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Funzione condivisa per gestire upload, conversione, salvataggio e inserimento DB
async function handleImageUpload({ files, type, id }) {
    // Percorso assoluto della cartella Media
    const mediaDir = path.resolve(__dirname, '../Media', type, id);
    ensureDirSync(mediaDir);
    const savedFiles = [];
    for (const file of files) {
        // Nome file unico
        const filename = `${Date.now()}-${Math.round(Math.random()*1E9)}.webp`;
        const filepath = path.join(mediaDir, filename);
        // Conversione e salvataggio
        await sharp(file.buffer)
            .resize({ width: 2000, height: 2000, fit: 'inside' })
            .toFormat('webp')
            .toFile(filepath);
        const relativeUrl = `/Media/${type}/${id}/${filename}`;
        const url = toPublicImageUrl(relativeUrl);
        // Alt text generato
        const altText = `Immagine ${type} ${id}`;
        console.log('[IMG UPLOAD] Salvata immagine:', filepath);
        console.log('[IMG UPLOAD] Path relativo per DB:', relativeUrl);
        savedFiles.push({ filename, url, altText, relativeUrl });
    }
    return savedFiles;
}

// Upload immagini prodotto
router.post('/upload/product', upload.array('images', 10), async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id prodotto obbligatorio' });
        if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Nessuna immagine inviata' });
        const type = 'product';
        // Salva solo le nuove immagini, non toccare quelle già presenti
        const savedFiles = await handleImageUpload({ files: req.files, type, id });
        for (const file of savedFiles) {
            await db.query('INSERT INTO product_images (product_id, url, alt_text) VALUES (?, ?, ?)', [id, file.relativeUrl, file.altText]);
        }
        res.json({ success: true, files: savedFiles });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore durante l\'upload delle immagini prodotto' });
    }
});

// Upload immagini categoria
router.post('/upload/category', upload.array('images', 10), async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id categoria obbligatorio' });
        if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Nessuna immagine inviata' });
        const type = 'category';
        // Cancella tutti i file nella cartella categoria
        const categoryDir = path.resolve(__dirname, '../Media/category', id);
        if (fs.existsSync(categoryDir)) {
            fs.readdirSync(categoryDir).forEach(file => {
                const filePath = path.join(categoryDir, file);
                if (fs.lstatSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                }
            });
        }
        // Elimina eventuale immagine precedente (una sola per categoria)
        const [oldImages] = await db.query('SELECT url FROM category_images WHERE category_id = ?', [id]);
        for (const img of oldImages) {
            const filePath = path.resolve(__dirname, '../', img.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        await db.query('DELETE FROM category_images WHERE category_id = ?', [id]);
        // Salva la nuova immagine
        const savedFiles = await handleImageUpload({ files: req.files, type, id });
        for (const file of savedFiles) {
            await db.query('INSERT INTO category_images (category_id, url, alt_text) VALUES (?, ?, ?)', [id, file.relativeUrl, file.altText]);
        }
        res.json({ success: true, files: savedFiles });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore durante l\'upload delle immagini categoria' });
    }
});

// Upload immagine profilo (una sola)
router.post('/upload/profile', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id utente obbligatorio' });
        if (!req.file) return res.status(400).json({ error: 'Nessuna immagine inviata' });
        const type = 'profile';
        // Cancella tutti i file nella cartella profilo dell'utente
        const userProfileDir = path.resolve(__dirname, '../Media/profile', id);
        if (fs.existsSync(userProfileDir)) {
            fs.readdirSync(userProfileDir).forEach(file => {
                const filePath = path.join(userProfileDir, file);
                if (fs.lstatSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                }
            });
        }
        const savedFiles = await handleImageUpload({ files: [req.file], type, id });
        // Salva su DB (sovrascrive eventuale precedente)
        await db.query('DELETE FROM profile_image WHERE user_id = ?', [id]);
        for (const file of savedFiles) {
            await db.query('INSERT INTO profile_image (user_id, url, alt_text) VALUES (?, ?, ?)', [id, file.relativeUrl, file.altText]);
        }
        res.json({ success: true, files: savedFiles });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore durante l\'upload dell\'immagine profilo' });
    }
});

// Upload banner artigiano (una sola)
router.post('/upload/banner', upload.single('banner'), async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id utente obbligatorio' });
        if (!req.file) return res.status(400).json({ error: 'Nessun file inviato' });
        const type = 'banner';
        const bannerDir = path.resolve(__dirname, '../Media/banner', id);
        ensureDirSync(bannerDir);
        // Cancella tutti i file nella cartella banner dell'utente
        if (fs.existsSync(bannerDir)) {
            fs.readdirSync(bannerDir).forEach(file => {
                const filePath = path.join(bannerDir, file);
                if (fs.lstatSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                }
            });
        }
        // Prendi il vecchio url dal db
        const [rows] = await db.query('SELECT url_banner FROM extended_users WHERE id_users = ?', [id]);
        const oldBanner = rows[0]?.url_banner;
        // Cancella il vecchio file se esiste
        if (oldBanner) {
            const oldPath = path.resolve(__dirname, '../', oldBanner.replace(/^\/Media\//, 'Media/'));
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        // Salva il nuovo banner
        const filename = `${Date.now()}-banner.webp`;
        const filepath = path.join(bannerDir, filename);
        await sharp(req.file.buffer)
            .resize({ width: 1200, height: 400, fit: 'cover' })
            .toFormat('webp')
            .toFile(filepath);
        const relativeUrl = `/Media/banner/${id}/${filename}`;
        const url = toPublicImageUrl(relativeUrl);
        await db.query('UPDATE extended_users SET url_banner = ? WHERE id_users = ?', [relativeUrl, id]);
        res.json({ success: true, url });
    } catch (error) {
        console.error('Errore upload banner:', error);
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
        // Prendi le immagini dal db
        const [images] = await db.query('SELECT url FROM product_images WHERE product_id = ? AND id IN (?)', [productId, imageIds]);
        // Elimina i file dal filesystem
        for (const img of images) {
            const filePath = path.resolve(__dirname, '../', img.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        // Elimina dal db
        await db.query('DELETE FROM product_images WHERE product_id = ? AND id IN (?)', [productId, imageIds]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore durante l\'eliminazione delle immagini' });
    }
});

module.exports = router;
