const axios = require('axios');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require('./config');

async function setupTestData() {
  console.log('Setting up test data for performance tests...');
  
  // Connessione al database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || config.database.host,
    user: process.env.DB_USER || config.database.user,
    password: process.env.DB_PASSWORD || config.database.password,
    database: process.env.DB_NAME || config.database.name,
    port: process.env.DB_PORT || config.database.port
  });

  try {
    // 1. Crea utenti di test
    console.log('Creating test users...');
    for (const [role, user] of Object.entries(config.testUsers)) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await connection.execute(
        'INSERT IGNORE INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        [user.email, hashedPassword, user.name, role]
      );
    }

    // 2. Crea categorie di test
    console.log('Creating test categories...');
    for (const categoryName of config.setup.testCategories) {
      await connection.execute(
        'INSERT IGNORE INTO categories (name) VALUES (?)',
        [categoryName]
      );
    }

    // 3. Crea prodotti di test
    console.log('Creating test products...');
    const [categories] = await connection.execute('SELECT id FROM categories LIMIT 2');
    const [artisans] = await connection.execute('SELECT id FROM users WHERE role = "artisan" LIMIT 1');

    for (let i = 0; i < config.setup.numTestProducts; i++) {
      await connection.execute(
        'INSERT IGNORE INTO products (name, description, price, stock, category_id, artisan_id) VALUES (?, ?, ?, ?, ?, ?)',
        [
          `Test Product ${i + 1}`,
          `Description for test product ${i + 1}`,
          Math.random() * 100,
          Math.floor(Math.random() * 100),
          categories[0]?.id || 1,
          artisans[0]?.id || 1
        ]
      );
    }

    console.log('Test data setup completed successfully!');
  } catch (error) {
    console.error('Error setting up test data:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Esegui lo setup se il file viene eseguito direttamente
if (require.main === module) {
  setupTestData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = setupTestData; 