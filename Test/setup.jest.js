// Setup per Jest
jest.setTimeout(30000); // Aumenta il timeout predefinito a 30 secondi

// Sopprime i messaggi di console durante i test a meno che non sia specificato diversamente
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Aggiunge helper per i test
global.waitFor = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Setup per i mock dei database
process.env.NODE_ENV = 'test';

// Pulizia dopo tutti i test
afterAll(async () => {
  // Assicura che tutte le operazioni asincrone siano complete
  await new Promise(resolve => setTimeout(resolve, 500));
}); 