// Importo le dipendenze
import { ApiService } from '../../api/auth.js';
import { showBootstrapToast } from '../components/Toast.js';
import { loader } from '../components/Loader.js';
import { router } from '../router.js';
import { uploadProfileImage, uploadBannerImage } from '../../api/images.js';
import { authService } from '../services/authService.js';
import { countries } from '../assets.geo.js';

/**
 * Carica la pagina profilo dell'utente
 * @returns {Object} Oggetto con i metodi del componente
 */
export async function loadProfilePage() {
    // Crea l'elemento principale della pagina
    const pageElement = document.createElement('div');
    pageElement.className = 'profile-page';

    // Ottiene i dati dell'utente
    const user = await ApiService.getProfile();
    console.log("user", user);
    let address = {};
    try {
        address = await ApiService.getAddress();
        if (!address) address = {};
    } catch (e) {
        address = {};
        console.log("errore", e);
    }

    // Trova se l'utente è artigiano e ha dati extended_users
    const isArtisan = user.role === 'artisan' && user.extended_users;
    const artisanData = isArtisan ? user.extended_users : null;

    // Determina le classi delle colonne in base al ruolo
    const infoColClass = isArtisan ? 'col-12' : 'col-12 col-md-6';
    const passwordColClass = isArtisan ? 'col-12' : 'col-12 col-md-6';

    // Costruisce il contenuto della pagina
    pageElement.innerHTML = `
        <div class="container pb-5 pt-3">
            <div class="row">
                <div class="col-12">
                    <h1 class="page-title mb-3">Il tuo profilo</h1>
                    <p class="page-subtitle">Visualizza e aggiorna le informazioni del tuo account.</p>
                </div>
            </div>
            <div class="row g-4">
                <div class="${infoColClass}">
                    <form id="public-info-form" class="card shadow-sm border-0 p-4 h-100" style="min-height:480px;">
                        <h2 class="h5 mb-0">Info Pubbliche</h2>
                        <div class="row">
                            <div class="${isArtisan ? 'col-12 col-md-6 mt-3' : 'col-12 mt-3'}">
                                <div class="d-flex align-items-center mb-3 flex-column flex-md-row text-center text-md-start">
                                    <div class="me-md-3 mb-3 mb-md-0" id="profileImagePreviewWrapper">
                                        ${user.image ? `
                                          <img src="${user.image}" id="profileImagePreview" alt="Foto profilo" class="rounded-circle border" style="width: 90px; height: 90px; object-fit: cover;" />
                                        ` : `
                                          <div id="profileImagePreview" class="d-flex align-items-center justify-content-center bg-light rounded-circle border" style="width: 72px; height: 72px;">
                                            <i class="bi bi-person-circle fs-1 text-secondary"></i>
                                          </div>
                                        `}
                                    </div>
                                    <div>
                                        <h2 class="h5 mb-1">${user.nickname}</h2>
                                        <div class="text-muted small mb-1">${user.email}</div>
                                        <span class="badge bg-secondary">${getRoleLabel(user.role)}</span>
                                        ${isArtisan && artisanData.approved ? '<span class="badge bg-success ms-2">Approvato</span>' : isArtisan ? '<span class="badge bg-warning text-dark ms-2">Non approvato</span>' : ''}
                                        ${isArtisan && artisanData.approved_at ? `<div class="text-muted small mt-1">Membro da: ${new Date(artisanData.approved_at).toLocaleDateString('it-IT')}</div>` : ''}
                                    </div>
                                </div>
                                <label class="form-label">Foto profilo</label>
                                <input type="file" class="form-control" id="profileImageInput" accept="image/*" />
                                <div class="mb-3 mt-3">
                                    <label for="nickname" class="form-label">Nickname</label>
                                    <input type="text" id="nickname" name="nickname" class="form-control" value="${user.nickname || ''}" maxlength="32" />
                                </div>
                                <div class="mb-3">
                                    <label for="email" class="form-label">Email</label>
                                    <input type="email" id="email" name="email" class="form-control" value="${user.email}" />
                                </div>
                            </div>
                            <div class="${isArtisan ? 'col-12 col-md-6' : 'col-12'}">                               
                                ${isArtisan ? `                                
                                <div class="mb-2">
                                    ${artisanData.url_banner ? `<img src="${artisanData.url_banner}" alt="Banner" class="img-fluid rounded mb-2" style="max-height:125px;width:100%;object-fit:cover;" />` : ''}
                                    <label for="bannerInput" class="form-label">Banner profilo</label>                                    
                                    <input type="file" class="form-control" id="bannerInput" accept="image/*" />
                                </div>
                                <div class="mb-2">
                                    <label for="bio" class="form-label">Bio</label>
                                    <textarea id="bio" name="bio" class="form-control" maxlength="2024" rows="5">${artisanData.bio || ''}</textarea>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary w-100 mt-2">Aggiorna Info Pubbliche</button>
                    </form>
                </div>
                <div class="${passwordColClass}">
                    <div class="card shadow-sm border-0 p-4 h-100 mb-4 mb-lg-0">
                        <h2 class="h5 mb-3">Cambia password</h2>
                        <form id="password-form">
                            <div class="row">
                                <div class="col-12">
                                    <div class="mb-3">
                                        <label for="current-password" class="form-label">Password attuale</label>
                                        <input type="password" id="current-password" name="currentPassword" class="form-control" required>
                                    </div>                                    
                                </div>
                                <div class="col-12">
                                    <div class="mb-3">
                                        <label for="new-password" class="form-label">Nuova password</label>
                                        <input type="password" id="new-password" name="newPassword" class="form-control" required minlength="6">
                                        <div class="form-text">La password deve contenere almeno 6 caratteri</div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="confirm-password" class="form-label">Conferma nuova password</label>
                                        <input type="password" id="confirm-password" name="confirmPassword" class="form-control" required minlength="6">
                                    </div>
                                </div>
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
                                    <span class="btn-text">Aggiorna Info Personali</span>
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
     * @param {string} role Ruolo dell'utente
     * @returns {string} Etichetta leggibile
     */
    function getRoleLabel(role) {
        const labels = {
            client: 'Cliente',
            artisan: 'Artigiano',
            admin: 'Amministratore'
        };
        return labels[role] || role;
    }

    // Variabili per le select geografiche, visibili a tutta la funzione
    let statoSelect, provinciaSelect, cittaSelect;

    /**
     * Gestisce l'aggiornamento del profilo
     * @param {Event} event Evento submit
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
        // Prendi nickname/email dai rispettivi input (se presenti)
        const nicknameInput = document.getElementById('nickname');
        const emailInput = document.getElementById('email');
        const nickname = nicknameInput ? nicknameInput.value.trim() : user.nickname;
        const email = emailInput ? emailInput.value.trim() : user.email;
        if (!name || !surname) {
            showBootstrapToast('Nome e cognome sono obbligatori', 'Errore', 'error');
            return;
        }
        // Validazione select: devono essere tra le opzioni
        function isValidOption(select, value) {
            return Array.from(select.options).some(opt => opt.value === value);
        }
        if (!isValidOption(statoSelect, stato)) {
            showBootstrapToast('Seleziona uno stato valido', 'Errore', 'error');
            return;
        }
        if (!isValidOption(provinciaSelect, provincia)) {
            showBootstrapToast('Seleziona una provincia valida', 'Errore', 'error');
            return;
        }
        if (!isValidOption(cittaSelect, citta)) {
            showBootstrapToast('Seleziona una città valida', 'Errore', 'error');
            return;
        }
        try {
            const submitBtn = form.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            submitBtn.disabled = true;
            btnText.innerHTML = '<span class="btn-loader"></span> Aggiornamento...';
            loader.show();
            // Aggiorna nickname/email solo se sono cambiati
            let updateProfilePayload = {};
            if (nickname !== user.nickname) updateProfilePayload.nickname = nickname;
            if (email !== user.email) updateProfilePayload.email = email;
            if (Object.keys(updateProfilePayload).length > 0) {
                await ApiService.updateProfile(updateProfilePayload);
                const updatedUser = { ...user, ...updateProfilePayload };
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
     * @param {Event} event Evento submit
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
     * Inizializza gli event listener della pagina profilo
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
        const publicInfoForm = document.getElementById('public-info-form');
        const profileImageInput = document.getElementById('profileImageInput');
        const profileImagePreviewWrapper = document.getElementById('profileImagePreviewWrapper');
        const nicknameInput = document.getElementById('nickname');
        const bioInput = document.getElementById('bio');
        const bannerInput = document.getElementById('bannerInput');

        if (publicInfoForm) {
            publicInfoForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                loader.show();
                try {
                    console.log('[DEBUG] Submit public-info-form');
                    const nickname = nicknameInput ? nicknameInput.value.trim() : '';
                    const emailInput = document.getElementById('email');
                    const email = emailInput ? emailInput.value.trim() : '';
                    console.log('[DEBUG] nickname:', nickname, 'user.nickname:', user.nickname);
                    console.log('[DEBUG] email:', email, 'user.email:', user.email);
                    let updated = false;
                    if ((nickname && nickname !== user.nickname) || (email && email !== user.email)) {
                        console.log('[DEBUG] Chiamo ApiService.updateProfile', { nickname, email });
                        await ApiService.updateProfile({ nickname, email });
                        updated = true;
                    }
                    // Aggiorna foto profilo
                    const profileFile = profileImageInput && profileImageInput.files[0];
                    let newProfileImageUrl = null;
                    if (profileFile) {
                        console.log('[DEBUG] Upload nuova foto profilo');
                        const profileUploadRes = await uploadProfileImage(user.id, profileFile);
                        console.log('Risposta upload profilo:', profileUploadRes);
                        // Se la risposta contiene la nuova url, aggiorna la preview
                        if (profileUploadRes && profileUploadRes.files && profileUploadRes.files[0] && profileUploadRes.files[0].url) {
                            newProfileImageUrl = profileUploadRes.files[0].url;
                            const profileImagePreview = document.getElementById('profileImagePreview');
                            if (profileImagePreview) {
                                if (profileImagePreview.tagName === 'IMG') {
                                    profileImagePreview.src = newProfileImageUrl;
                                } else {
                                    // Se era il div placeholder, lo sostituisco con l'img
                                    const wrapper = document.getElementById('profileImagePreviewWrapper');
                                    if (wrapper) {
                                        const img = document.createElement('img');
                                        img.src = newProfileImageUrl;
                                        img.id = 'profileImagePreview';
                                        img.alt = 'Foto profilo';
                                        img.className = 'rounded-circle border';
                                        img.style.width = '90px';
                                        img.style.height = '90px';
                                        img.style.objectFit = 'cover';
                                        wrapper.innerHTML = '';
                                        wrapper.appendChild(img);
                                    }
                                }
                            }
                            // Aggiorna anche l'utente nel localStorage
                            let authUser = localStorage.getItem('auth_user');
                            if (authUser) {
                                try {
                                    authUser = JSON.parse(authUser);
                                    authUser.image = newProfileImageUrl;
                                    localStorage.setItem('auth_user', JSON.stringify(authUser));
                                } catch (e) {}
                            }
                        }
                        updated = true;
                    }
                    // Se artigiano, aggiorna bio e banner
                    if (isArtisan) {
                        const bio = bioInput ? bioInput.value.trim() : '';
                        console.log('[DEBUG] bio:', bio, 'artisanData.bio:', artisanData.bio);
                        if (bio !== (artisanData.bio || '')) {
                            console.log('[DEBUG] Chiamo ApiService.updateArtisanBio', { bio });
                            await ApiService.updateArtisanBio({ bio });
                            updated = true;
                        }
                        const bannerFile = bannerInput && bannerInput.files[0];
                        let newBannerUrl = null;
                        if (bannerFile) {
                            console.log('[DEBUG] Upload nuovo banner');
                            const bannerUploadRes = await uploadBannerImage(user.id, bannerFile);
                            console.log('Risposta upload banner:', bannerUploadRes);
                            // Se la risposta contiene la nuova url, aggiorna la preview
                            if (bannerUploadRes && bannerUploadRes.url) {
                                newBannerUrl = bannerUploadRes.url;
                                // Trova l'img del banner e aggiorna
                                const bannerImg = publicInfoForm.querySelector('img[alt="Banner"]');
                                if (bannerImg) {
                                    bannerImg.src = newBannerUrl;
                                } else {
                                    // Se non esiste, crea l'img
                                    const bannerDiv = bannerInput.closest('.mb-2');
                                    if (bannerDiv) {
                                        const img = document.createElement('img');
                                        img.src = newBannerUrl;
                                        img.alt = 'Banner';
                                        img.className = 'img-fluid rounded mb-2';
                                        img.style.maxHeight = '125px';
                                        img.style.width = '100%';
                                        img.style.objectFit = 'cover';
                                        bannerDiv.insertBefore(img, bannerInput);
                                    }
                                }
                            }
                            updated = true;
                        }
                    }
                    if (updated) {
                        showBootstrapToast('Informazioni pubbliche aggiornate con successo', 'Successo', 'success');
                        document.dispatchEvent(new CustomEvent('auth:change'));
                    } else {
                        showBootstrapToast('Nessuna modifica da salvare', 'Info', 'info');
                    }
                } catch (err) {
                    console.error('[DEBUG] Errore durante il salvataggio delle informazioni pubbliche', err);
                    showBootstrapToast('Errore durante il salvataggio delle informazioni pubbliche', 'Errore', 'danger');
                } finally {
                    loader.hide();
                }
            });
        }

        // --- POPOLAMENTO SELECT GEOGRAFICHE ---
        statoSelect = document.getElementById('stato');
        provinciaSelect = document.getElementById('provincia');
        cittaSelect = document.getElementById('citta');
        // Popola stati
        countries.forEach(country => {
            const opt = document.createElement('option');
            opt.value = country.name;
            opt.textContent = country.name;
            statoSelect.appendChild(opt);
        });
        // Seleziona stato salvato o aggiungi se mancante
        if (address.stato) {
            let found = Array.from(statoSelect.options).some(opt => opt.value === address.stato);
            if (!found) {
                const opt = document.createElement('option');
                opt.value = address.stato;
                opt.textContent = address.stato + ' (non più disponibile)';
                statoSelect.appendChild(opt);
            }
            statoSelect.value = address.stato;
        }
        // Popola province in base allo stato
        function updateProvinceSelect() {
            provinciaSelect.innerHTML = '<option value="">Seleziona provincia</option>';
            cittaSelect.innerHTML = '<option value="">Seleziona città</option>';
            const selectedCountry = countries.find(c => c.name === statoSelect.value);
            let provinceNames = [];
            if (selectedCountry) {
                selectedCountry.provinces.forEach(prov => {
                    const opt = document.createElement('option');
                    opt.value = prov.name;
                    opt.textContent = prov.name;
                    provinciaSelect.appendChild(opt);
                    provinceNames.push(prov.name);
                });
            }
            // Se la provincia salvata non è tra le opzioni, aggiungila
            if (address.provincia && !provinceNames.includes(address.provincia)) {
                const opt = document.createElement('option');
                opt.value = address.provincia;
                opt.textContent = address.provincia + ' (non più disponibile)';
                provinciaSelect.appendChild(opt);
            }
            if (address.provincia) {
                provinciaSelect.value = address.provincia;
                updateCitySelect();
            }
        }
        // Popola città in base alla provincia
        function updateCitySelect() {
            cittaSelect.innerHTML = '<option value="">Seleziona città</option>';
            const selectedCountry = countries.find(c => c.name === statoSelect.value);
            const selectedProvince = selectedCountry ? selectedCountry.provinces.find(p => p.name === provinciaSelect.value) : null;
            let cityNames = [];
            if (selectedProvince) {
                selectedProvince.cities.forEach(city => {
                    const opt = document.createElement('option');
                    opt.value = city;
                    opt.textContent = city;
                    cittaSelect.appendChild(opt);
                    cityNames.push(city);
                });
            }
            // Se la città salvata non è tra le opzioni, aggiungila
            if (address.citta && !cityNames.includes(address.citta)) {
                const opt = document.createElement('option');
                opt.value = address.citta;
                opt.textContent = address.citta + ' (non più disponibile)';
                cittaSelect.appendChild(opt);
            }
            if (address.citta) {
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
     * Rimuove gli event listener della pagina profilo
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