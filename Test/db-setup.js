const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Config database di test
const dbConfig = {
  host: 'localhost',
  user: 'test_user',
  password: 'test_password',
  database: 'test_db',
  port: 3016
};

async function waitForDatabase(maxAttempts = 30) {
  console.log('Waiting for database connection...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const connection = await mysql.createConnection(dbConfig);
      await connection.ping();
      await connection.end();
      console.log('Database connection successful!');
      return true;
    } catch (error) {
      console.log(`Attempt ${i + 1}/${maxAttempts}: Database not ready yet...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error('Database connection timeout');
}

async function initializeDatabase() {
  console.log('Initializing test database...');
  
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Verifica se le tabelle esistono
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'",
      [dbConfig.database]
    );
    
    if (tables.length === 0) {
      console.log('No tables found, running schema initialization...');
      
      // Leggi e esegui il file SQL
      const sqlFile = path.join(__dirname, '..', 'Backend', 'db.sql');
      if (fs.existsSync(sqlFile)) {
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        
        // Dividi gli statements SQL
        const statements = sqlContent
          .split(';')
          .filter(stmt => stmt.trim().length > 0)
          .map(stmt => stmt.trim() + ';');
        
        for (const statement of statements) {
          if (statement.trim() && !statement.trim().startsWith('--')) {
            await connection.query(statement);
          }
        }
        
        console.log('Database schema initialized successfully');
      } else {
        console.error('SQL file not found:', sqlFile);
        throw new Error('Cannot initialize database schema');
      }
    } else {
      console.log(`Database already initialized with ${tables.length} tables`);
    }
    
    // Verifica tabelle essenziali
    const requiredTables = ['users', 'categories', 'products', 'orders'];
    const tableNames = tables.map(t => t.TABLE_NAME);
    
    for (const table of requiredTables) {
      if (!tableNames.includes(table)) {
        throw new Error(`Required table '${table}' not found`);
      }
    }
    
    console.log('All required tables present');
    
    // Inserisci categoria root se non esiste
    const [rootCategory] = await connection.query(
      'SELECT id FROM categories WHERE id = 1'
    );
    
    if (rootCategory.length === 0) {
      await connection.query(
        'INSERT INTO categories (id, name, dad_id) VALUES (1, "root", NULL)'
      );
      console.log('Root category created');
    }
    
  } finally {
    await connection.end();
  }
}

async function cleanDatabase() {
  console.log('Cleaning test database...');
  
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Ordine importante per FK constraints
    const tables = [
      'order_items', 'orders', 'cart_items', 'carts', 
      'product_images', 'products', 'category_images', 
      'delivery_info', 'extended_users', 'issues',
      'users', 'categories'
    ];
    
    for (const table of tables) {
      try {
        await connection.query(`DELETE FROM ${table}`);
        await connection.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
      } catch (error) {
        console.warn(`Warning: Could not clean table ${table}:`, error.message);
      }
    }
    
    // Root category sempre presente
    await connection.query(
      'INSERT INTO categories (id, name, dad_id) VALUES (1, "root", NULL)'
    );
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('Database cleaned successfully');
    
  } finally {
    await connection.end();
  }
}

async function verifyDatabase() {
  console.log('Verifying database status...');
  
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'",
      [dbConfig.database]
    );
    
    console.log(`Found ${tables.length} tables:`);
    tables.forEach(table => console.log(`  - ${table.TABLE_NAME}`));
    
    // Conta records in tabelle principali
    const mainTables = ['users', 'categories', 'products'];
    for (const tableName of mainTables) {
      try {
        const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`  ${tableName}: ${count[0].count} records`);
      } catch (error) {
        console.log(`  ${tableName}: Error counting records`);
      }
    }
    
  } finally {
    await connection.end();
  }
}

// Script principale
async function main() {
  const action = process.argv[2] || 'init';
  
  try {
    await waitForDatabase();
    
    switch (action) {
      case 'init':
        await initializeDatabase();
        await verifyDatabase();
        break;
      case 'clean':
        await cleanDatabase();
        await verifyDatabase();
        break;
      case 'verify':
        await verifyDatabase();
        break;
      default:
        console.log('Usage: node db-setup.js [init|clean|verify]');
        process.exit(1);
    }
    
    console.log(`Database ${action} completed successfully`);
    
  } catch (error) {
    console.error(`Database ${action} failed:`, error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  waitForDatabase,
  initializeDatabase,
  cleanDatabase,
  verifyDatabase
}; 