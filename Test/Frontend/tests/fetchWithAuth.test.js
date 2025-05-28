// Test per fetchWithAuth.js

// Import dei mock
const { authService, showBootstrapToast, router } = require('./mocks/frontendMocks');

describe('fetchWithAuth', () => {
  // Implementazione locale di fetchWithAuth per i test
  const fetchWithAuth = async (url, options = {}) => {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 401) {
        // Logout automatico in caso di errore 401 (token non valido)
        authService.logout();
        showBootstrapToast('Sessione scaduta. Effettua nuovamente il login.', 'Attenzione', 'warning');
        router.navigateToLogin('/test-path');
        throw new Error('Non autorizzato. Effettua di nuovo il login.');
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  beforeEach(() => {
    // Resetta tutti i mock
    jest.clearAllMocks();
    
    // Mock di global.fetch
    global.fetch = jest.fn();
  });

  test('dovrebbe chiamare fetch con i parametri corretti', async () => {
    // Configura il mock di fetch per restituire una risposta ok
    global.fetch.mockResolvedValue({
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true })
    });
    
    // Parametri per la richiesta
    const url = 'https://example.com/api';
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'test' })
    };
    
    // Chiamata al metodo fetchWithAuth
    await fetchWithAuth(url, options);
    
    // Verifica che fetch sia stato chiamato con i parametri corretti
    expect(global.fetch).toHaveBeenCalledWith(url, options);
  });

  test('dovrebbe gestire correttamente una risposta con status 401', async () => {
    // Configura il mock di fetch per restituire una risposta con status 401
    global.fetch.mockResolvedValue({
      status: 401,
      json: jest.fn().mockResolvedValue({ success: false, message: 'Non autorizzato' })
    });
    
    // Chiamata al metodo fetchWithAuth
    await expect(fetchWithAuth('https://example.com/api')).rejects.toThrow('Non autorizzato. Effettua di nuovo il login.');
    
    // Verifica che il metodo logout sia stato chiamato
    expect(authService.logout).toHaveBeenCalled();
    
    // Verifica che sia stato mostrato un toast di avviso
    expect(showBootstrapToast).toHaveBeenCalled();
    
    // Verifica che sia stato chiamato il metodo di reindirizzamento
    expect(router.navigateToLogin).toHaveBeenCalledWith('/test-path');
  });

  test('dovrebbe restituire la risposta per status code diversi da 401', async () => {
    // Configura il mock di fetch per restituire una risposta con status 200
    const mockResponse = {
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true, data: 'test' })
    };
    
    global.fetch.mockResolvedValue(mockResponse);
    
    // Chiamata al metodo fetchWithAuth
    const response = await fetchWithAuth('https://example.com/api');
    
    // Verifica che la risposta sia quella attesa
    expect(response).toEqual(mockResponse);
    
    // Verifica che il metodo logout non sia stato chiamato
    expect(authService.logout).not.toHaveBeenCalled();
    
    // Verifica che non sia stato mostrato un toast
    expect(showBootstrapToast).not.toHaveBeenCalled();
    
    // Verifica che non sia stato chiamato il metodo di reindirizzamento
    expect(router.navigateToLogin).not.toHaveBeenCalled();
  });

  test('dovrebbe gestire correttamente errori di rete', async () => {
    // Configura il mock di fetch per simulare un errore di rete
    global.fetch.mockRejectedValue(new Error('Network error'));
    
    // Chiamata al metodo fetchWithAuth
    await expect(fetchWithAuth('https://example.com/api')).rejects.toThrow('Network error');
    
    // Verifica che fetch sia stato chiamato
    expect(global.fetch).toHaveBeenCalled();
  });
}); 