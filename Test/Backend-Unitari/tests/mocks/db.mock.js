const sinon = require('sinon');

// Mock per il database MySQL
const dbMock = {
  query: sinon.stub(),
  getConnection: sinon.stub(),
};

// Simulazione di una connessione al database
const connectionMock = {
  query: sinon.stub(),
  beginTransaction: sinon.stub().resolves(),
  commit: sinon.stub().resolves(),
  rollback: sinon.stub().resolves(),
  release: sinon.stub(),
};

// Configura il mock della connessione
dbMock.getConnection.resolves(connectionMock);

// Funzione di reset dei mock per i test
function resetMocks() {
  dbMock.query.reset();
  dbMock.getConnection.reset();
  connectionMock.query.reset();
  connectionMock.beginTransaction.reset();
  connectionMock.commit.reset();
  connectionMock.rollback.reset();
  connectionMock.release.reset();
}

module.exports = {
  db: dbMock,
  connection: connectionMock,
  resetMocks
}; 