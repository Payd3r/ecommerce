/**
 * Configurazione per i test di integrazione
 * Questo file contiene le impostazioni necessarie per connettersi al backend reale
 */

// URL del backend
const API_BASE_URL = 'http://localhost:3005';

// Credenziali di test per i diversi ruoli
const TEST_USERS = {
  admin: {
    email: 'luca@gmail.com',
    password: '1234',
    name: 'luca',
    role: 'admin'
  },
  artisan: {
    email: 'marco@gmail.com',
    password: '1234',
    name: 'marco',
    role: 'artisan'
  },
  client: {
    email: 'prova@gmail.com',
    password: '1234',
    name: 'prova',
    role: 'client'
  }
};

// Per retrocompatibilità con i test esistenti
const TEST_USER = TEST_USERS.client;

// Esporta le configurazioni
module.exports = {
  API_BASE_URL,
  TEST_USER,
  TEST_USERS
}; 