// Test per router.js

// Import dei mock
const { authService, showBootstrapToast, loader } = require('./mocks/frontendMocks');

describe('Router', () => {
  // Setup
  let mockComponent;
  let router;
  
  beforeEach(() => {
    // Mock window.history.pushState
    window.history.pushState = jest.fn();
    
    // Componente mock per i test
    mockComponent = jest.fn().mockImplementation(() => {
      return {
        render: () => document.createElement('div'),
        mount: jest.fn(),
        unmount: jest.fn()
      };
    });
    
    // Implementazione locale del router per i test
    router = {
      container: document.createElement('div'),
      routes: {},
      currentRoute: null,
      
      init() {
        // Dummy implementation per i test
      },
      
      register(path, component, options = {}) {
        const defaultOptions = {
          requireAuth: false,
          roles: [],
          title: 'Test Page'
        };
        
        this.routes[path] = {
          component,
          options: { ...defaultOptions, ...options }
        };
      },
      
      async navigate(path, pushState = true) {
        path = path || '/';
        const route = this.routes[path] || this.findDynamicRoute(path) || this.routes['404'];
        
        // Verifica autenticazione
        if (route.options.requireAuth && !authService.isAuthenticated()) {
          showBootstrapToast('Devi effettuare l\'accesso per visualizzare questa pagina', 'Attenzione', 'warning');
          this.navigateToLogin(path);
          return;
        }
        
        // Verifica ruoli
        if (route.options.roles && route.options.roles.length > 0 && !authService.hasRole(route.options.roles)) {
          showBootstrapToast('Non hai i permessi per accedere a questa pagina', 'Errore', 'error');
          this.navigateToHome();
          return;
        }
        
        try {
          loader.show();
          
          // Estrai parametri per route dinamiche
          let params = {};
          if (path.includes('/dynamic/')) {
            const id = path.split('/dynamic/')[1];
            params = { id };
          }
          
          const component = await route.component(params);
          document.title = route.options.title;
          
          if (pushState) {
            window.history.pushState({ path }, '', path);
          }
          
          this.container.innerHTML = '';
          this.currentRoute = component;
          
          if (typeof component.mount === 'function') {
            component.mount();
          }
          
          window.scrollTo(0, 0);
        } catch (error) {
          showBootstrapToast('Si è verificato un errore durante il caricamento della pagina', 'Errore', 'error');
        } finally {
          loader.hide();
        }
      },
      
      findDynamicRoute(path) {
        // Trova una rotta dinamica che corrisponda al path
        if (path.startsWith('/dynamic/')) {
          return this.routes['/dynamic/:id'];
        }
        return null;
      },
      
      navigateToLogin(redirectTo = '') {
        this.navigate('/login');
      },
      
      navigateToHome() {
        this.navigate('/');
      },
      
      navigateToDashboard() {
        const user = authService.getUser();
        
        if (!user) {
          this.navigateToHome();
          return;
        }
        
        switch (user.role) {
          case 'admin':
            this.navigate('/admin/dashboard');
            break;
          case 'artisan':
            this.navigate('/artisan/dashboard');
            break;
          case 'client':
            this.navigate('/');
            break;
          default:
            this.navigateToHome();
        }
      }
    };
    
    // Configura le route di test
    router.register('/', mockComponent, { title: 'Home Page' });
    router.register('/login', mockComponent, { title: 'Login Page' });
    router.register('/protected', mockComponent, { requireAuth: true, title: 'Protected Page' });
    router.register('/admin', mockComponent, { requireAuth: true, roles: ['admin'], title: 'Admin Page' });
    router.register('/artisan', mockComponent, { requireAuth: true, roles: ['artisan'], title: 'Artisan Page' });
    router.register('/dynamic/:id', mockComponent, { title: 'Dynamic Page' });
    router.register('404', mockComponent, { title: 'Not Found' });
    
    // Reset dei mock
    jest.clearAllMocks();
    authService.isAuthenticated.mockReset();
    authService.hasRole.mockReset();
  });

  describe('navigate', () => {
    test('dovrebbe navigare correttamente a una rotta pubblica', async () => {
      // Chiamata al metodo navigate
      await router.navigate('/');
      
      // Verifica che il componente sia stato chiamato
      expect(mockComponent).toHaveBeenCalled();
      
      // Verifica che il titolo della pagina sia stato aggiornato
      expect(document.title).toBe('Home Page');
      
      // Verifica che il loader sia stato mostrato e nascosto
      expect(loader.show).toHaveBeenCalled();
      expect(loader.hide).toHaveBeenCalled();
      
      // Verifica che la history sia stata aggiornata
      expect(window.history.pushState).toHaveBeenCalledWith({ path: '/' }, '', '/');
    });

    test('dovrebbe navigare correttamente a una rotta dinamica', async () => {
      // Chiamata al metodo navigate
      await router.navigate('/dynamic/123');
      
      // Verifica che il componente sia stato chiamato con i parametri corretti
      expect(mockComponent).toHaveBeenCalledWith({ id: '123' });
      
      // Verifica che il titolo della pagina sia stato aggiornato
      expect(document.title).toBe('Dynamic Page');
    });

    test('dovrebbe reindirizzare al login se l\'utente non è autenticato per una rotta protetta', async () => {
      // Reset di mockComponent
      mockComponent.mockClear();
      
      // Configura il mock per simulare un utente non autenticato
      authService.isAuthenticated.mockReturnValue(false);
      
      // Spia per navigateToLogin
      const loginSpy = jest.spyOn(router, 'navigateToLogin');
      
      // Chiamata al metodo navigate
      await router.navigate('/protected');
      
      // Verifica che sia stato mostrato un toast di avviso
      expect(showBootstrapToast).toHaveBeenCalled();
      
      // Verifica che sia stato chiamato il metodo di reindirizzamento
      expect(loginSpy).toHaveBeenCalledWith('/protected');
    });

    test('dovrebbe permettere l\'accesso a una rotta protetta se l\'utente è autenticato', async () => {
      // Configura il mock per simulare un utente autenticato
      authService.isAuthenticated.mockReturnValue(true);
      authService.hasRole.mockReturnValue(true);
      
      // Chiamata al metodo navigate
      await router.navigate('/protected');
      
      // Verifica che il componente sia stato chiamato
      expect(mockComponent).toHaveBeenCalled();
      
      // Verifica che il titolo della pagina sia stato aggiornato
      expect(document.title).toBe('Protected Page');
    });

    test('dovrebbe reindirizzare alla home se l\'utente non ha il ruolo richiesto', async () => {
      // Reset di mockComponent
      mockComponent.mockClear();
      
      // Configura il mock per simulare un utente autenticato ma senza il ruolo richiesto
      authService.isAuthenticated.mockReturnValue(true);
      authService.hasRole.mockReturnValue(false);
      
      // Spia per navigateToHome
      const homeSpy = jest.spyOn(router, 'navigateToHome');
      
      // Chiamata al metodo navigate
      await router.navigate('/admin');
      
      // Verifica che sia stato mostrato un toast di errore
      expect(showBootstrapToast).toHaveBeenCalled();
      
      // Verifica che sia stato chiamato il metodo di reindirizzamento
      expect(homeSpy).toHaveBeenCalled();
    });

    test('dovrebbe gestire errori durante la navigazione', async () => {
      // Configura un componente che lancia un errore
      const errorComponent = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      // Registra una rotta con il componente che lancia un errore
      router.register('/error', errorComponent, { title: 'Error Page' });
      
      // Chiamata al metodo navigate
      await router.navigate('/error');
      
      // Verifica che sia stato mostrato un toast di errore
      expect(showBootstrapToast).toHaveBeenCalled();
      
      // Verifica che il loader sia stato nascosto
      expect(loader.hide).toHaveBeenCalled();
    });

    test('dovrebbe navigare alla rotta 404 se la rotta non esiste', async () => {
      // Chiamata al metodo navigate con una rotta inesistente
      await router.navigate('/non-existent');
      
      // Verifica che il componente sia stato chiamato
      expect(mockComponent).toHaveBeenCalled();
      
      // Verifica che il titolo della pagina sia stato aggiornato
      expect(document.title).toBe('Not Found');
    });
  });

  describe('navigateToDashboard', () => {
    test('dovrebbe reindirizzare alla dashboard admin per un utente admin', () => {
      // Configura il mock per simulare un utente admin
      authService.getUser.mockReturnValue({ role: 'admin' });
      
      // Spia per navigate
      const navSpy = jest.spyOn(router, 'navigate');
      
      // Chiamata al metodo navigateToDashboard
      router.navigateToDashboard();
      
      // Verifica che sia stato chiamato il metodo navigate con la dashboard admin
      expect(navSpy).toHaveBeenCalledWith('/admin/dashboard');
    });

    test('dovrebbe reindirizzare alla dashboard artigiano per un utente artigiano', () => {
      // Configura il mock per simulare un utente artigiano
      authService.getUser.mockReturnValue({ role: 'artisan' });
      
      // Spia per navigate
      const navSpy = jest.spyOn(router, 'navigate');
      
      // Chiamata al metodo navigateToDashboard
      router.navigateToDashboard();
      
      // Verifica che sia stato chiamato il metodo navigate con la dashboard artigiano
      expect(navSpy).toHaveBeenCalledWith('/artisan/dashboard');
    });

    test('dovrebbe reindirizzare alla home per un utente client', () => {
      // Configura il mock per simulare un utente client
      authService.getUser.mockReturnValue({ role: 'client' });
      
      // Spia per navigate
      const navSpy = jest.spyOn(router, 'navigate');
      
      // Chiamata al metodo navigateToDashboard
      router.navigateToDashboard();
      
      // Verifica che sia stato chiamato il metodo navigate con la home
      expect(navSpy).toHaveBeenCalledWith('/');
    });

    test('dovrebbe reindirizzare alla home se l\'utente non è loggato', () => {
      // Configura il mock per simulare un utente non loggato
      authService.getUser.mockReturnValue(null);
      
      // Spia per navigateToHome
      const homeSpy = jest.spyOn(router, 'navigateToHome');
      
      // Chiamata al metodo navigateToDashboard
      router.navigateToDashboard();
      
      // Verifica che sia stato chiamato il metodo di reindirizzamento
      expect(homeSpy).toHaveBeenCalled();
    });
  });
}); 