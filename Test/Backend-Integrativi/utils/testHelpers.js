const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Crea una connessione al DB di test
 */
async function getTestDbConnection() {
  try {
    const connection = await mysql.createConnection({
      host: config.database.host,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      port: config.database.port
    });
    return connection;
  } catch (error) {
    console.error('Errore di connessione al database di test:', error);
    throw error;
  }
}

/**
 * Ripulisce le tabelle del database di test
 */
async function cleanTestDb() {
  const connection = await getTestDbConnection();
  try {
    // Disabilita temporaneamente i controlli di foreign key
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Tabelle da pulire in ordine specifico per evitare problemi di foreign key
    const tables = [
      'order_items', 'orders', 'cart_items', 'carts', 
      'product_images', 'products', 'category_images', 'categories',
      'profile_image', 'delivery_info', 'extended_users', 'issues',
      'users'
    ];
    
    for (const table of tables) {
      await connection.query(`DELETE FROM ${table}`);
      // Resetta gli auto_increment
      await connection.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
    }
    
    // Reinsert root category if needed
    await connection.query(`INSERT INTO categories (id, name, dad_id) VALUES (1, 'root', NULL)`);
    
    // Riabilita i controlli di foreign key
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  } catch (error) {
    console.error('Errore durante la pulizia del database di test:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Crea un utente di test nel database
 */
async function createTestUser(userData) {
  const connection = await getTestDbConnection();
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [result] = await connection.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [userData.email, hashedPassword, userData.name, userData.role || 'client']
    );
    
    const userId = result.insertId;
    
    // Se è un artigiano, aggiungi anche i dati estesi
    if (userData.role === 'artisan') {
      await connection.query(
        'INSERT INTO extended_users (id_users, bio, approved) VALUES (?, ?, ?)',
        [userId, userData.bio || 'Test bio', userData.approved || 1]
      );
    }
    
    return {
      id: userId,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'client'
    };
  } catch (error) {
    console.error('Errore durante la creazione dell\'utente di test:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Genera un token JWT per un utente
 */
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
}

/**
 * Crea una categoria di test
 */
async function createTestCategory(categoryData) {
  const connection = await getTestDbConnection();
  try {
    const [result] = await connection.query(
      'INSERT INTO categories (name, description, dad_id) VALUES (?, ?, ?)',
      [categoryData.name, categoryData.description || null, categoryData.dad_id || 1]
    );
    
    return {
      id: result.insertId,
      name: categoryData.name,
      description: categoryData.description,
      dad_id: categoryData.dad_id || 1
    };
  } catch (error) {
    console.error('Errore durante la creazione della categoria di test:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Crea un prodotto di test
 */
async function createTestProduct(productData) {
  const connection = await getTestDbConnection();
  try {
    const [result] = await connection.query(
      'INSERT INTO products (artisan_id, name, description, price, discount, stock, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        productData.artisan_id,
        productData.name,
        productData.description || null,
        productData.price,
        productData.discount || 0,
        productData.stock || 10,
        productData.category_id
      ]
    );
    
    return {
      id: result.insertId,
      ...productData
    };
  } catch (error) {
    console.error('Errore durante la creazione del prodotto di test:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Crea un carrello di test
 */
async function createTestCart(userId) {
  const connection = await getTestDbConnection();
  try {
    const [result] = await connection.query(
      'INSERT INTO carts (user_id) VALUES (?)',
      [userId]
    );
    
    return {
      id: result.insertId,
      user_id: userId
    };
  } catch (error) {
    console.error('Errore durante la creazione del carrello di test:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Aggiungi un item al carrello di test
 */
async function addTestCartItem(cartId, productId, quantity = 1) {
  const connection = await getTestDbConnection();
  try {
    const [result] = await connection.query(
      'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
      [cartId, productId, quantity]
    );
    
    return {
      id: result.insertId,
      cart_id: cartId,
      product_id: productId,
      quantity
    };
  } catch (error) {
    console.error('Errore durante l\'aggiunta dell\'item al carrello di test:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Crea un ordine di test
 */
async function createTestOrder(orderData) {
  const connection = await getTestDbConnection();
  try {
    const [result] = await connection.query(
      'INSERT INTO orders (client_id, total_price, status) VALUES (?, ?, ?)',
      [orderData.client_id, orderData.total_price, orderData.status || 'pending']
    );
    
    const orderId = result.insertId;
    
    // Aggiungi gli order_items se forniti
    if (orderData.items && orderData.items.length > 0) {
      for (const item of orderData.items) {
        await connection.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, item.unit_price]
        );
      }
    }
    
    return {
      id: orderId,
      ...orderData
    };
  } catch (error) {
    console.error('Errore durante la creazione dell\'ordine di test:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Crea un indirizzo di test
 */
async function createTestAddress(addressData) {
  const connection = await getTestDbConnection();
  try {
    const [result] = await connection.query(
      'INSERT INTO delivery_info (user_id, name, surname, stato, citta, provincia, via, cap, numero_civico) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        addressData.user_id,
        addressData.name,
        addressData.surname,
        addressData.stato,
        addressData.citta,
        addressData.provincia,
        addressData.via,
        addressData.cap,
        addressData.numero_civico
      ]
    );
    
    return {
      id: result.insertId,
      ...addressData
    };
  } catch (error) {
    console.error('Errore durante la creazione dell\'indirizzo di test:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

module.exports = {
  getTestDbConnection,
  cleanTestDb,
  createTestUser,
  generateToken,
  createTestCategory,
  createTestProduct,
  createTestCart,
  addTestCartItem,
  createTestOrder,
  createTestAddress
}; 