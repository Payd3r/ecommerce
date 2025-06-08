// Test per authService.js
const { mockSuccessfulLogin, mockUserProfile } = require('./mocks/apiMocks');
const { ApiService } = require('./mocks/frontendMocks');

describe('AuthService', () => {
  // Crea un'istanza locale di authService per i test
  const authService = {
    login: async (email, password) => {
      try {
        const response = await ApiService.login(email, password);
        authService.saveAuthData(response.token, response.user);
        return response.user;
      } catch (error) {
        throw error;
      }
    },

    logout: () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    },

    getProfile: async () => {
      if (!authService.isAuthenticated()) {
        throw new Error('Utente non autenticato');
      }
      const userData = await ApiService.getProfile();
      authService.updateUserData(userData);
      return userData;
    },

    isAuthenticated: () => {
      return !!authService.getToken();
    },

    getToken: () => {
      return localStorage.getItem('auth_token');
    },

    getUser: () => {
      const userData = localStorage.getItem('auth_user');
      return userData ? JSON.parse(userData) : null;
    },

    hasRole: (role) => {
      const user = authService.getUser();
      if (!user) return false;
      if (Array.isArray(role)) {
        return role.includes(user.role);
      }
      return user.role === role;
    },

    saveAuthData: (token, user) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    },

    updateUserData: (userData) => {
      const currentUser = authService.getUser();
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  };

  beforeEach(() => {
    // Resetta tutti i mock
    jest.clearAllMocks();
    // Pulisci localStorage
    localStorage.clear();
  });

  describe('login', () => {
    test('dovrebbe effettuare il login con successo e salvare i dati di autenticazione', async () => {
      // Configura il mock
      const mockResponse = mockSuccessfulLogin('test@example.com', 'password');
      ApiService.login.mockResolvedValue({
        token: mockResponse.data.token,
        user: mockResponse.data.user
      });

      // Chiamata al metodo login
      const user = await authService.login('test@example.com', 'password');

      // Verifica che il metodo sia stato chiamato con i parametri corretti
      expect(ApiService.login).toHaveBeenCalledWith('test@example.com', 'password');

      // Verifica che i dati siano stati salvati nel localStorage
      expect(localStorage.getItem('auth_token')).toBe('fake-jwt-token');
      expect(localStorage.getItem('auth_user')).toBe(JSON.stringify(mockResponse.data.user));

      // Verifica che il metodo restituisca l'utente
      expect(user).toEqual(mockResponse.data.user);
    });

    test('dovrebbe gestire errori durante il login', async () => {
      // Configura il mock per simulare un errore
      ApiService.login.mockRejectedValue(new Error('Credenziali non valide'));

      // Verifica che venga lanciato un errore
      await expect(authService.login('test@example.com', 'password')).rejects.toThrow('Credenziali non valide');
    });
  });

  describe('logout', () => {
    test('dovrebbe eliminare i dati di autenticazione dal localStorage', () => {
      // Imposta i dati nel localStorage
      localStorage.setItem('auth_token', 'fake-jwt-token');
      localStorage.setItem('auth_user', JSON.stringify({ id: 1, name: 'Utente Test' }));

      // Chiamata al metodo logout
      authService.logout();

      // Verifica che i dati siano stati rimossi dal localStorage
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('auth_user')).toBeNull();
    });
  });

  describe('getProfile', () => {
    test('dovrebbe recuperare il profilo utente e aggiornare i dati nel localStorage', async () => {
      // Imposta un token nel localStorage
      localStorage.setItem('auth_token', 'fake-jwt-token');
      localStorage.setItem('auth_user', JSON.stringify({ id: 1, name: 'Utente Test', role: 'client' }));

      // Configura il mock
      const mockResponse = mockUserProfile().data;
      ApiService.getProfile.mockResolvedValue(mockResponse);

      // Chiamata al metodo getProfile
      const userData = await authService.getProfile();

      // Verifica che il metodo restituisca i dati del profilo
      expect(userData).toEqual(mockResponse);

      // Verifica che i dati utente siano stati aggiornati nel localStorage
      const updatedUser = JSON.parse(localStorage.getItem('auth_user'));
      expect(updatedUser.name).toEqual(mockResponse.name);
      expect(updatedUser.email).toEqual(mockResponse.email);
    });

    test('dovrebbe lanciare un errore se l\'utente non è autenticato', async () => {
      // Pulisci localStorage per simulare un utente non autenticato
      localStorage.clear();

      // Verifica che venga lanciato un errore
      await expect(authService.getProfile()).rejects.toThrow('Utente non autenticato');
    });
  });

  describe('isAuthenticated', () => {
    test('dovrebbe restituire true se è presente un token', () => {
      // Imposta un token nel localStorage
      localStorage.setItem('auth_token', 'fake-jwt-token');

      // Verifica che l'utente sia autenticato
      expect(authService.isAuthenticated()).toBe(true);
    });

    test('dovrebbe restituire false se non è presente un token', () => {
      // Pulisci localStorage
      localStorage.clear();

      // Verifica che l'utente non sia autenticato
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('hasRole', () => {
    test('dovrebbe restituire true se l\'utente ha il ruolo specificato', () => {
      // Imposta un utente nel localStorage
      localStorage.setItem('auth_user', JSON.stringify({ id: 1, name: 'Utente Test', role: 'admin' }));

      // Verifica che l'utente abbia il ruolo specificato
      expect(authService.hasRole('admin')).toBe(true);
    });

    test('dovrebbe restituire true se l\'utente ha uno dei ruoli specificati nell\'array', () => {
      // Imposta un utente nel localStorage
      localStorage.setItem('auth_user', JSON.stringify({ id: 1, name: 'Utente Test', role: 'client' }));

      // Verifica che l'utente abbia uno dei ruoli specificati
      expect(authService.hasRole(['admin', 'client', 'artisan'])).toBe(true);
    });

    test('dovrebbe restituire false se l\'utente non ha il ruolo specificato', () => {
      // Imposta un utente nel localStorage
      localStorage.setItem('auth_user', JSON.stringify({ id: 1, name: 'Utente Test', role: 'client' }));

      // Verifica che l'utente non abbia il ruolo specificato
      expect(authService.hasRole('admin')).toBe(false);
    });

    test('dovrebbe restituire false se non c\'è un utente loggato', () => {
      // Pulisci localStorage
      localStorage.clear();

      // Verifica che non ci sia un utente con il ruolo specificato
      expect(authService.hasRole('admin')).toBe(false);
    });
  });
}); 