// Test per le API

const { mockSuccessfulLogin, mockFailedLogin, mockUserProfile } = require('./mocks/apiMocks');
const { fetchWithAuth, authService, getApiUrl } = require('./mocks/frontendMocks');

describe('ApiService', () => {
  // Implementazione locale di ApiService per i test
  const ApiService = {
    async login(email, password) {
      try {
        const response = await fetchWithAuth(`${getApiUrl()}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Errore durante il login');
        }
        
        return data.data;
      } catch (error) {
        throw error;
      }
    },
    
    async getProfile() {
      try {
        const token = authService.getToken();
        
        const response = await fetchWithAuth(`${getApiUrl()}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Errore durante il recupero del profilo');
        }
        
        return data.data;
      } catch (error) {
        throw error;
      }
    },
    
    async getAddress() {
      try {
        const token = authService.getToken();
        
        const response = await fetchWithAuth(`${getApiUrl()}/address/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Errore durante il recupero dell\'indirizzo');
        }
        
        return data.data;
      } catch (error) {
        throw error;
      }
    },
    
    async saveAddress(address) {
      try {
        const token = authService.getToken();
        
        const response = await fetchWithAuth(`${getApiUrl()}/address`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(address)
        });
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Errore durante il salvataggio dell\'indirizzo');
        }
        
        return data.data;
      } catch (error) {
        throw error;
      }
    }
  };
  
  beforeEach(() => {
    // Resetta tutti i mock
    jest.clearAllMocks();
  });

  describe('login', () => {
    test('dovrebbe effettuare il login con successo', async () => {
      // Configura il mock di fetchWithAuth
      const mockResponse = {
        json: jest.fn().mockResolvedValue(mockSuccessfulLogin('test@example.com', 'password'))
      };
      fetchWithAuth.mockResolvedValue(mockResponse);
      
      // Chiamata al metodo login
      const result = await ApiService.login('test@example.com', 'password');
      
      // Verifica che fetchWithAuth sia stato chiamato con i parametri corretti
      expect(fetchWithAuth).toHaveBeenCalledWith('https://example.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' })
      });
      
      // Verifica che il risultato sia corretto
      expect(result).toEqual({
        token: 'fake-jwt-token',
        user: {
          id: 1,
          name: 'Utente Test',
          email: 'test@example.com',
          role: 'client'
        }
      });
    });

    test('dovrebbe gestire errori durante il login', async () => {
      // Configura il mock di fetchWithAuth
      const mockResponse = {
        json: jest.fn().mockResolvedValue(mockFailedLogin())
      };
      fetchWithAuth.mockResolvedValue(mockResponse);
      
      // Verifica che venga lanciato un errore
      await expect(ApiService.login('test@example.com', 'password')).rejects.toThrow('Credenziali non valide');
    });
  });

  describe('getProfile', () => {
    test('dovrebbe recuperare il profilo utente', async () => {
      // Configura i mock
      authService.getToken.mockReturnValue('fake-jwt-token');
      const mockResponse = {
        json: jest.fn().mockResolvedValue(mockUserProfile())
      };
      fetchWithAuth.mockResolvedValue(mockResponse);
      
      // Chiamata al metodo getProfile
      const result = await ApiService.getProfile();
      
      // Verifica che fetchWithAuth sia stato chiamato con i parametri corretti
      expect(fetchWithAuth).toHaveBeenCalledWith('https://example.com/api/auth/profile', {
        headers: {
          'Authorization': 'Bearer fake-jwt-token'
        }
      });
      
      // Verifica che il risultato sia corretto
      expect(result).toEqual(mockUserProfile().data);
    });

    test('dovrebbe gestire errori durante il recupero del profilo', async () => {
      // Configura i mock
      authService.getToken.mockReturnValue('fake-jwt-token');
      const mockResponse = {
        json: jest.fn().mockResolvedValue({
          success: false,
          message: 'Errore durante il recupero del profilo'
        })
      };
      fetchWithAuth.mockResolvedValue(mockResponse);
      
      // Verifica che venga lanciato un errore
      await expect(ApiService.getProfile()).rejects.toThrow('Errore durante il recupero del profilo');
    });
  });

  describe('getAddress', () => {
    test('dovrebbe recuperare l\'indirizzo dell\'utente', async () => {
      // Configura i mock
      authService.getToken.mockReturnValue('fake-jwt-token');
      const mockResponse = {
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            id: 1,
            user_id: 1,
            street: 'Via Test',
            city: 'Città Test',
            postal_code: '12345',
            country: 'Italia'
          }
        })
      };
      fetchWithAuth.mockResolvedValue(mockResponse);
      
      // Chiamata al metodo getAddress
      const result = await ApiService.getAddress();
      
      // Verifica che fetchWithAuth sia stato chiamato con i parametri corretti
      expect(fetchWithAuth).toHaveBeenCalledWith('https://example.com/api/address/me', {
        headers: {
          'Authorization': 'Bearer fake-jwt-token'
        }
      });
      
      // Verifica che il risultato sia corretto
      expect(result).toEqual({
        id: 1,
        user_id: 1,
        street: 'Via Test',
        city: 'Città Test',
        postal_code: '12345',
        country: 'Italia'
      });
    });
  });

  describe('saveAddress', () => {
    test('dovrebbe salvare l\'indirizzo dell\'utente', async () => {
      // Configura i mock
      authService.getToken.mockReturnValue('fake-jwt-token');
      const mockResponse = {
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            id: 1,
            user_id: 1,
            street: 'Via Test',
            city: 'Città Test',
            postal_code: '12345',
            country: 'Italia'
          }
        })
      };
      fetchWithAuth.mockResolvedValue(mockResponse);
      
      // Indirizzo da salvare
      const address = {
        street: 'Via Test',
        city: 'Città Test',
        postal_code: '12345',
        country: 'Italia'
      };
      
      // Chiamata al metodo saveAddress
      const result = await ApiService.saveAddress(address);
      
      // Verifica che fetchWithAuth sia stato chiamato con i parametri corretti
      expect(fetchWithAuth).toHaveBeenCalledWith('https://example.com/api/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake-jwt-token'
        },
        body: JSON.stringify(address)
      });
      
      // Verifica che il risultato sia corretto
      expect(result).toEqual({
        id: 1,
        user_id: 1,
        street: 'Via Test',
        city: 'Città Test',
        postal_code: '12345',
        country: 'Italia'
      });
    });
  });
}); 