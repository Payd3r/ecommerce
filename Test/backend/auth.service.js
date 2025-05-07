// Importo le funzioni di autenticazione mockate per i test
const path = require('path');
// Utilizziamo il mock invece del file originale
const authFunctions = require('./__mocks__/auth_functions');

// Funzione per generare un token valido per i test
function generateTestToken(userData = {}) {
    const user = { 
        id: userData.id || 1, 
        email: userData.email || 'test@example.com', 
        role: userData.role || 'client' 
    };
    return authFunctions.generateToken(user);
}

// Funzione per verificare un token
function verifyTestToken(token) {
    return authFunctions.verifyToken(token);
}

module.exports = { generateTestToken, verifyTestToken }; 