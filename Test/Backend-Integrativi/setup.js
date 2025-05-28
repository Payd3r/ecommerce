const chai = require('chai');
const chaiHttp = require('chai-http');
const { cleanTestDb, createTestUser } = require('./utils/testHelpers');
const config = require('./config');
const path = require('path');

// Importa il backend app
// Nota: il percorso è relativo alla radice del container
const app = require('/usr/src/app/Backend/app');

// Configura chai
chai.use(chaiHttp);
chai.should();

// Avvia il server di test
let server;

before(async function() {
  this.timeout(10000); // Timeout più lungo per l'avvio del server e la pulizia del DB

  // Pulisci il database di test prima di tutti i test
  try {
    await cleanTestDb();
    console.log('Database di test pulito con successo.');
    
    // Crea utenti di test per tutti i ruoli
    const admin = await createTestUser({
      email: config.testData.admin.email,
      password: config.testData.admin.password,
      name: config.testData.admin.name,
      role: 'admin'
    });
    console.log('Utente admin di test creato:', admin.id);

    const client = await createTestUser({
      email: config.testData.client.email,
      password: config.testData.client.password,
      name: config.testData.client.name,
      role: 'client'
    });
    console.log('Utente client di test creato:', client.id);

    const artisan = await createTestUser({
      email: config.testData.artisan.email,
      password: config.testData.artisan.password,
      name: config.testData.artisan.name,
      role: 'artisan',
      bio: 'Artigiano di test per i test integrativi',
      approved: 1
    });
    console.log('Utente artisan di test creato:', artisan.id);
    
    // Avvia il server sulla porta di test
    const port = config.server.port;
    server = app.listen(port, () => {
      console.log(`Server di test in ascolto sulla porta ${port}`);
    });
  } catch (error) {
    console.error('Errore durante il setup dei test:', error);
    throw error;
  }
});

after(function(done) {
  // Chiudi il server dopo tutti i test
  if (server) {
    server.close(() => {
      console.log('Server di test chiuso');
      done();
    });
  } else {
    done();
  }
});

module.exports = {
  chai,
  app,
  expect: chai.expect,
  config
}; 