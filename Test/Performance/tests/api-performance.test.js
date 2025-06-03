const axios = require('axios');
const config = require('../config');

// Test client con timeout configurabile
const client = axios.create({
  baseURL: config.server.baseUrl,
  timeout: config.server.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper per eseguire richieste concorrenti
async function runConcurrentRequests(requestFn, count = config.performance.concurrency) {
  const promises = Array(count).fill().map((_, i) => 
    requestFn(i).catch(err => ({ error: err.message, status: err.response?.status }))
  );
  
  const results = await Promise.all(promises);
  
  // Analisi risultati
  const successful = results.filter(r => !r.error);
  const errors = results.filter(r => r.error);
  const responseTimes = successful.map(r => r.duration || 0);
  
  return {
    total: count,
    successful: successful.length,
    errors: errors.length,
    errorRate: (errors.length / count) * 100,
    avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0,
    maxResponseTime: Math.max(...responseTimes, 0),
    minResponseTime: Math.min(...responseTimes, Infinity) || 0
  };
}

// Helper per login e token
async function getAuthToken(userType = 'client') {
  const user = config.testUsers[userType];
  const start = Date.now();
  
  try {
    const response = await client.post('/auth/login', {
      email: user.email,
      password: user.password
    });
    
    return {
      token: response.data.token,
      duration: Date.now() - start
    };
  } catch (error) {
    throw new Error(`Login failed for ${userType}: ${error.message}`);
  }
}

describe('API Performance Tests', () => {
  let authTokens = {};
  
  beforeAll(async () => {
    console.log('Setting up auth tokens for performance tests...');
    
    // Pre-authenticate users per evitare overhead durante test
    try {
      authTokens.client = await getAuthToken('client');
      authTokens.admin = await getAuthToken('admin');
      authTokens.artisan = await getAuthToken('artisan');
      console.log('Auth tokens ready');
    } catch (error) {
      console.warn('Auth setup failed, some tests may fail:', error.message);
    }
  });

  describe('Product API Performance', () => {
    test('GET /products - Response Time Test', async () => {
      const { result: stats } = await measureTime(async () => {
        return await runConcurrentRequests(async (i) => {
          const start = Date.now();
          const response = await client.get('/products?limit=20&page=1');
          return {
            status: response.status,
            duration: Date.now() - start
          };
        });
      });
      
      console.log(`Products API Stats:`, stats);
      
      // Assertions
      expect(stats.errorRate).toBeLessThanOrEqual(config.performance.maxErrorRate);
      expect(stats.avgResponseTime).toBeLessThanOrEqual(config.performance.maxResponseTime);
      expect(stats.successful).toBeGreaterThan(0);
    });
    
    test('GET /products/:id - Single Product Performance', async () => {
      const stats = await runConcurrentRequests(async (i) => {
        const start = Date.now();
        // Test con product ID esistente (assumiamo ID 1 esista)
        const response = await client.get('/products/1');
        return {
          status: response.status,
          duration: Date.now() - start
        };
      }, 50); // Test più leggero
      
      console.log(`Single Product API Stats:`, stats);
      
      expect(stats.errorRate).toBeLessThanOrEqual(config.performance.maxErrorRate);
      expect(stats.avgResponseTime).toBeLessThanOrEqual(500); // Target più basso per singolo item
    });
  });

  describe('Categories API Performance', () => {
    test('GET /categories - Categories List Performance', async () => {
      const stats = await runConcurrentRequests(async (i) => {
        const start = Date.now();
        const response = await client.get('/categories');
        return {
          status: response.status,
          duration: Date.now() - start
        };
      });
      
      console.log(`Categories API Stats:`, stats);
      
      expect(stats.errorRate).toBeLessThanOrEqual(config.performance.maxErrorRate);
      expect(stats.avgResponseTime).toBeLessThanOrEqual(config.performance.maxResponseTime);
    });
  });

  describe('Auth API Performance', () => {
    test('POST /auth/login - Login Performance', async () => {
      const stats = await runConcurrentRequests(async (i) => {
        const start = Date.now();
        const response = await client.post('/auth/login', {
          email: config.testUsers.client.email,
          password: config.testUsers.client.password
        });
        return {
          status: response.status,
          duration: Date.now() - start
        };
      }, 20); // Login è più pesante, riduciamo concorrenza
      
      console.log(`Login API Stats:`, stats);
      
      expect(stats.errorRate).toBeLessThanOrEqual(config.performance.maxErrorRate);
      expect(stats.avgResponseTime).toBeLessThanOrEqual(2000); // Login può essere più lento
    });
  });

  describe('Load Test - High Concurrency', () => {
    test('Mixed API Load Test', async () => {
      console.log('Starting mixed load test...');
      
      const endpoints = [
        () => client.get('/products?limit=10'),
        () => client.get('/categories'),
        () => client.get('/users/artisans')
      ];
      
      const stats = await runConcurrentRequests(async (i) => {
        const start = Date.now();
        const endpoint = endpoints[i % endpoints.length];
        const response = await endpoint();
        return {
          status: response.status,
          duration: Date.now() - start
        };
      }, config.performance.totalRequests);
      
      console.log(`Load Test Stats:`, stats);
      console.log(`Throughput: ${(stats.successful / (stats.avgResponseTime / 1000)).toFixed(2)} req/sec`);
      
      expect(stats.errorRate).toBeLessThanOrEqual(config.performance.maxErrorRate);
      expect(stats.avgResponseTime).toBeLessThanOrEqual(config.performance.maxResponseTime * 1.5); // Più tollerante per load test
    });
  });
  
  describe('Database Performance', () => {
    test('Database Connection Pool Test', async () => {
      const mysql = require('mysql2/promise');
      
      const stats = await runConcurrentRequests(async (i) => {
        const start = Date.now();
        
        const connection = await mysql.createConnection({
          host: config.database.host,
          user: config.database.user,
          password: config.database.password,
          database: config.database.name,
          port: config.database.port
        });
        
        await connection.query('SELECT COUNT(*) as count FROM products');
        await connection.end();
        
        return {
          duration: Date.now() - start
        };
      }, 20);
      
      console.log(`DB Connection Stats:`, stats);
      
      expect(stats.errorRate).toBeLessThanOrEqual(5);
      expect(stats.avgResponseTime).toBeLessThanOrEqual(1000);
    });
  });
}); 