// Setup Jest per supportare la migrazione da Mocha/Chai a Jest

// Importiamo chai per compatibilità con i test esistenti
const chai = require('chai');
global.expect = chai.expect;

// Alias per le funzioni di test per compatibilità con Mocha
global.describe = describe;
global.it = test;
global.before = beforeAll;
global.after = afterAll;
global.beforeEach = beforeEach;
global.afterEach = afterEach;

// Assicuriamo che i test non vadano in timeout
jest.setTimeout(30000);

// Evitiamo errori su console.log durante i test
global.console = {
  ...console,
  // Ignoriamo gli errori nei test
  error: jest.fn(),
  // Manteniamo il logging ma puliamo l'output
  log: jest.fn()
};

// Sovrascriviamo alcuni metodi per compatibilità
Object.defineProperty(global, 'it', {
  value: (name, fn) => {
    if (fn && fn.length > 0) {
      // Test asincrono con callback (done)
      test(name, done => {
        try {
          const result = fn(done);
          if (result && typeof result.then === 'function') {
            return result.catch(done);
          }
        } catch (error) {
          done(error);
        }
      });
    } else {
      // Test sincrono o con promise
      test(name, fn);
    }
  }
});

// Aggiungiamo chai come oggetto globale
global.chai = chai; 