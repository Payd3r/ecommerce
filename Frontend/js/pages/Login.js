// Importo le dipendenze
import { authService } from '../services/authService.js';
import { router } from '../router.js';
import { toast } from '../components/Toast.js';
import { loader } from '../components/Loader.js';

/**
 * Carica la pagina di login
 * @returns {Object} - Oggetto con i metodi del componente
 */
export async function loadLoginPage() {
    // Estrae il parametro di redirect dall'URL se presente
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect') || '/';
    
    // Crea l'elemento principale della pagina
    const pageElement = document.createElement('div');
    pageElement.className = 'auth-page login-page';
    
    // Se l'utente è già autenticato, reindirizza
    if (authService.isAuthenticated()) {
        setTimeout(() => router.navigateToDashboard(), 0);
        
        // Mostra un messaggio di reindirizzamento
        pageElement.innerHTML = `
            <div class="container">
                <div class="card auth-card text-center">
                    <h2>Sei già connesso</h2>
                    <p>Stai per essere reindirizzato alla tua dashboard...</p>
                </div>
            </div>
        `;
        
        return {
            render: () => pageElement
        };
    }
    
    // Costruisce il contenuto della pagina
    pageElement.innerHTML = `
        <div class="container py-5">
            <div class="row justify-content-center">
                <div class="col-12 col-md-6 col-lg-5">
                    <div class="card shadow-sm p-4">
                        <h2 class="text-center mb-3">Accedi</h2>
                        <p class="text-center mb-4 text-muted">Inserisci le tue credenziali per accedere</p>
                        <form id="login-form">
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" id="email" name="email" required placeholder="esempio@email.com" class="form-control">
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <input type="password" id="password" name="password" required placeholder="La tua password" class="form-control">
                            </div>
                            <div class="d-grid mb-3">
                                <button type="submit" class="btn btn-primary btn-lg">
                                    <span class="btn-text">Accedi</span>
                                </button>
                            </div>
                        </form>
                        <div class="auth-links text-center mt-3">
                            <p>Non hai un account? <a href="/register" data-route>Registrati</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    /**
     * Gestisce il submit del form di login
     * @param {Event} event - Evento submit
     */
    async function handleLoginSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const email = form.email.value.trim();
        const password = form.password.value;
        
        // Validazione base
        if (!email || !password) {
            toast.error('Inserisci email e password');
            return;
        }
        
        try {
            // Disabilita il form durante la richiesta
            const submitBtn = form.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            const originalText = btnText.textContent;
            
            submitBtn.disabled = true;
            btnText.innerHTML = '<span class="btn-loader"></span> Accesso in corso...';
            
            // Mostra il loader globale
            loader.show();
            
            // Effettua il login
            await authService.login(email, password);
            
            // Mostra messaggio di successo
            toast.success('Login effettuato con successo');
            
            // Invia evento di cambio autenticazione
            document.dispatchEvent(new CustomEvent('auth:change'));
            
            // Reindirizza l'utente
            router.navigate(redirectUrl !== '/login' ? redirectUrl : '/');
        } catch (error) {
            toast.error('Errore durante il login: ' + error.message);
            
            // Ripristina il form
            const submitBtn = form.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            
            submitBtn.disabled = false;
            btnText.textContent = 'Accedi';
        } finally {
            // Nasconde il loader
            loader.hide();
        }
    }
    
    /**
     * Inizializza gli event listener
     */
    function mount() {
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', handleLoginSubmit);
        }
    }
    
    /**
     * Rimuove gli event listener
     */
    function unmount() {
        const form = document.getElementById('login-form');
        if (form) {
            form.removeEventListener('submit', handleLoginSubmit);
        }
    }
    
    return {
        render: () => pageElement,
        mount,
        unmount
    };
} 