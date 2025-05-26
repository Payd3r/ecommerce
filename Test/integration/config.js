/**
 * Configurazione per i test di integrazione
 * Questo file contiene le impostazioni necessarie per connettersi al backend reale
 */

const express = require('express');
const mysql = require('mysql2/promise');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// URL di base dell'API
const API_BASE_URL = 'http://localhost:3015';

// Configurazione del database di test
const DB_CONFIG = {
  host: 'localhost',
  user: 'test_user',
  password: 'test_password',
  database: 'ecommerce_test',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Utenti per i test
const TEST_USERS = {
  admin: {
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'adminpassword',
    role: 'admin'
  },
  client: {
    id: 2,
    name: 'Client User',
    email: 'client@example.com',
    password: 'clientpassword',
    role: 'client'
  },
  artisan: {
    id: 3,
    name: 'Artisan User',
    email: 'artisan@example.com',
    password: 'artisanpassword',
    role: 'artisan'
  }
};

// Percorso del file SQL per creare il database di test
const TEST_DB_SETUP_SQL = path.join(__dirname, '../../Backend/db.sql');

// Funzione per configurare l'ambiente di test
async function setupTestEnvironment() {
  try {
    // Crea connessione per inizializzare il database di test
    const connection = await mysql.createConnection({
      host: DB_CONFIG.host,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      multipleStatements: true
    });

    // Crea il database di test se non esiste
    await connection.query(`
      DROP DATABASE IF EXISTS ${DB_CONFIG.database};
      CREATE DATABASE ${DB_CONFIG.database};
      USE ${DB_CONFIG.database};
    `);

    // Leggi e esegui il file SQL di setup
    if (fs.existsSync(TEST_DB_SETUP_SQL)) {
      const sql = fs.readFileSync(TEST_DB_SETUP_SQL, 'utf8');
      await connection.query(sql);
    } else {
      console.error(`File SQL di setup non trovato: ${TEST_DB_SETUP_SQL}`);
      throw new Error('File SQL di setup non trovato');
    }

    // Aggiungi gli utenti di test
    for (const user of Object.values(TEST_USERS)) {
      await connection.query(`
        INSERT INTO users (id, name, email, password_hash, role) 
        VALUES (?, ?, ?, ?, ?)
      `, [user.id, user.name, user.email, user.password, user.role]);
    }

    await connection.end();

    // Crea l'applicazione Express di test
    const app = express();
    
    // Aggiungi qui tutte le route e i middleware necessari
    // ...

    return app;
  } catch (error) {
    console.error('Errore durante il setup dell\'ambiente di test:', error);
    throw error;
  }
}

// Funzione per effettuare il teardown dell'ambiente di test
async function teardownTestEnvironment() {
  try {
    // Crea connessione per eliminare il database di test
    const connection = await mysql.createConnection({
      host: DB_CONFIG.host,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password
    });

    // Elimina il database di test
    await connection.query(`DROP DATABASE IF EXISTS ${DB_CONFIG.database}`);
    
    await connection.end();
  } catch (error) {
    console.error('Errore durante il teardown dell\'ambiente di test:', error);
  }
}

// Funzione per ottenere un token di autenticazione
async function getAuthToken(app, email, password) {
  try {
    const response = await request(app)
      .post('/auth/login')
      .send({ email, password });
    
    // Estrai il token dalla risposta
    if (response.body.data && response.body.data.token) {
      return response.body.data.token;
    } else if (response.body.token) {
      return response.body.token;
    }
    
    // In caso di test, genera un token simulato
    const user = Object.values(TEST_USERS).find(u => u.email === email);
    if (user) {
      return jwt.sign(
        { id: user.id, role: user.role, name: user.name, email: user.email },
        'test_secret_key',
        { expiresIn: '1h' }
      );
    }
    
    throw new Error('Impossibile ottenere il token di autenticazione');
  } catch (error) {
    console.error('Errore durante l\'ottenimento del token:', error);
    throw error;
  }
}

// Esporta le configurazioni
module.exports = {
  API_BASE_URL,
  DB_CONFIG,
  TEST_USERS,
  setupTestEnvironment,
  teardownTestEnvironment,
  getAuthToken
}; 