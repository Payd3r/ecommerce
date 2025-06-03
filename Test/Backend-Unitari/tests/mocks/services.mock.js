const sinon = require('sinon');
const path = require('path');
const fs = require('fs');

// Mock per i servizi di immagini
const imageUrlMock = {
  toPublicImageUrl: sinon.stub().callsFake((url) => `http://localhost:3000${url}`)
};

// Mock per il modulo multer
const multerMock = {
  single: () => sinon.stub().callsFake((req, res, next) => next()),
  array: () => sinon.stub().callsFake((req, res, next) => next()),
  fields: () => sinon.stub().callsFake((req, res, next) => next()),
  memoryStorage: () => ({}),
  diskStorage: () => ({})
};

// Mock per il modulo sharp
const sharpMock = sinon.stub().returns({
  resize: sinon.stub().returnsThis(),
  toFormat: sinon.stub().returnsThis(),
  toFile: sinon.stub().resolves()
});

// Mock per il modulo fs
const fsMock = {
  existsSync: sinon.stub().returns(true),
  mkdirSync: sinon.stub(),
  readdirSync: sinon.stub().returns([]),
  lstatSync: sinon.stub().returns({ isFile: () => true }),
  unlinkSync: sinon.stub()
};

// Mock per Stripe
const stripeMock = {
  paymentIntents: {
    create: sinon.stub().resolves({ client_secret: 'test_client_secret' }),
    retrieve: sinon.stub().resolves({ status: 'succeeded' })
  }
};

// Funzione di reset dei mock per i test
function resetMocks() {
  imageUrlMock.toPublicImageUrl.reset();
  sharpMock.reset();
  fsMock.existsSync.reset();
  fsMock.mkdirSync.reset();
  fsMock.readdirSync.reset();
  fsMock.lstatSync.reset();
  fsMock.unlinkSync.reset();
  stripeMock.paymentIntents.create.reset();
  stripeMock.paymentIntents.retrieve.reset();
}

module.exports = {
  imageUrl: imageUrlMock,
  multer: multerMock,
  sharp: sharpMock,
  fs: fsMock,
  stripe: stripeMock,
  resetMocks
}; 