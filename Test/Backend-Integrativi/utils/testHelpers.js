const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');

// Cache per la connessione DB (riutilizzata per evitare overhead)
let sharedConnection = null;

/**
 * Connessione al DB di test - usa pool per performance migliori
 */
async function getTestDbConnection() {
  try {
    return await mysql.createConnection({
      host: config.database.host,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      port: config.database.port
    });
  } catch (error) {
    console.error('DB connection failed:', error);
    throw error;
  }
}

/**
 * Pulisce solo dati utente specifici, mantiene struttura base
 * Usato per reset tra test suite diverse
 */
async function cleanTestDb() {
  const connection = await getTestDbConnection();
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
      await connection.query(`DELETE FROM ${table}`);
      await connection.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
    }
    
    // Root category sempre presente per tests
    await connection.query(`INSERT INTO categories (id, name, dad_id) VALUES (1, 'root', NULL)`);
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  } catch (error) {
    console.error('DB cleanup failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Crea utente solo se email non esiste già
 * Previene errori di duplicazione tra test files
 */
async function createTestUserIfNotExists(userData) {
  const connection = await getTestDbConnection();
  try {
    // Check se utente esiste già
    const [existing] = await connection.query(
      'SELECT id, email, name, role FROM users WHERE email = ?',
      [userData.email]
    );
    
    if (existing.length > 0) {
      console.log(`User ${userData.email} already exists, reusing`);
      return existing[0];
    }
    
    // Crea nuovo utente
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [result] = await connection.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [userData.email, hashedPassword, userData.name, userData.role || 'client']
    );
    
    const userId = result.insertId;
    
    // Extended data per artigiani
    if (userData.role === 'artisan') {
      await connection.query(
        'INSERT INTO extended_users (id_users, bio, approved) VALUES (?, ?, ?)',
        [userId, userData.bio || 'Test bio', userData.approved || 1]
      );
    }
    
    console.log(`Created test user: ${userData.email} (ID: ${userId})`);
    return {
      id: userId,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'client'
    };
  } catch (error) {
    // Se è un errore di duplicazione email, prova a recuperare l'utente esistente
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('email')) {
      console.log(`Duplicate email detected for ${userData.email}, retrieving existing user`);
      const [existing] = await connection.query(
        'SELECT id, email, name, role FROM users WHERE email = ?',
        [userData.email]
      );
      if (existing.length > 0) {
        return existing[0];
      }
    }
    console.error('User creation failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Legacy function - ora usa createTestUserIfNotExists
 */
async function createTestUser(userData) {
  return await createTestUserIfNotExists(userData);
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
 * Crea un carrello di test o restituisce quello esistente
 */
async function createTestCart(userId) {
  const connection = await getTestDbConnection();
  try {
    // Prima controlla se esiste già un carrello per questo utente
    const [existing] = await connection.query(
      'SELECT id, user_id FROM carts WHERE user_id = ?',
      [userId]
    );
    
    if (existing.length > 0) {
      console.log(`Cart for user ${userId} already exists, reusing cart ID: ${existing[0].id}`);
      return {
        id: existing[0].id,
        user_id: userId
      };
    }
    
    // Se non esiste, crea un nuovo carrello
    const [result] = await connection.query(
      'INSERT INTO carts (user_id) VALUES (?)',
      [userId]
    );
    
    console.log(`Created new cart for user ${userId}, cart ID: ${result.insertId}`);
    return {
      id: result.insertId,
      user_id: userId
    };
  } catch (error) {
    // Se è un errore di duplicazione, prova a recuperare il carrello esistente
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('user_id')) {
      console.log(`Duplicate cart detected for user ${userId}, retrieving existing cart`);
      const [existing] = await connection.query(
        'SELECT id, user_id FROM carts WHERE user_id = ?',
        [userId]
      );
      if (existing.length > 0) {
        return {
          id: existing[0].id,
          user_id: userId
        };
      }
    }
    console.error('Errore durante la creazione del carrello di test:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Pulisce il carrello di un utente specifico
 */
async function clearUserCart(userId) {
  const connection = await getTestDbConnection();
  try {
    // Prima elimina gli items del carrello
    await connection.query(
      'DELETE ci FROM cart_items ci INNER JOIN carts c ON ci.cart_id = c.id WHERE c.user_id = ?',
      [userId]
    );
    
    console.log(`Cleared cart items for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Errore durante la pulizia del carrello:', error);
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
  createTestUserIfNotExists,
  generateToken,
  createTestCategory,
  createTestProduct,
  createTestCart,
  clearUserCart,
  addTestCartItem,
  createTestOrder,
  createTestAddress
}; 