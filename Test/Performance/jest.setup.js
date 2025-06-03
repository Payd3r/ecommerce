// Jest setup per performance tests
const config = require('./config');

// Setup globale per performance tests
beforeAll(() => {
  console.log('=== Performance Test Suite Setup ===');
  console.log(`Target API: ${config.server.baseUrl}`);
  console.log(`Concurrency: ${config.performance.concurrency}`);
  console.log(`Total requests: ${config.performance.totalRequests}`);
  console.log(`Max response time: ${config.performance.maxResponseTime}ms`);
  console.log('=====================================');
});

// Utilities globali per i test
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
global.measureTime = async (fn) => {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
}; 