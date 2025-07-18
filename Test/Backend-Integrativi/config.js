require('dotenv').config();

module.exports = {
  // Configurazione del server di test - usa backend di test
  server: {
    port: process.env.PORT || 3001,
    baseUrl: process.env.BACKEND_URL || `http://backend-test:3001` // Backend di test che usa il database di test
  },
  
  // Configurazione del database di test
  database: {
    host: process.env.DB_HOST || 'mariadb-test-db',
    user: process.env.DB_USER || 'ecommerce',
    password: process.env.DB_PASSWORD || 'ecommerce',
    name: process.env.DB_NAME || 'ecommerce_test',
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