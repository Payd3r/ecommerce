// Performance test configuration
module.exports = {
  server: {
    baseUrl: 'http://localhost:3016', // Backend locale nel container
    timeout: 30000
  },
  
  database: {
    host: 'db-test',
    user: 'test_user', 
    password: 'test_password',
    name: 'test_db',
    port: 3306
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
      password: 'admin123'
    },
    client: {
      email: 'client@test.com', 
      password: 'client123'
    },
    artisan: {
      email: 'artisan@test.com',
      password: 'artisan123'
    }
  }
}; 