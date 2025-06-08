// Test base per verificare la configurazione Jest nei test unitari

const { expect } = require('chai');
const sinon = require('sinon');

describe('Base Test', () => {
  it('dovrebbe verificare che la configurazione di test funzioni correttamente', () => {
    expect(1 + 1).to.equal(2);
  });
  
  it('dovrebbe supportare i mock con sinon', () => {
    const mock = sinon.stub().returns(42);
    expect(mock()).to.equal(42);
    expect(mock.calledOnce).to.be.true;
  });
  
  it('dovrebbe supportare le asserzioni con chai', () => {
    expect({ a: 1, b: 2 }).to.deep.equal({ a: 1, b: 2 });
    expect('test').to.be.a('string');
    expect(null).to.be.null;
  });
}); 