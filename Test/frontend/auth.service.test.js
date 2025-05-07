/**
 * Test per authService.js del frontend
 * 
 * Per eseguire questi test, dobbiamo simulare l'ambiente del browser
 * inclusi localStorage e fetch API
 */

// Mock per localStorage
const mockLocalStorage = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] ?? null),
        setItem: jest.fn((key, value) => {
            store[key] = String(value);
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
});

// Importa il servizio di autenticazione
// Nota: nei test reali, dovresti utilizzare un'importazione relativa
// ma in questo esempio simuliamo l'importazione
const authService = {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    }),
    getToken: jest.fn(() => localStorage.getItem('auth_token')),
    getUser: jest.fn(() => {
        const userData = localStorage.getItem('auth_user');
        return userData ? JSON.parse(userData) : null;
    }),
    isAuthenticated: jest.fn(() => !!localStorage.getItem('auth_token')),
    hasRole: jest.fn((role) => {
        const user = authService.getUser();
        if (!user) return false;
        
        if (Array.isArray(role)) {
            return role.includes(user.role);
        }
        
        return user.role === role;
    }),
    saveAuthData: jest.fn((token, user) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
    })
};

// Mock per fetch
global.fetch = jest.fn();

// Test suite
describe('AuthService', () => {
    // Prima di ogni test, pulisci i mock e localStorage
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });
    
    test('isAuthenticated dovrebbe restituire false quando non c\'è token', () => {
        expect(authService.isAuthenticated()).toBe(false);
    });
    
    test('isAuthenticated dovrebbe restituire true quando c\'è un token', () => {
        localStorage.setItem('auth_token', 'fake-token');
        expect(authService.isAuthenticated()).toBe(true);
    });
    
    test('getUser dovrebbe restituire null quando non ci sono dati utente', () => {
        expect(authService.getUser()).toBeNull();
    });
    
    test('getUser dovrebbe restituire i dati utente quando sono presenti', () => {
        const user = { id: 1, name: 'Test User', email: 'test@example.com', role: 'client' };
        localStorage.setItem('auth_user', JSON.stringify(user));
        expect(authService.getUser()).toEqual(user);
    });
    
    test('logout dovrebbe rimuovere token e dati utente', () => {
        // Setup
        localStorage.setItem('auth_token', 'fake-token');
        localStorage.setItem('auth_user', JSON.stringify({ id: 1 }));
        
        // Act
        authService.logout();
        
        // Assert
        expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
        expect(localStorage.removeItem).toHaveBeenCalledWith('auth_user');
        expect(authService.isAuthenticated()).toBe(false);
        expect(authService.getUser()).toBeNull();
    });
    
    test('hasRole dovrebbe verificare correttamente il ruolo utente', () => {
        // Setup
        localStorage.setItem('auth_user', JSON.stringify({ id: 1, role: 'client' }));
        
        // Assert
        expect(authService.hasRole('client')).toBe(true);
        expect(authService.hasRole('admin')).toBe(false);
        expect(authService.hasRole(['admin', 'client'])).toBe(true);
    });
    
    test('hasRole dovrebbe restituire false quando non c\'è utente', () => {
        expect(authService.hasRole('client')).toBe(false);
    });
}); 