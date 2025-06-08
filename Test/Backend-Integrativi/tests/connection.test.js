const axios = require('axios');
const config = require('../config');

describe('Connection Test', () => {
  it('dovrebbe connettersi al backend', async () => {
    try {
      const response = await axios.get(`${config.server.baseUrl}/health`);
      
      console.log('Response status:', response.status);
      console.log('Response body:', response.data);
      
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      console.log('\nError: No error\n');
    } catch (error) {
      console.log('\nError:', error.message, '\n');
      throw error;
    }
  });
}); 