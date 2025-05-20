// Importo le dipendenze
import { ApiService } from '../../api/auth.js';
import { showBootstrapToast } from '../components/Toast.js';
import { loader } from '../components/Loader.js';
import { router } from '../router.js';
import { uploadProfileImage } from '../../api/images.js';
import { getApiUrl } from '../../api/config.js';
import { authService } from '../services/authService.js';
import { countries } from '../assets.geo.js';

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
        console.log("errore", e);
    }

    // Costruisce il contenuto della pagina
    pageElement.innerHTML = `
        <div class="container py-5">
            <div class="row">
                <div class="col-12">
                    <h1 class="page-title mb-3">Il tuo profilo</h1>
                    <p class="page-subtitle">Visualizza e aggiorna le informazioni del tuo account.</p>
                </div>
            </div>
            <div class="row g-4">
                <div class="col-12 col-md-6">
                    <div class="card shadow-sm border-0 p-4 h-100">
                        <h2 class="h5 mb-3">Info Pubbliche</h2>
                        <div class="d-flex align-items-center mb-3 flex-column flex-md-row text-center text-md-start">
                          <div class="me-md-3 mb-3 mb-md-0" id="profileImagePreviewWrapper">
                            ${user.image ? `
                              <img src="http://localhost:3005${user.image}" id="profileImagePreview" alt="Foto profilo" class="rounded-circle border" style="width: 72px; height: 72px; object-fit: cover;" />
                            ` : `
                              <div id="profileImagePreview" class="d-flex align-items-center justify-content-center bg-light rounded-circle border" style="width: 72px; height: 72px;">
                                <i class="bi bi-person-circle fs-1 text-secondary"></i>
                              </div>
                            `}
                          </div>
                          <div>
                            <h2 class="h5 mb-1">${user.name}</h2>
                            <div class="text-muted small mb-1">${user.email}</div>
                            <span class="badge bg-secondary">${getRoleLabel(user.role)}</span>
                          </div>
                        </div>
                        <form id="profile-image-form" class="mb-0">
                          <label class="form-label">Foto profilo</label>
                          <input type="file" class="form-control" id="profileImageInput" accept="image/*" />
                          <div class="mb-3 mt-3">
                            <label for="nickname" class="form-label">Nickname</label>
                            <input type="text" id="nickname" name="nickname" class="form-control" value="${user.nickname || ''}" maxlength="32" />
                          </div>
                          <button type="submit" class="btn btn-primary w-100 mt-2">Salva profilo</button>
                        </form>
                    </div>
                </div>
                <div class="col-12 col-md-6">
                    <div class="card shadow-sm border-0 p-4 h-100 mb-4 mb-lg-0">
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
            <div class="row g-4 mt-1">
                <div class="col-12">
                    <div class="card shadow-sm border-0 p-4 h-100">
                        <h2 class="h5 mb-3">Informazioni personali</h2>
                        <form id="profile-form">
                            <div class="row">
                                <div class="col-12 col-md-6">
                                    <div class="mb-3">
                                        <label for="name" class="form-label">Nome</label>
                                        <input type="text" id="name" name="name" class="form-control" value="${address.name || ''}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="surname" class="form-label">Cognome</label>
                                        <input type="text" id="surname" name="surname" class="form-control" value="${address.surname || ''}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="stato" class="form-label">Stato</label>
                                        <select id="stato" name="stato" class="form-select" required></select>
                                    </div>
                                    <div class="mb-3">
                                        <label for="provincia" class="form-label">Provincia</label>
                                        <select id="provincia" name="provincia" class="form-select" required></select>
                                    </div>
                                    
                                </div>
                                <div class="col-12 col-md-6">
                                    <div class="mb-3">
                                        <label for="citta" class="form-label">Città</label>
                                        <select id="citta" name="citta" class="form-select" required></select>
                                    </div>
                                    <div class="mb-3">
                                        <label for="via" class="form-label">Via</label>
                                        <input type="text" id="via" name="via" class="form-control" value="${address.via || ''}">
                                    </div>
                                    <div class="mb-3">
                                        <label for="numero_civico" class="form-label">Numero civico</label>
                                        <input type="number" id="numero_civico" name="numero_civico" class="form-control" min="1" value="${address.numero_civico || ''}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="cap" class="form-label">CAP</label>
                                        <input type="text" id="cap" name="cap" class="form-control" pattern="\\d{5}" maxlength="5" value="${address.cap || ''}" required>
                                        <div class="form-text">Il CAP deve essere di 5 cifre</div>
                                    </div>
                                </div>
                            </div>
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary">
                                    <span class="btn-text">Aggiorna profilo</span>
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
    function handleLogout(event) {
        if (event) event.preventDefault();
        authService.logout();
        document.dispatchEvent(new CustomEvent('auth:change'));
        router.navigateToHome();
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
                console.log("res", res);
                // Aggiorna la preview
                const imgUrl = res.files && res.files[0] ? `http://localhost:3005${res.files[0].url}` : null;
                if (imgUrl) {
                    profileImagePreviewWrapper.innerHTML = `<img src="${imgUrl}" id="profileImagePreview" alt="Foto profilo" class="rounded-circle border" style="width: 72px; height: 72px; object-fit: cover;" />`;
                }
                showBootstrapToast('Foto profilo aggiornata con successo', 'Successo', 'success');
            } catch (err) {
                showBootstrapToast('Errore durante il salvataggio della foto profilo', 'Errore', 'danger');
            }
        });

        // --- POPOLAMENTO SELECT GEOGRAFICHE ---
        const statoSelect = document.getElementById('stato');
        const provinciaSelect = document.getElementById('provincia');
        const cittaSelect = document.getElementById('citta');
        // Popola stati
        countries.forEach(country => {
            const opt = document.createElement('option');
            opt.value = country.name;
            opt.textContent = country.name;
            statoSelect.appendChild(opt);
        });
        // Seleziona stato salvato
        if (address.stato) statoSelect.value = address.stato;
        // Popola province in base allo stato
        function updateProvinceSelect() {
            provinciaSelect.innerHTML = '<option value="">Seleziona provincia</option>';
            cittaSelect.innerHTML = '<option value="">Seleziona città</option>';
            const selectedCountry = countries.find(c => c.name === statoSelect.value);
            if (selectedCountry) {
                selectedCountry.provinces.forEach(prov => {
                    const opt = document.createElement('option');
                    opt.value = prov.name;
                    opt.textContent = prov.name;
                    provinciaSelect.appendChild(opt);
                });
            }
            if (address.provincia && selectedCountry && selectedCountry.provinces.some(p => p.name === address.provincia)) {
                provinciaSelect.value = address.provincia;
                updateCitySelect();
            }
        }
        // Popola città in base alla provincia
        function updateCitySelect() {
            cittaSelect.innerHTML = '<option value="">Seleziona città</option>';
            const selectedCountry = countries.find(c => c.name === statoSelect.value);
            const selectedProvince = selectedCountry ? selectedCountry.provinces.find(p => p.name === provinciaSelect.value) : null;
            if (selectedProvince) {
                selectedProvince.cities.forEach(city => {
                    const opt = document.createElement('option');
                    opt.value = city;
                    opt.textContent = city;
                    cittaSelect.appendChild(opt);
                });
            }
            if (address.citta && selectedProvince && selectedProvince.cities.includes(address.citta)) {
                cittaSelect.value = address.citta;
            }
        }
        statoSelect.addEventListener('change', updateProvinceSelect);
        provinciaSelect.addEventListener('change', updateCitySelect);
        // Inizializza province e città se già presenti
        updateProvinceSelect();
        // --- FINE POPOLAMENTO SELECT ---

        // Validazione custom su submit
        if (profileForm) {
            profileForm.addEventListener('submit', function (e) {
                const cap = document.getElementById('cap').value;
                const numeroCivico = document.getElementById('numero_civico').value;
                if (!/^\d{5}$/.test(cap)) {
                    e.preventDefault();
                    showBootstrapToast('Il CAP deve essere di 5 cifre numeriche', 'Errore', 'error');
                    return false;
                }
                if (isNaN(numeroCivico) || Number(numeroCivico) < 1) {
                    e.preventDefault();
                    showBootstrapToast('Il numero civico deve essere un numero positivo', 'Errore', 'error');
                    return false;
                }
            }, true);
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