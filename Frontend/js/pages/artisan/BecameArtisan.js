// Importo le dipendenze
import UsersAPI from '../../../api/users.js';
import { authService } from '../../services/authService.js';
import { router } from '../../router.js';
import { showBootstrapToast } from '../../components/Toast.js';
import { uploadProfileImage, uploadBannerImage } from '../../../api/images.js';

/**
 * Pagina per diventare artigiano
 */
export async function loadBecameArtisanPage() {
    const user = authService.getUser();
    const pageElement = document.createElement('div');
    pageElement.className = 'became-artisan-page';

    if (!user) {
        pageElement.innerHTML = `
            <div class="container py-5">
                <div class="alert alert-danger text-center">
                    Devi prima <b>registrarti</b> o effettuare il <b>login</b> per poter diventare un artigiano.<br>
                    <a href="/register" class="btn btn-primary mt-3" data-route>Registrati ora</a>
                </div>
            </div>
        `;
        return { render: () => pageElement };
    }

    // Valore iniziale per l'immagine del profilo
    const initialProfileImage = user.image || '';

    pageElement.innerHTML = `
        <div class="container py-5">
            <div class="row justify-content-center">
                <div class="col-12 col-md-10 col-lg-8">
                    <div class="card shadow-sm p-4">
                        <h2 class="text-center mb-3">Diventa Artigiano</h2>
                        <p class="text-center mb-4 text-muted">Completa il tuo profilo per iniziare a vendere i tuoi prodotti.</p>
                        <form id="became-artisan-form">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="name" class="form-label">Nome completo</label>
                                    <input type="text" id="name" name="name" required class="form-control" value="${user.name || ''}">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="email" class="form-label">Email</label>
                                    <input type="email" id="email" name="email" required class="form-control" value="${user.email || ''}" readonly>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="biography" class="form-label">Biografia (opzionale)</label>
                                <textarea id="biography" name="biography" class="form-control" rows="3" placeholder="Racconta qualcosa di te e della tua arte..."></textarea>
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="profile-image-input" class="form-label">Immagine Profilo</label>
                                    <input type="file" id="profile-image-input" name="profileImage" accept="image/*" class="form-control">
                                    <div id="profile-image-preview-container" class="mt-2 text-center" style="${initialProfileImage ? '' : 'display:none;'}">
                                        <img id="profile-image-preview" src="${initialProfileImage}" alt="Anteprima Profilo" class="img-thumbnail" style="max-width: 120px; max-height: 120px; border-radius: 50%;"/>
                                        <button type="button" id="remove-profile-image" class="btn btn-sm btn-outline-danger mt-1" style="${initialProfileImage ? '' : 'display:none;'}">Rimuovi</button>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="banner-image-input" class="form-label">Immagine Banner (opzionale)</label>
                                    <input type="file" id="banner-image-input" name="bannerImage" accept="image/*" class="form-control">
                                    <div id="banner-image-preview-container" class="mt-2 text-center" style="display:none;">
                                        <img id="banner-image-preview" src="#" alt="Anteprima Banner" class="img-thumbnail" style="max-width: 100%; max-height: 150px;"/>
                                        <button type="button" id="remove-banner-image" class="btn btn-sm btn-outline-danger mt-1" style="display:none;">Rimuovi</button>
                                    </div>
                                </div>
                            </div>

                            <div class="form-check mb-4 mt-3">
                                <input class="form-check-input" type="checkbox" id="confirm-artisan" required>
                                <label class="form-check-label" for="confirm-artisan">
                                    Confermo di voler diventare un artigiano e pubblicare i miei prodotti.
                                </label>
                            </div>
                            <div class="d-grid mb-3">
                                <button type="submit" class="btn btn-primary btn-lg" id="became-artisan-btn" disabled>
                                    <span class="btn-text">Diventa Artigiano</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    async function handleSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const nameFromForm = form.name.value.trim(); // Nome preso dal form
        const email = form.email.value.trim(); 
        const biography = form.biography.value.trim();
        const profileImageInput = form.elements.profileImage;
        const bannerImageInput = form.elements.bannerImage;
        const profileImageFile = profileImageInput?.files[0];
        const bannerImageFile = bannerImageInput?.files[0];
        const confirm = form['confirm-artisan'].checked;

        if (!nameFromForm || !confirm) { 
            showBootstrapToast('Il nome è obbligatorio e devi confermare la tua intenzione.', 'Errore', 'error');
            return;
        }

        if (email !== user.email) {
            showBootstrapToast('L\'email non può essere modificata.', 'Errore', 'error');
            return;
        }

        const submitButton = document.getElementById('became-artisan-btn');
        if (submitButton) submitButton.disabled = true;

        let updatedName = user.name; // Inizializza con il nome attuale
        let updatedProfileImageUrl = user.image; // Inizializza con l'immagine attuale
        let updatedBannerImageUrl = null;

        try {
            if (user.name !== nameFromForm) {
                updatedName = nameFromForm;
            }

            // 1. Carica la foto profilo se presente
            if (profileImageFile) {
                const res = await uploadProfileImage(user.id, profileImageFile);
                if (res && res.files && res.files[0] && res.files[0].url) {
                    updatedProfileImageUrl = res.files[0].url;
                }
            }
            // 2. Carica il banner se presente
            if (bannerImageFile) {
                const res = await uploadBannerImage(user.id, bannerImageFile);
                if (res && res.url) {
                    updatedBannerImageUrl = res.url;
                }
            }
            // 3. Aggiorna la bio tramite updateArtisanDetails
            if (biography) {
                await UsersAPI.updateArtisanDetails({ bio: biography });
            }
            // 4. Aggiorna il nome se cambiato (tramite API profilo, se necessario)
            if (user.name !== nameFromForm) {
                await UsersAPI.updateUser(user.id, { name: nameFromForm });
            }
            // 5. Aggiorna l'utente in localStorage con i nuovi dati
            const currentUserFromAuth = authService.getUser();
            const userToStore = {
                ...currentUserFromAuth,
                name: updatedName, // Nome aggiornato dal form
                image: updatedProfileImageUrl // Immagine profilo aggiornata dalla risposta API
            };
            localStorage.setItem('auth_user', JSON.stringify(userToStore));

            showBootstrapToast('Richiesta di diventare artigiano inviata con successo! Sarai ricontattato a breve.', 'Successo', 'success');
            document.dispatchEvent(new CustomEvent('auth:change', { detail: { user: userToStore } }));
            router.navigate('/');

        } catch (error) {
            showBootstrapToast(`Errore durante l'invio della richiesta: ${error.message}`, 'Errore', 'error');
            console.error("Errore handleSubmit in BecameArtisanPage:", error);
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    }

    function setupImagePreview(fileInput, previewImg, previewContainer, removeBtn) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    previewImg.src = ev.target.result;
                    previewContainer.style.display = 'block';
                    if (removeBtn) removeBtn.style.display = 'inline-block';
                };
                reader.readAsDataURL(file);
            } else {
                // Se l'utente deseleziona il file, potremmo voler ripristinare l'immagine originale o nascondere l'anteprima
                // Per ora, la nascondiamo se non c'era un'immagine iniziale (es. banner)
                if (previewImg.dataset.initialSrc) {
                    previewImg.src = previewImg.dataset.initialSrc;
                    if (removeBtn) removeBtn.style.display = 'inline-block'; // Mostra rimuovi se c'era una iniziale
                } else {
                    previewImg.src = '#';
                    previewContainer.style.display = 'none';
                    if (removeBtn) removeBtn.style.display = 'none';
                }
            }
        });

        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                fileInput.value = ''; // Resetta l'input file
                if (previewImg.dataset.initialSrc && previewImg.id === 'profile-image-preview') { // Se è l'immagine profilo e c'era un'iniziale
                    previewImg.src = previewImg.dataset.initialSrc; // Ripristina l'immagine profilo iniziale
                    previewContainer.style.display = 'block';
                    removeBtn.style.display = 'inline-block'; // Mantieni il pulsante rimuovi visibile
                } else { // Per il banner o se il profilo non aveva img iniziale
                    previewImg.src = '#';
                    previewContainer.style.display = 'none';
                    removeBtn.style.display = 'none';
                }
                // Potrebbe essere necessario notificare che l'immagine è stata "rimossa" per l'invio del form
                // Ad esempio, impostando un flag o inviando un valore specifico al backend.
            });
        }
    }


    function mount() {
        const form = document.getElementById('became-artisan-form');
        const checkbox = document.getElementById('confirm-artisan');
        const btn = document.getElementById('became-artisan-btn');

        const profileImageInput = document.getElementById('profile-image-input');
        const profileImagePreview = document.getElementById('profile-image-preview');
        const profileImagePreviewContainer = document.getElementById('profile-image-preview-container');
        const removeProfileImageBtn = document.getElementById('remove-profile-image');

        const bannerImageInput = document.getElementById('banner-image-input');
        const bannerImagePreview = document.getElementById('banner-image-preview');
        const bannerImagePreviewContainer = document.getElementById('banner-image-preview-container');
        const removeBannerImageBtn = document.getElementById('remove-banner-image');

        if (form) {
            form.addEventListener('submit', handleSubmit);
        }
        if (checkbox && btn) {
            btn.disabled = !checkbox.checked;
            checkbox.addEventListener('change', () => {
                btn.disabled = !checkbox.checked;
            });
        }

        // Salva l'URL dell'immagine profilo iniziale se presente
        if (initialProfileImage && profileImagePreview) {
            profileImagePreview.dataset.initialSrc = initialProfileImage;
        }


        if (profileImageInput && profileImagePreview && profileImagePreviewContainer) {
            setupImagePreview(profileImageInput, profileImagePreview, profileImagePreviewContainer, removeProfileImageBtn);
            // Mostra il pulsante rimuovi se c'è un'immagine profilo iniziale
            if (initialProfileImage && removeProfileImageBtn) {
                 removeProfileImageBtn.style.display = 'inline-block';
                 profileImagePreviewContainer.style.display = 'block'; // Assicura che il container sia visibile
            }
        }

        if (bannerImageInput && bannerImagePreview && bannerImagePreviewContainer) {
            setupImagePreview(bannerImageInput, bannerImagePreview, bannerImagePreviewContainer, removeBannerImageBtn);
        }
        
        // Imposta l'email come readonly perché non dovrebbe essere modificata qui
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.readOnly = true;
        }
    }

    function unmount() {
        const form = document.getElementById('became-artisan-form');
        if (form) {
            form.removeEventListener('submit', handleSubmit);
        }
        // Potrebbe essere utile rimuovere anche gli event listener dalle immagini qui se necessario,
        // ma dato che la pagina viene distrutta e ricreata, non è strettamente indispensabile.
    }

    return {
        render: () => pageElement,
        mount,
        unmount
    };
}
