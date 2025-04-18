// Importo le dipendenze
import { authService } from '../services/authService.js';
import { showBootstrapToast } from '../components/Toast.js';
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
        <div class="container py-5">
            <div class="row mb-4">
                <div class="col-12">
                    <h1 class="mb-3">Il tuo profilo</h1>
                </div>
            </div>
            <div class="row g-4">
                <div class="col-12 col-md-6">
                    <div class="card shadow-sm border-0 p-4 h-100">
                        <h2 class="h5 mb-3">Informazioni personali</h2>
                        <form id="profile-form">
                            <div class="mb-3">
                                <label for="name" class="form-label">Nome completo</label>
                                <input type="text" id="name" name="name" class="form-control" value="${user.name}" required>
                            </div>
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" id="email" name="email" class="form-control" value="${user.email}" required readonly>
                                <div class="form-text">L'indirizzo email non può essere modificato</div>
                            </div>
                            <div class="mb-3">
                                <label for="role" class="form-label">Tipo di account</label>
                                <input type="text" id="role" class="form-control" value="${getRoleLabel(user.role)}" readonly>
                            </div>
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary">
                                    <span class="btn-text">Aggiorna profilo</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                <div class="col-12 col-md-6">
                    <div class="card shadow-sm border-0 p-4 h-100">
                        <h2 class="h5 mb-3">Cambia password</h2>
                        <form id="password-form">
                            <div class="mb-3">
                                <label for="current-password" class="form-label">Password attuale</label>
                                <input type="password" id="current-password" name="currentPassword" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label for="new-password" class="form-label">Nuova password</label>
                                <input type="password" id="new-password" name="newPassword" class="form-control" required minlength="6">
                                <div class="form-text">La password deve contenere almeno 6 caratteri</div>
                            </div>
                            <div class="mb-3">
                                <label for="confirm-password" class="form-label">Conferma nuova password</label>
                                <input type="password" id="confirm-password" name="confirmPassword" class="form-control" required minlength="6">
                            </div>
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary">
                                    <span class="btn-text">Cambia password</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-12">
                    <div class="card shadow-sm border-0 p-4">
                        <h2 class="h5 mb-3">Azioni account</h2>
                        <div class="d-flex flex-wrap gap-2">
                            <button id="logout-btn" class="btn btn-outline-secondary">Esci dall'account</button>
                            <button id="delete-account-btn" class="btn btn-outline-danger">Elimina account</button>
                        </div>
                    </div>
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
            showBootstrapToast('Il nome è obbligatorio', 'Errore', 'error');
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
            showBootstrapToast('Profilo aggiornato con successo', 'Successo', 'success');
            
            // Invia evento di cambio autenticazione
            document.dispatchEvent(new CustomEvent('auth:change'));
        } catch (error) {
            showBootstrapToast('Errore durante l\'aggiornamento del profilo: ' + error.message, 'Errore', 'error');
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
            showBootstrapToast('Compila tutti i campi', 'Errore', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showBootstrapToast('Le nuove password non corrispondono', 'Errore', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            showBootstrapToast('La nuova password deve contenere almeno 6 caratteri', 'Errore', 'error');
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
            showBootstrapToast('Password aggiornata con successo', 'Successo', 'success');
            
            // Resetta il form
            form.reset();
        } catch (error) {
            showBootstrapToast('Errore durante il cambio della password: ' + error.message, 'Errore', 'error');
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
        console.log("entro");
        // Esegue il logout
        authService.logout();
        // Invia evento di cambio autenticazione
        document.dispatchEvent(new CustomEvent('auth:change'));
        // Reindirizza alla login
        console.log("logout");
        router.navigate('/');
        // Mostra messaggio di successo
        showBootstrapToast('Logout effettuato con successo', 'Successo', 'success');
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
            showBootstrapToast('Account eliminato con successo', 'Successo', 'success');
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