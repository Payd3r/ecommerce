// Performance test configuration
module.exports = {
  server: {
    port: process.env.PORT || 3001,
    baseUrl: process.env.BACKEND_URL || `http://backend-test:3001`,
    timeout: 10000 // 10 secondi di timeout
  },
  
  database: {
    host: process.env.DB_HOST || 'mariadb-test-db',
    user: process.env.DB_USER || 'ecommerce',
    password: process.env.DB_PASSWORD || 'ecommerce',
    name: process.env.DB_NAME || 'ecommerce_test',
    port: process.env.DB_PORT || 3306
  },
  
  // Test parameters
  performance: {
    // Concurrent requests per test
    concurrency: 10,
    // Total requests per endpoint
    totalRequests: 100,
    // Max acceptable response time (ms)
    maxResponseTime: 1000,
    // Max acceptable error rate (%)
    maxErrorRate: 5
  },
  
  // Test user credentials
  testUsers: {
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
  },

  // Setup configuration
  setup: {
    // Numero di prodotti di test da creare
    numTestProducts: 10,
    // Categorie di test
    testCategories: ['Test Category 1', 'Test Category 2'],
    // Attesa massima per setup (ms)
    setupTimeout: 30000
  }
}; 