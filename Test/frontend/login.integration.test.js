/**
 * Test di integrazione per il processo di login
 */
const { simulateInput, simulateSubmit, waitForCondition } = require('./dom.helper');

// Mock per localStorage
const mockLocalStorage = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] ?? null,
        setItem: (key, value) => {
            store[key] = String(value);
        },
        removeItem: (key) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
});

// Mock per fetch API
global.fetch = jest.fn();

// Funzione per creare un ambiente di test
function setupLoginTest() {
    // Crea il container dell'app
    const container = document.createElement('div');
    container.id = 'app-container';
    document.body.appendChild(container);
    
    // Aggiungi il form di login
    container.innerHTML = `
    <div class="login-form-container">
        <form id="login-form" class="needs-validation">
            <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input type="email" class="form-control" id="email" name="email" required>
                <div class="invalid-feedback">Inserisci un'email valida</div>
            </div>
            <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input type="password" class="form-control" id="password" name="password" required>
                <div class="invalid-feedback">Inserisci la password</div>
            </div>
            <button type="submit" class="btn btn-primary w-100 mb-3">Accedi</button>
        </form>
        <div id="login-error" class="alert alert-danger d-none">Email o password non valide</div>
    </div>
    `;
    
    // Form di login
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    // Aggiungi event listener per il submit del form
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            // Simula la chiamata API
            const response = await fetch('http://localhost:3015/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Salva i dati di autenticazione
                localStorage.setItem('auth_token', data.data.token);
                localStorage.setItem('auth_user', JSON.stringify(data.data.user));
                
                // Reindirizza alla dashboard
                container.innerHTML = '<div id="dashboard">Dashboard</div>';
            } else {
                // Mostra errore
                loginError.textContent = data.message;
                loginError.classList.remove('d-none');
            }
        } catch (error) {
            // Mostra errore
            loginError.textContent = 'Si è verificato un errore durante il login';
            loginError.classList.remove('d-none');
        }
    });
    
    return {
        container,
        loginForm,
        loginError,
        cleanup: () => {
            document.body.removeChild(container);
        }
    };
}

// Suite di test di integrazione
describe('Processo di login', () => {
    let testEnv;
    
    beforeEach(() => {
        // Setup ambiente di test
        testEnv = setupLoginTest();
        localStorage.clear();
        fetch.mockClear();
    });
    
    afterEach(() => {
        // Cleanup
        testEnv.cleanup();
    });
    
    test('Login con credenziali valide dovrebbe mostrare la dashboard', async () => {
        // Mock risposta API per login con successo
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({
                success: true,
                data: {
                    token: 'fake-token-123',
                    user: {
                        id: 1,
                        name: 'Test User',
                        email: 'test@example.com',
                        role: 'client'
                    }
                }
            })
        });
        
        // Inserisci credenziali
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        simulateInput(emailInput, 'test@example.com');
        simulateInput(passwordInput, 'password123');
        
        // Invia form
        simulateSubmit(testEnv.loginForm);
        
        // Aspetta che la dashboard appaia
        await waitForCondition(() => document.getElementById('dashboard') !== null);
        
        // Verifica
        expect(document.getElementById('dashboard')).not.toBeNull();
        expect(localStorage.getItem('auth_token')).toBe('fake-token-123');
        expect(JSON.parse(localStorage.getItem('auth_user'))).toEqual({
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            role: 'client'
        });
    });
    
    test('Login con credenziali non valide dovrebbe mostrare un errore', async () => {
        // Mock risposta API per login fallito
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({
                success: false,
                message: 'Email o password non valide'
            })
        });
        
        // Inserisci credenziali
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        simulateInput(emailInput, 'wrong@example.com');
        simulateInput(passwordInput, 'wrongpassword');
        
        // Invia form
        simulateSubmit(testEnv.loginForm);
        
        // Aspetta che l'errore appaia
        await waitForCondition(() => !testEnv.loginError.classList.contains('d-none'));
        
        // Verifica
        expect(testEnv.loginError.classList.contains('d-none')).toBe(false);
        expect(testEnv.loginError.textContent).toBe('Email o password non valide');
        expect(localStorage.getItem('auth_token')).toBeNull();
    });
}); 