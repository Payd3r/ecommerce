// Importo le dipendenze
import { authService } from '../services/authService.js';
import { router } from '../router.js';
import { toast } from '../components/Toast.js';
import { loader } from '../components/Loader.js';

/**
 * Carica la pagina di registrazione
 * @returns {Object} - Oggetto con i metodi del componente
 */
export async function loadRegisterPage() {
    // Crea l'elemento principale della pagina
    const pageElement = document.createElement('div');
    pageElement.className = 'auth-page register-page';
    
    // Se l'utente è già autenticato, reindirizza
    if (authService.isAuthenticated()) {
        setTimeout(() => router.navigateToDashboard(), 0);
        
        // Mostra un messaggio di reindirizzamento
        pageElement.innerHTML = `
            <div class="container">
                <div class="card auth-card text-center">
                    <h2>Sei già registrato</h2>
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
        <div class="container">
            <div class="card auth-card">
                <h2 class="text-center">Registrati</h2>
                <p class="text-center mb-md">Crea il tuo account su ArtigianatoShop</p>
                
                <form id="register-form">
                    <div class="form-group">
                        <label for="name">Nome completo</label>
                        <input type="text" id="name" name="name" required placeholder="Il tuo nome e cognome">
                    </div>
                    
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required placeholder="esempio@email.com">
                    </div>
                    
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required 
                            placeholder="Crea una password" minlength="6">
                        <small class="form-text">La password deve contenere almeno 6 caratteri</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="password-confirm">Conferma password</label>
                        <input type="password" id="password-confirm" name="passwordConfirm" required 
                            placeholder="Ripeti la password" minlength="6">
                    </div>
                    
                    <div class="form-group">
                        <label>Tipo di account</label>
                        <div class="role-selector">
                            <div class="role-option">
                                <input type="radio" id="role-client" name="role" value="client" checked>
                                <label for="role-client">
                                    <span class="role-icon">👤</span>
                                    <span class="role-title">Cliente</span>
                                    <span class="role-desc">Voglio acquistare prodotti artigianali</span>
                                </label>
                            </div>
                            
                            <div class="role-option">
                                <input type="radio" id="role-artisan" name="role" value="artisan">
                                <label for="role-artisan">
                                    <span class="role-icon">🛠️</span>
                                    <span class="role-title">Artigiano</span>
                                    <span class="role-desc">Voglio vendere i miei prodotti</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group mt-md">
                        <button type="submit" class="btn btn-primary btn-block">
                            <span class="btn-text">Crea account</span>
                        </button>
                    </div>
                </form>
                
                <div class="auth-links text-center mt-md">
                    <p>Hai già un account? <a href="/login" data-route>Accedi</a></p>
                </div>
            </div>
        </div>
    `;
    
    /**
     * Gestisce il submit del form di registrazione
     * @param {Event} event - Evento submit
     */
    async function handleRegisterSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const password = form.password.value;
        const passwordConfirm = form.passwordConfirm.value;
        const role = form.querySelector('input[name="role"]:checked').value;
        
        // Validazione base
        if (!name || !email || !password) {
            toast.error('Compila tutti i campi obbligatori');
            return;
        }
        
        if (password !== passwordConfirm) {
            toast.error('Le password non corrispondono');
            return;
        }
        
        if (password.length < 6) {
            toast.error('La password deve contenere almeno 6 caratteri');
            return;
        }
        
        try {
            // Disabilita il form durante la richiesta
            const submitBtn = form.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            
            submitBtn.disabled = true;
            btnText.innerHTML = '<span class="btn-loader"></span> Registrazione in corso...';
            
            // Mostra il loader globale
            loader.show();
            
            // Effettua la registrazione
            await authService.register(name, email, password, role);
            
            // Mostra messaggio di successo
            toast.success('Registrazione effettuata con successo');
            
            // Invia evento di cambio autenticazione
            document.dispatchEvent(new CustomEvent('auth:change'));
            
            // Reindirizza alla dashboard appropriata
            router.navigateToDashboard();
        } catch (error) {
            toast.error('Errore durante la registrazione: ' + error.message);
            
            // Ripristina il form
            const submitBtn = form.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            
            submitBtn.disabled = false;
            btnText.textContent = 'Crea account';
        } finally {
            // Nasconde il loader
            loader.hide();
        }
    }
    
    /**
     * Inizializza gli event listener
     */
    function mount() {
        const form = document.getElementById('register-form');
        if (form) {
            form.addEventListener('submit', handleRegisterSubmit);
        }
    }
    
    /**
     * Rimuove gli event listener
     */
    function unmount() {
        const form = document.getElementById('register-form');
        if (form) {
            form.removeEventListener('submit', handleRegisterSubmit);
        }
    }
    
    return {
        render: () => pageElement,
        mount,
        unmount
    };
} 