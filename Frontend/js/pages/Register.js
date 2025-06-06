// Importo le dipendenze
import { authService } from '../services/authService.js';
import { router } from '../router.js';
import { showBootstrapToast } from '../components/Toast.js';
import { loader } from '../components/Loader.js';

/**
 * Carica la pagina di registrazione
 * @returns {Object} Oggetto con i metodi del componente
 */
export async function loadRegisterPage() {
    // Crea l'elemento principale della pagina
    const pageElement = document.createElement('div');
    pageElement.className = 'auth-page register-page';
    
    // Se l'utente è già autenticato, reindirizza subito
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
                        <p class="text-center mb-4 text-muted">Crea il tuo account su Pane e Salame</p>
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
                                <input type="password" id="password" name="password" required placeholder="Crea una password" minlength="4" class="form-control">
                                <small class="form-text text-muted">La password deve contenere almeno 4 caratteri</small>
                            </div>
                            <div class="mb-3">
                                <label for="password-confirm" class="form-label">Conferma password</label>
                                <input type="password" id="password-confirm" name="passwordConfirm" required placeholder="Ripeti la password" minlength="4" class="form-control">
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
     * @param {Event} event Evento submit
     */
    async function handleRegisterSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const password = form.password.value;
        const passwordConfirm = form.passwordConfirm.value;
        
        // Validazione base
        if (!name || !email || !password) {
            showBootstrapToast('Compila tutti i campi obbligatori', 'Errore', 'error');
            return;
        }
        
        if (password !== passwordConfirm) {
            showBootstrapToast('Le password non corrispondono', 'Errore', 'error');
            return;
        }
        
        if (password.length < 4) {
            showBootstrapToast('La password deve contenere almeno 4 caratteri', 'Errore', 'error');
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
            await authService.register(name, email, password, 'client');
            
            // Mostra messaggio di successo
            showBootstrapToast('Registrazione effettuata con successo', 'Successo', 'success');
            
            // Invia evento di cambio autenticazione
            document.dispatchEvent(new CustomEvent('auth:change'));
            
            // Reindirizza alla dashboard appropriata
            router.navigateToDashboard();
        } catch (error) {
            console.log('error', error.message);
            if (error.message && error.message.toLowerCase().includes('email gia registrata')) {
                showBootstrapToast('Questa email è già registrata. Prova ad accedere o usa un altro indirizzo.', 'Email già registrata', 'warning');
            } else {
                showBootstrapToast('Errore durante la registrazione: ' + error.message, 'Errore', 'error');
            }
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
     * Inizializza gli event listener della pagina registrazione
     */
    function mount() {
        const form = document.getElementById('register-form');
        if (form) {
            form.addEventListener('submit', handleRegisterSubmit);
        }
    }
    
    /**
     * Rimuove gli event listener della pagina registrazione
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