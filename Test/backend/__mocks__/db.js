// Mock per il modulo db
const query = jest.fn().mockResolvedValue([[], []]);
const getConnection = jest.fn().mockResolvedValue({
  query: jest.fn(),
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn()
});

module.exports = {
  query,
  getConnection
}; 