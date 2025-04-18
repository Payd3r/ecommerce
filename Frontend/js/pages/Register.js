// Importo le dipendenze
import { authService } from '../services/authService.js';
import { router } from '../router.js';
import { showBootstrapToast } from '../components/Toast.js';
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
        <div class="container py-5">
            <div class="row justify-content-center">
                <div class="col-12 col-md-8 col-lg-6">
                    <div class="card shadow-sm p-4">
                        <h2 class="text-center mb-3">Registrati</h2>
                        <p class="text-center mb-4 text-muted">Crea il tuo account su ArtigianatoShop</p>
                        <form id="register-form">
                            <div class="mb-3">
                                <label for="name" class="form-label">Nome completo</label>
                                <input type="text" id="name" name="name" required placeholder="Il tuo nome e cognome" class="form-control">
                            </div>
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" id="email" name="email" required placeholder="esempio@email.com" class="form-control">
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <input type="password" id="password" name="password" required placeholder="Crea una password" minlength="6" class="form-control">
                                <small class="form-text text-muted">La password deve contenere almeno 6 caratteri</small>
                            </div>
                            <div class="mb-3">
                                <label for="password-confirm" class="form-label">Conferma password</label>
                                <input type="password" id="password-confirm" name="passwordConfirm" required placeholder="Ripeti la password" minlength="6" class="form-control">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Tipo di account</label>
                                <div class="d-flex gap-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" id="role-client" name="role" value="client" checked>
                                        <label class="form-check-label" for="role-client">
                                            <span class="role-icon">👤</span> Cliente
                                        </label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" id="role-artisan" name="role" value="artisan">
                                        <label class="form-check-label" for="role-artisan">
                                            <span class="role-icon">🛠️</span> Artigiano
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="d-grid mb-3">
                                <button type="submit" class="btn btn-primary btn-lg">
                                    <span class="btn-text">Crea account</span>
                                </button>
                            </div>
                        </form>
                        <div class="auth-links text-center mt-3">
                            <p>Hai già un account? <a href="/login" data-route>Accedi</a></p>
                        </div>
                    </div>
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
            showBootstrapToast('Compila tutti i campi obbligatori', 'Errore', 'error');
            return;
        }
        
        if (password !== passwordConfirm) {
            showBootstrapToast('Le password non corrispondono', 'Errore', 'error');
            return;
        }
        
        if (password.length < 6) {
            showBootstrapToast('La password deve contenere almeno 6 caratteri', 'Errore', 'error');
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
            showBootstrapToast('Registrazione effettuata con successo', 'Successo', 'success');
            
            // Invia evento di cambio autenticazione
            document.dispatchEvent(new CustomEvent('auth:change'));
            
            // Reindirizza alla dashboard appropriata
            router.navigateToDashboard();
        } catch (error) {
            showBootstrapToast('Errore durante la registrazione: ' + error.message, 'Errore', 'error');
            
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