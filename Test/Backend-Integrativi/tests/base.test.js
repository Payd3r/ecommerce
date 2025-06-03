// Test base per verificare la configurazione Jest nei test integrativi

describe('Base Test', () => {
  it('dovrebbe verificare che la configurazione di test funzioni correttamente', () => {
    expect(typeof describe).toBe('function');
    expect(typeof it).toBe('function');
    expect(typeof expect).toBe('function');
  });

  it('dovrebbe supportare richieste HTTP', () => {
    const axios = require('axios');
    expect(typeof axios.get).toBe('function');
  });
}); 