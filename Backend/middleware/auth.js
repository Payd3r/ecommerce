const jwt = require('jsonwebtoken');
const db = require('../models/db');
require('dotenv').config();

/**
 * Middleware per verificare il token JWT
 * Può essere usato su qualsiasi route che richiede autenticazione
 */
const verifyToken = async (req, res, next) => {
    try {
        console.log("[verifyToken] Chiamata ricevuta. Header Authorization:", req.headers.authorization);
        // Ottieni il token dall'header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.log("[verifyToken] Token di accesso non fornito");
            return res.status(401).json({ error: 'Token di accesso non fornito' });
        }

        // Verifica il formato del token (Bearer token)
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            console.log("[verifyToken] Formato token non valido:", authHeader);
            return res.status(401).json({ error: 'Formato token non valido' });
        }

        const token = parts[1];
        console.log("[verifyToken] Token estratto:", token);
        try {
            // Verifica e decodifica il token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Verifica che l'utente esista ancora nel database
            const [users] = await db.query(
                'SELECT id, name, email, role FROM users WHERE id = ?',
                [decoded.userId]
            );

            if (users.length === 0) {
                console.log("[verifyToken] Utente non trovato per userId:", decoded.userId);
                return res.status(401).json({ error: 'Utente non trovato' });
            }
            console.log("[verifyToken] Utente trovato:", users[0]);
            // Aggiungi l'utente alla richiesta
            req.user = users[0];
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                console.log("[verifyToken] Token scaduto");
                return res.status(401).json({ error: 'Token scaduto' });
            }
            if (error.name === 'JsonWebTokenError') {
                console.log("[verifyToken] Token non valido:", error.message);
                return res.status(401).json({ error: 'Token non valido' });
            }
            console.log("[verifyToken] Errore generico nella verifica del token:", error);
            throw error;
        }
    } catch (error) {
        console.error('[verifyToken] Errore nella verifica del token:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
};

/**
 * Middleware per verificare i ruoli
 * Può essere usato per limitare l'accesso in base al ruolo
 * @param {string[]} roles - Array di ruoli autorizzati
 */
const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            console.log("utente non autenticato")
            return res.status(401).json({ error: 'Utente non autenticato' });
        }

        if (!roles.includes(req.user.role)) {
            console.log("utente non autorizzato")
            return res.status(403).json({
                error: 'Non hai i permessi necessari per questa operazione'
            });
        }
        console.log("utente autorizzato")
        next();
    };
};

module.exports = { verifyToken, checkRole }; 