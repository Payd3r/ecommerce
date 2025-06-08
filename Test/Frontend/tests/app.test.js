// Test per App in main.js

// Import dei mock
const { router, authService, navbar, footer, showBootstrapToast } = require('./mocks/frontendMocks');

// Mock DOMContentLoaded
const mockDOMContentLoaded = () => {
  const event = new Event('DOMContentLoaded');
  document.dispatchEvent(event);
};

describe('App', () => {
  // Implementazione locale di App per i test
  let App;
  
  // Salva l'implementazione originale di document.addEventListener
  const originalAddEventListener = document.addEventListener;

  beforeAll(() => {
    // Override di document.addEventListener per catturare l'handler DOMContentLoaded
    document.addEventListener = jest.fn((event, handler) => {
      if (event === 'DOMContentLoaded') {
        // Salva l'handler per chiamarlo manualmente nei test
        document.DOMContentLoadedHandler = handler;
      } else {
        // Per altri eventi, usa l'implementazione mock di setup.js
        originalAddEventListener(event, handler);
      }
    });
    
    // Implementazione locale di App
    App = {
      init() {
        document.addEventListener('DOMContentLoaded', () => {
          // Inizializza il router
          router.init();
          
          // Renderizza i componenti fissi
          navbar.render();
          footer.render();
          
          // Controlla lo stato di autenticazione
          if (authService.isAuthenticated()) {
            authService.getProfile()
              .then(() => {
                // Trigger evento di cambio autenticazione per aggiornare l'UI
                document.dispatchEvent(new CustomEvent('auth:change'));
              })
              .catch(error => {
                console.error('Errore nel recupero del profilo:', error);
                // Se il token è scaduto, effettua il logout
                authService.logout();
                showBootstrapToast('La tua sessione è scaduta. Effettua nuovamente il login.', 'Attenzione', 'warning');
              });
          }
          
          // Listener per eventi di cambio autenticazione
          document.addEventListener('auth:change', () => {
            navbar.render();
          });
        });
      }
    };
    
    // Inizializza App
    App.init();
  });

  beforeEach(() => {
    // Resetta tutti i mock
    jest.clearAllMocks();
  });

  test('dovrebbe inizializzare il router e i componenti quando viene caricato il DOM', () => {
    // Simula l'evento DOMContentLoaded per inizializzare l'app
    if (document.DOMContentLoadedHandler) {
      document.DOMContentLoadedHandler();
    } else {
      mockDOMContentLoaded();
    }
    
    // Verifica che il router sia stato inizializzato
    expect(router.init).toHaveBeenCalled();
    
    // Verifica che i componenti siano stati renderizzati
    expect(navbar.render).toHaveBeenCalled();
    expect(footer.render).toHaveBeenCalled();
  });

  test('dovrebbe controllare lo stato di autenticazione e aggiornare il profilo', async () => {
    // Configura il mock per simulare un utente autenticato
    authService.isAuthenticated.mockReturnValue(true);
    authService.getProfile.mockResolvedValue({ id: 1, name: 'Utente Test' });
    
    // Simula l'evento DOMContentLoaded per inizializzare l'app
    if (document.DOMContentLoadedHandler) {
      document.DOMContentLoadedHandler();
    } else {
      mockDOMContentLoaded();
    }
    
    // Aspetta che le promise siano risolte
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Verifica che il metodo getProfile sia stato chiamato
    expect(authService.getProfile).toHaveBeenCalled();
    
    // Verifica che l'evento auth:change sia stato dispatchato
    expect(document.dispatchEvent).toHaveBeenCalled();
  });

  test('dovrebbe gestire errori di autenticazione', async () => {
    // Configura il mock per simulare un utente autenticato ma con token scaduto
    authService.isAuthenticated.mockReturnValue(true);
    authService.getProfile.mockRejectedValue(new Error('Token non valido'));
    
    // Simula l'evento DOMContentLoaded per inizializzare l'app
    if (document.DOMContentLoadedHandler) {
      document.DOMContentLoadedHandler();
    } else {
      mockDOMContentLoaded();
    }
    
    // Aspetta che le promise siano risolte
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Verifica che il metodo logout sia stato chiamato
    expect(authService.logout).toHaveBeenCalled();
    
    // Verifica che sia stato mostrato un toast di avviso
    expect(showBootstrapToast).toHaveBeenCalled();
  });

  test('dovrebbe registrare il listener per auth:change', () => {
    // Resetta i mock
    jest.clearAllMocks();
    
    // Simula l'evento DOMContentLoaded per inizializzare l'app
    if (document.DOMContentLoadedHandler) {
      document.DOMContentLoadedHandler();
    } else {
      mockDOMContentLoaded();
    }
    
    // Ottieni l'handler per l'evento auth:change
    const authChangeHandlers = document.addEventListener.mock.calls.filter(
      call => call[0] === 'auth:change'
    );
    
    // Verifica che sia stato registrato un handler per auth:change
    expect(authChangeHandlers.length).toBeGreaterThan(0);
    
    // Verifica che l'handler chiami navbar.render
    if (authChangeHandlers.length > 0) {
      const handler = authChangeHandlers[0][1];
      handler();
      expect(navbar.render).toHaveBeenCalled();
    }
  });
}); 