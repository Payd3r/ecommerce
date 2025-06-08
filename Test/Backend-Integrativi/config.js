require('dotenv').config();

module.exports = {
  // Configurazione del server di test - usa backend di test
  server: {
    port: process.env.PORT || 3017,
    baseUrl: `http://localhost:3017` // Backend di test che usa il database di test
  },
  
  // Configurazione del database di test
  database: {
    host: 'localhost',
    user: process.env.DB_USER || 'test_user',
    password: process.env.DB_PASSWORD || 'test_password',
    name: process.env.DB_NAME || 'test_db',
    port: process.env.DB_PORT || 3016
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