// Setup generale per i test

// Mock per il console.log in modo che non interferisca con l'output dei test
global.console = {
  ...console,
  // Log personalizzato che non stampa durante l'esecuzione dei test
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  // Mantieni gli errori e i warning
  error: console.error,
  warn: console.warn
}; 