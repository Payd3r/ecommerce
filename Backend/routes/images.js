const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const db = require('../models/db');

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
    const mediaDir = path.resolve(__dirname, '../../Media', type, id);
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
        const url = `/Media/${type}/${id}/${filename}`;
        // Alt text generato
        const altText = `Immagine ${type} ${id}`;
        savedFiles.push({ filename, url, altText });
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
        const savedFiles = await handleImageUpload({ files: req.files, type, id });
        // Salva su DB
        for (const file of savedFiles) {
            await db.query('INSERT INTO product_images (product_id, url, alt_text) VALUES (?, ?, ?)', [id, file.url, file.altText]);
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
        const savedFiles = await handleImageUpload({ files: req.files, type, id });
        // Salva su DB
        for (const file of savedFiles) {
            await db.query('INSERT INTO category_images (category_id, url, alt_text) VALUES (?, ?, ?)', [id, file.url, file.altText]);
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
        const savedFiles = await handleImageUpload({ files: [req.file], type, id });
        // Salva su DB (sovrascrive eventuale precedente)
        await db.query('DELETE FROM profile_image WHERE user_id = ?', [id]);
        for (const file of savedFiles) {
            await db.query('INSERT INTO profile_image (user_id, url, alt_text) VALUES (?, ?, ?)', [id, file.url, file.altText]);
        }
        res.json({ success: true, files: savedFiles });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore durante l\'upload dell\'immagine profilo' });
    }
});

module.exports = router;
