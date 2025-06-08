require('dotenv').config();

module.exports = {
  // Configurazione del server di test - usa backend di test
  server: {
    port: process.env.PORT || 3015,
    baseUrl: `http://backend-test:3015` // Backend di test che usa il database di test
  },
  
  // Configurazione del database di test
  database: {
    host: process.env.DB_HOST || 'db-test',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || '1234',
    name: process.env.DB_NAME || 'ecommerce_test_db',
    port: process.env.DB_PORT || 3306
  },
  
  // Altre configurazioni
  jwt: {
    secret: process.env.JWT_SECRET || 'test_secret_key'
  },
  
  // Dati per i test
  testData: {
    admin: {
      email: 'admin@test.com',
      password: 'admin123',
      name: 'Admin Test'
    },
    client: {
      email: 'client@test.com',
      password: 'client123',
      name: 'Client Test'
    },
    artisan: {
      email: 'artisan@test.com',
      password: 'artisan123',
      name: 'Artisan Test'
    }
  }
}; 