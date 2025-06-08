require('dotenv').config({ path: '../.env' });

// Setup base per test integrativi
console.log('Starting simplified integration test setup...');

const config = require('./config');

console.log('\nAPI target:', config.server.baseUrl, '\n');

// Aumenta il timeout per i test integrativi
jest.setTimeout(30000);

// Test helper per utenti di test
global.testUsers = {
  admin: {
    id: 1,
    email: 'admin@test.com',
    name: 'Admin Test',
    role: 'admin'
  },
  client: {
    id: 2,
    email: 'client@test.com',
    name: 'Client Test',
    role: 'client'
  },
  artisan: {
    id: 3,
    email: 'artisan@test.com',
    name: 'Artisan Test',
    role: 'artisan'
  }
};

// Pulizia dopo tutti i test
afterAll(async () => {
  console.log('Integration test cleanup completed');
});

// Per compatibilità con i test esistenti che usano fail()
global.fail = (message) => {
  throw new Error(message || 'Test failed');
};

console.log('Integration test setup completed - using existing database users\n'); 