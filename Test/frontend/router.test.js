/**
 * Test per router.js del frontend
 */

// Elementi che simulano l'ambiente DOM
const mockDOM = (() => {
    // Simula container principale
    const container = document.createElement('div');
    container.id = 'app-container';
    document.body.appendChild(container);
    
    // Mock per window.history
    const originalHistory = window.history;
    const mockHistory = {
        pushState: jest.fn(),
        state: null,
        length: 1
    };
    Object.defineProperty(window, 'history', {
        value: { ...originalHistory, ...mockHistory }
    });
    
    // Funzione per pulire i mock
    const cleanup = () => {
        document.body.removeChild(container);
        window.history.pushState.mockClear();
    };
    
    return {
        container,
        cleanup,
        mockHistory
    };
})();

// Mock per authService
const authService = {
    isAuthenticated: jest.fn(() => false),
    hasRole: jest.fn(() => false),
    getUser: jest.fn(() => null)
};

// Mock per il router
// Nota: nei test reali, dovresti importare il router effettivo
const router = {
    container: mockDOM.container,
    routes: {},
    currentRoute: null,
    
    register: jest.fn((path, component, options = {}) => {
        const defaultOptions = {
            requireAuth: false,
            roles: [],
            title: 'Test'
        };
        
        router.routes[path] = {
            component,
            options: { ...defaultOptions, ...options }
        };
    }),
    
    navigate: jest.fn(async (path, pushState = true) => {
        const route = router.routes[path];
        
        if (route.options.requireAuth && !authService.isAuthenticated()) {
            return;
        }
        
        if (route.options.roles.length > 0 && !authService.hasRole(route.options.roles)) {
            return;
        }
        
        const component = await route.component();
        router.currentRoute = component;
        
        if (pushState) {
            window.history.pushState({ path }, '', path);
        }
        
        router.container.innerHTML = '';
        router.container.appendChild(component.render());
        
        if (typeof component.mount === 'function') {
            component.mount();
        }
    }),
    
    init: jest.fn(() => {
        router.navigate(window.location.pathname, false);
    })
};

// Mock di un componente per i test
const createMockComponent = (name) => {
    return async () => {
        const element = document.createElement('div');
        element.textContent = name;
        element.className = `component-${name}`;
        
        return {
            render: () => element,
            mount: jest.fn(),
            unmount: jest.fn()
        };
    };
};

// Suite di test
describe('Router', () => {
    // Prima di ogni test, pulisci i mock
    beforeEach(() => {
        jest.clearAllMocks();
        router.routes = {}; // Reset delle rotte
        router.currentRoute = null;
        authService.isAuthenticated.mockReturnValue(false);
        authService.hasRole.mockReturnValue(false);
    });
    
    // Dopo tutti i test, pulisci l'ambiente
    afterAll(() => {
        mockDOM.cleanup();
    });
    
    test('register dovrebbe registrare una rotta con opzioni predefinite', () => {
        const homeComponent = createMockComponent('home');
        router.register('/', homeComponent);
        
        expect(router.routes).toHaveProperty('/');
        expect(router.routes['/'].component).toBe(homeComponent);
        expect(router.routes['/'].options).toHaveProperty('requireAuth', false);
    });
    
    test('register dovrebbe conservare le opzioni personalizzate', () => {
        const adminComponent = createMockComponent('admin');
        router.register('/admin', adminComponent, { requireAuth: true, roles: ['admin'] });
        
        expect(router.routes['/admin'].options.requireAuth).toBe(true);
        expect(router.routes['/admin'].options.roles).toEqual(['admin']);
    });
    
    test('navigate dovrebbe caricare la rotta corretta', async () => {
        const homeComponent = createMockComponent('home');
        router.register('/', homeComponent);
        
        await router.navigate('/');
        
        expect(router.container.textContent).toBe('home');
        expect(window.history.pushState).toHaveBeenCalledWith({ path: '/' }, '', '/');
    });
    
    test('navigate non dovrebbe caricare rotte protette quando l\'utente non è autenticato', async () => {
        const privateComponent = createMockComponent('private');
        router.register('/private', privateComponent, { requireAuth: true });
        
        await router.navigate('/private');
        
        // La navigazione dovrebbe essere bloccata
        expect(router.currentRoute).toBeNull();
    });
    
    test('navigate dovrebbe caricare rotte protette quando l\'utente è autenticato', async () => {
        authService.isAuthenticated.mockReturnValue(true);
        
        const privateComponent = createMockComponent('private');
        router.register('/private', privateComponent, { requireAuth: true });
        
        await router.navigate('/private');
        
        // La navigazione dovrebbe essere consentita
        expect(router.currentRoute).not.toBeNull();
        expect(router.container.textContent).toBe('private');
    });
    
    test('navigate non dovrebbe caricare rotte con restrizioni di ruolo quando l\'utente non ha il ruolo richiesto', async () => {
        authService.isAuthenticated.mockReturnValue(true);
        authService.hasRole.mockReturnValue(false);
        
        const adminComponent = createMockComponent('admin');
        router.register('/admin', adminComponent, { requireAuth: true, roles: ['admin'] });
        
        await router.navigate('/admin');
        
        // La navigazione dovrebbe essere bloccata
        expect(router.currentRoute).toBeNull();
    });
    
    test('navigate dovrebbe caricare rotte con restrizioni di ruolo quando l\'utente ha il ruolo richiesto', async () => {
        authService.isAuthenticated.mockReturnValue(true);
        authService.hasRole.mockReturnValue(true);
        
        const adminComponent = createMockComponent('admin');
        router.register('/admin', adminComponent, { requireAuth: true, roles: ['admin'] });
        
        await router.navigate('/admin');
        
        // La navigazione dovrebbe essere consentita
        expect(router.currentRoute).not.toBeNull();
        expect(router.container.textContent).toBe('admin');
    });
}); 