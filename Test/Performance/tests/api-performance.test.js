const axios = require('axios');
const config = require('../config');
const setupTestData = require('../setup');

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

describe('API Performance Tests', () => {
  beforeAll(async () => {
    console.log('Setting up test environment...');
    await setupTestData();
  }, config.setup.setupTimeout);

  describe('Auth API Performance', () => {
    test('POST /auth/login - Login Performance', async () => {
      const stats = await runConcurrentRequests(async (i) => {
        const userType = Object.keys(config.testUsers)[i % Object.keys(config.testUsers).length];
        const user = config.testUsers[userType];
        const start = Date.now();
        const response = await client.post('/auth/login', {
          email: user.email,
          password: user.password
        });
        return {
          status: response.status,
          duration: Date.now() - start
        };
      });
      
      console.log(`Login API Stats:`, stats);
      
      expect(stats.errorRate).toBeLessThanOrEqual(20);
      expect(stats.avgResponseTime).toBeLessThanOrEqual(3000);
      expect(stats.successful).toBeGreaterThan(0);
    });
  });

  describe('Product API Performance', () => {
    test('GET /products - Response Time Test', async () => {
      const stats = await runConcurrentRequests(async (i) => {
        const start = Date.now();
        const response = await client.get('/products?limit=20&page=1');
        return {
          status: response.status,
          duration: Date.now() - start
        };
      });
      
      console.log(`Products API Stats:`, stats);
      
      expect(stats.errorRate).toBeLessThanOrEqual(20);
      expect(stats.avgResponseTime).toBeLessThanOrEqual(3000);
      expect(stats.successful).toBeGreaterThan(0);
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
      
      expect(stats.errorRate).toBeLessThanOrEqual(20);
      expect(stats.avgResponseTime).toBeLessThanOrEqual(3000);
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
      
      expect(stats.errorRate).toBeLessThanOrEqual(30);
      expect(stats.avgResponseTime).toBeLessThanOrEqual(5000);
    });
  });
}); 