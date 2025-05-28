// Mock per i servizi del frontend

// authService
const authService = {
  isAuthenticated: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  getProfile: jest.fn(),
  getToken: jest.fn(),
  getUser: jest.fn(),
  hasRole: jest.fn(),
  saveAuthData: jest.fn(),
  updateUserData: jest.fn()
};

// Router
const router = {
  init: jest.fn(),
  register: jest.fn(),
  navigate: jest.fn(),
  navigateToLogin: jest.fn(),
  navigateToHome: jest.fn(),
  navigateToDashboard: jest.fn(),
  handleLinkClick: jest.fn(),
  handlePopState: jest.fn(),
  container: document.createElement('div'),
  routes: {},
  currentRoute: null
};

// Toast
const showBootstrapToast = jest.fn();

// Loader
const loader = {
  show: jest.fn(),
  hide: jest.fn()
};

// Navbar e Footer
const navbar = {
  render: jest.fn()
};

const footer = {
  render: jest.fn()
};

// fetchWithAuth
const fetchWithAuth = jest.fn();

// ApiService
const ApiService = {
  login: jest.fn(),
  register: jest.fn(),
  getProfile: jest.fn(),
  getAddress: jest.fn(),
  saveAddress: jest.fn(),
  updateProfile: jest.fn(),
  updateArtisanBio: jest.fn(),
  uploadArtisanBanner: jest.fn()
};

// getApiUrl
const getApiUrl = jest.fn().mockReturnValue('https://example.com/api');

module.exports = {
  authService,
  router,
  showBootstrapToast,
  loader,
  navbar,
  footer,
  fetchWithAuth,
  ApiService,
  getApiUrl
}; 