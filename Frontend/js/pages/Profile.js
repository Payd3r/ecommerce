// Importo le dipendenze
import { ApiService } from '../../api/auth.js';
import { showBootstrapToast } from '../components/Toast.js';
import { loader } from '../components/Loader.js';
import { router } from '../router.js';
import { uploadProfileImage } from '../../api/images.js';
import { getApiUrl } from '../../api/config.js';

/**
 * Carica la pagina profilo dell'utente
 * @returns {Object} - Oggetto con i metodi del componente
 */
export async function loadProfilePage() {
    // Crea l'elemento principale della pagina
    const pageElement = document.createElement('div');
    pageElement.className = 'profile-page';
    
    // Ottiene i dati dell'utente
    const user = await ApiService.getProfile();
    let address = {};
    try {
        address = await ApiService.getAddress();
        if (!address) address = {};
    } catch (e) {
        address = {};
        console.log("errore",e);
    }
    
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
                        <div class="d-flex align-items-center mb-3">
                          <div class="me-3" id="profileImagePreviewWrapper">
                            ${user.image ? `
                              <img src="${getApiUrl()}${user.image}" id="profileImagePreview" alt="Foto profilo" class="rounded-circle border" style="width: 72px; height: 72px; object-fit: cover;" />
                            ` : `
                              <div id="profileImagePreview" class="d-flex align-items-center justify-content-center bg-light rounded-circle border" style="width: 72px; height: 72px;">
                                <i class="bi bi-person-circle fs-1 text-secondary"></i>
                              </div>
                            `}
                          </div>
                          <div>
                            <h2 class="h5 mb-0">${user.name}</h2>
                            <div class="text-muted small">${user.email}</div>
                          </div>
                        </div>
                        <form id="profile-image-form" class="mb-3">
                          <label class="form-label">Foto profilo</label>
                          <input type="file" class="form-control" id="profileImageInput" accept="image/*" />
                          <button type="submit" class="btn btn-outline-primary btn-sm mt-2">Salva foto profilo</button>
                        </form>
                        <h2 class="h5 mb-3">Informazioni personali</h2>
                        <form id="profile-form">
                            <div class="mb-3">
                                <label for="name" class="form-label">Nome</label>
                                <input type="text" id="name" name="name" class="form-control" value="${address.name || ''}" required>
                            </div>
                            <div class="mb-3">
                                <label for="surname" class="form-label">Cognome</label>
                                <input type="text" id="surname" name="surname" class="form-control" value="${address.surname || ''}" required>
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
                            <div class="mb-3">
                                <label for="stato" class="form-label">Stato</label>
                                <input type="text" id="stato" name="stato" class="form-control" value="${address.stato || ''}">
                            </div>
                            <div class="mb-3">
                                <label for="citta" class="form-label">Città</label>
                                <input type="text" id="citta" name="citta" class="form-control" value="${address.citta || ''}">
                            </div>
                            <div class="mb-3">
                                <label for="provincia" class="form-label">Provincia</label>
                                <input type="text" id="provincia" name="provincia" class="form-control" value="${address.provincia || ''}">
                            </div>
                            <div class="mb-3">
                                <label for="via" class="form-label">Via</label>
                                <input type="text" id="via" name="via" class="form-control" value="${address.via || ''}">
                            </div>
                            <div class="mb-3">
                                <label for="numero_civico" class="form-label">Numero civico</label>
                                <input type="number" id="numero_civico" name="numero_civico" class="form-control" value="${address.numero_civico || ''}">
                            </div>
                            <div class="mb-3">
                                <label for="cap" class="form-label">CAP</label>
                                <input type="text" id="cap" name="cap" class="form-control" value="${address.cap || ''}">
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
        const surname = form.surname.value.trim();
        const stato = form.stato.value.trim();
        const citta = form.citta.value.trim();
        const provincia = form.provincia.value.trim();
        const via = form.via.value.trim();
        const numero_civico = form.numero_civico.value.trim();
        const cap = form.cap.value.trim();
        if (!name || !surname) {
            showBootstrapToast('Nome e cognome sono obbligatori', 'Errore', 'error');
            return;
        }
        try {
            const submitBtn = form.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            submitBtn.disabled = true;
            btnText.innerHTML = '<span class="btn-loader"></span> Aggiornamento...';
            loader.show();
            // Aggiorna profilo utente solo se il nome è cambiato
            if (name !== user.name || surname !== user.surname) {
                await ApiService.updateProfile({ name, surname });
                const updatedUser = { ...user, name, surname };
                localStorage.setItem('auth_user', JSON.stringify(updatedUser));
            }
            // Aggiorna/crea indirizzo sempre
            await ApiService.saveAddress({
                stato: stato || "",
                citta: citta || "",
                provincia: provincia || "",
                via: via || "",
                cap: cap || "",
                numero_civico: numero_civico === "" ? 0 : Number(numero_civico),
                name,
                surname
            });
            showBootstrapToast('Profilo aggiornato con successo', 'Successo', 'success');
            document.dispatchEvent(new CustomEvent('auth:change'));
        } catch (error) {
            showBootstrapToast('Errore durante l\'aggiornamento del profilo: ' + error.message, 'Errore', 'error');
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            submitBtn.disabled = false;
            btnText.textContent = 'Aggiorna profilo';
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
        
        // Gestione upload foto profilo
        const profileImageForm = document.getElementById('profile-image-form');
        const profileImageInput = document.getElementById('profileImageInput');
        const profileImagePreviewWrapper = document.getElementById('profileImagePreviewWrapper');
        profileImageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const file = profileImageInput.files[0];
            if (!file) {
                showBootstrapToast('Seleziona un file immagine', 'Errore', 'danger');
                return;
            }
            try {
                const res = await uploadProfileImage(user.id, file);
                console.log("res",res);
                // Aggiorna la preview
                const imgUrl = res.files && res.files[0] ? `${getApiUrl()}${res.files[0].url}` : null;
                if (imgUrl) {
                    profileImagePreviewWrapper.innerHTML = `<img src="${imgUrl}" id="profileImagePreview" alt="Foto profilo" class="rounded-circle border" style="width: 72px; height: 72px; object-fit: cover;" />`;
                }
                showBootstrapToast('Foto profilo aggiornata con successo', 'Successo', 'success');
            } catch (err) {
                showBootstrapToast('Errore durante il salvataggio della foto profilo', 'Errore', 'danger');
            }
        });
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