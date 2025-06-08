// setup.js
const { enableFetchMocks } = require('jest-fetch-mock');

// Abilita i mock per fetch
enableFetchMocks();

// Crea un mock del localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

// Configura il localStorage globale
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock per document.getElementById
document.getElementById = jest.fn().mockImplementation((id) => {
  if (id === 'app-container') {
    return document.createElement('div');
  }
  return null;
});

// Mock per gli eventi del documento
document.addEventListener = jest.fn();
document.dispatchEvent = jest.fn();

// Mock per window.history
window.history = {
  pushState: jest.fn(),
  replaceState: jest.fn()
};

// Mock per window.scrollTo
window.scrollTo = jest.fn();

// Mock per CustomEvent
global.CustomEvent = class CustomEvent extends Event {
  constructor(name, options = {}) {
    super(name, options);
    this.detail = options.detail || {};
  }
};

// Mock di alert e confirm
global.alert = jest.fn();
global.confirm = jest.fn(() => true); 