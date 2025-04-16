// Importo le dipendenze
import { authService } from '../services/authService.js';
import { toast } from '../components/Toast.js';
import { loader } from '../components/Loader.js';
import { router } from '../router.js';

/**
 * Carica la pagina profilo dell'utente
 * @returns {Object} - Oggetto con i metodi del componente
 */
export async function loadProfilePage() {
    // Crea l'elemento principale della pagina
    const pageElement = document.createElement('div');
    pageElement.className = 'profile-page';
    
    // Ottiene i dati dell'utente
    const user = authService.getUser();
    
    // Costruisce il contenuto della pagina
    pageElement.innerHTML = `
        <div class="container">
            <div class="profile-header">
                <h1>Il tuo profilo</h1>
            </div>
            
            <div class="grid grid-2">
                <div class="card">
                    <h2>Informazioni personali</h2>
                    <form id="profile-form">
                        <div class="form-group">
                            <label for="name">Nome completo</label>
                            <input type="text" id="name" name="name" value="${user.name}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" value="${user.email}" required readonly>
                            <small class="form-text">L'indirizzo email non può essere modificato</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="role">Tipo di account</label>
                            <input type="text" id="role" value="${getRoleLabel(user.role)}" readonly>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                <span class="btn-text">Aggiorna profilo</span>
                            </button>
                        </div>
                    </form>
                </div>
                
                <div class="card">
                    <h2>Cambia password</h2>
                    <form id="password-form">
                        <div class="form-group">
                            <label for="current-password">Password attuale</label>
                            <input type="password" id="current-password" name="currentPassword" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="new-password">Nuova password</label>
                            <input type="password" id="new-password" name="newPassword" required minlength="6">
                            <small class="form-text">La password deve contenere almeno 6 caratteri</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="confirm-password">Conferma nuova password</label>
                            <input type="password" id="confirm-password" name="confirmPassword" required minlength="6">
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                <span class="btn-text">Cambia password</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="card mt-md">
                <h2>Azioni account</h2>
                <div class="action-buttons">
                    <button id="logout-btn" class="btn btn-secondary">Esci dall'account</button>
                    <button id="delete-account-btn" class="btn btn-danger">Elimina account</button>
                </div>
            </div>
        </div>
    `;
    
    /**
     * Converte il ruolo in un'etichetta leggibile
     * @param {string} role - Ruolo dell'utente
     * @returns {string} - Etichetta leggibile
     */
    function getRoleLabel(role) {
        const labels = {
            client: 'Cliente',
            artisan: 'Artigiano',
            admin: 'Amministratore'
        };
        
        return labels[role] || role;
    }
    
    /**
     * Gestisce l'aggiornamento del profilo
     * @param {Event} event - Evento submit
     */
    async function handleProfileUpdate(event) {
        event.preventDefault();
        
        const form = event.target;
        const name = form.name.value.trim();
        
        // Validazione base
        if (!name) {
            toast.error('Il nome è obbligatorio');
            return;
        }
        
        try {
            // Disabilita il form durante la richiesta
            const submitBtn = form.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            
            submitBtn.disabled = true;
            btnText.innerHTML = '<span class="btn-loader"></span> Aggiornamento...';
            
            // Mostra il loader
            loader.show();
            
            // In un'implementazione reale, qui aggiorneremmo il profilo
            // await updateProfile({ name });
            
            // Simulazione della chiamata API
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Aggiorna i dati utente nel localStorage
            const updatedUser = { ...user, name };
            localStorage.setItem('auth_user', JSON.stringify(updatedUser));
            
            // Mostra messaggio di successo
            toast.success('Profilo aggiornato con successo');
            
            // Invia evento di cambio autenticazione
            document.dispatchEvent(new CustomEvent('auth:change'));
        } catch (error) {
            toast.error('Errore durante l\'aggiornamento del profilo: ' + error.message);
        } finally {
            // Ripristina il form
            const submitBtn = form.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            
            submitBtn.disabled = false;
            btnText.textContent = 'Aggiorna profilo';
            
            // Nasconde il loader
            loader.hide();
        }
    }
    
    /**
     * Gestisce il cambio della password
     * @param {Event} event - Evento submit
     */
    async function handlePasswordChange(event) {
        event.preventDefault();
        
        const form = event.target;
        const currentPassword = form.currentPassword.value;
        const newPassword = form.newPassword.value;
        const confirmPassword = form.confirmPassword.value;
        
        // Validazione base
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Compila tutti i campi');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            toast.error('Le nuove password non corrispondono');
            return;
        }
        
        if (newPassword.length < 6) {
            toast.error('La nuova password deve contenere almeno 6 caratteri');
            return;
        }
        
        try {
            // Disabilita il form durante la richiesta
            const submitBtn = form.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            
            submitBtn.disabled = true;
            btnText.innerHTML = '<span class="btn-loader"></span> Aggiornamento...';
            
            // Mostra il loader
            loader.show();
            
            // In un'implementazione reale, qui cambieremmo la password
            // await changePassword({ currentPassword, newPassword });
            
            // Simulazione della chiamata API
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mostra messaggio di successo
            toast.success('Password aggiornata con successo');
            
            // Resetta il form
            form.reset();
        } catch (error) {
            toast.error('Errore durante il cambio della password: ' + error.message);
        } finally {
            // Ripristina il form
            const submitBtn = form.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            
            submitBtn.disabled = false;
            btnText.textContent = 'Cambia password';
            
            // Nasconde il loader
            loader.hide();
        }
    }
    
    /**
     * Gestisce il logout
     */
    function handleLogout() {
        // Esegue il logout
        authService.logout();
        
        // Invia evento di cambio autenticazione
        document.dispatchEvent(new CustomEvent('auth:change'));
        
        // Reindirizza alla home
        router.navigateToHome();
        
        // Mostra messaggio di successo
        toast.success('Logout effettuato con successo');
    }
    
    /**
     * Gestisce l'eliminazione dell'account
     */
    function handleDeleteAccount() {
        // Conferma l'eliminazione
        if (confirm('Sei sicuro di voler eliminare il tuo account? Questa azione non può essere annullata.')) {
            // In un'implementazione reale, qui elimineremmo l'account
            // await deleteAccount();
            
            // Esegue il logout
            authService.logout();
            
            // Invia evento di cambio autenticazione
            document.dispatchEvent(new CustomEvent('auth:change'));
            
            // Reindirizza alla home
            router.navigateToHome();
            
            // Mostra messaggio di successo
            toast.success('Account eliminato con successo');
        }
    }
    
    /**
     * Inizializza gli event listener
     */
    function mount() {
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', handleProfileUpdate);
        }
        
        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', handlePasswordChange);
        }
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        const deleteAccountBtn = document.getElementById('delete-account-btn');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', handleDeleteAccount);
        }
    }
    
    /**
     * Rimuove gli event listener
     */
    function unmount() {
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.removeEventListener('submit', handleProfileUpdate);
        }
        
        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.removeEventListener('submit', handlePasswordChange);
        }
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.removeEventListener('click', handleLogout);
        }
        
        const deleteAccountBtn = document.getElementById('delete-account-btn');
        if (deleteAccountBtn) {
            deleteAccountBtn.removeEventListener('click', handleDeleteAccount);
        }
    }
    
    return {
        render: () => pageElement,
        mount,
        unmount
    };
} 