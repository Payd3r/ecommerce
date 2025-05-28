const sinon = require('sinon');

// Crea un oggetto req mock per Express
function mockRequest(options = {}) {
  const req = {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...options
  };
  
  return req;
}

// Crea un oggetto res mock per Express
function mockResponse() {
  const res = {};
  
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  res.send = sinon.stub().returns(res);
  
  return res;
}

// Crea una funzione next mock per middleware Express
function mockNext() {
  return sinon.stub();
}

module.exports = {
  mockRequest,
  mockResponse,
  mockNext
}; 