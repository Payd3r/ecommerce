// Importo le dipendenze
import UsersAPI from '../../../api/users.js';
import { authService } from '../../services/authService.js';
import { router } from '../../router.js';
import { showBootstrapToast } from '../../components/Toast.js';

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

    pageElement.innerHTML = `
        <div class="container py-5">
            <div class="row justify-content-center">
                <div class="col-12 col-md-8 col-lg-6">
                    <div class="card shadow-sm p-4">
                        <h2 class="text-center mb-3">Diventa Artigiano</h2>
                        <p class="text-center mb-4 text-muted">Conferma il tuo nome, la tua email e scegli di diventare un artigiano per pubblicare i tuoi prodotti!</p>
                        <form id="became-artisan-form">
                            <div class="mb-3">
                                <label for="name" class="form-label">Nome completo</label>
                                <input type="text" id="name" name="name" required class="form-control" value="${user.name}">
                            </div>
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" id="email" name="email" required class="form-control" value="${user.email}">
                            </div>
                            <div class="mb-3">
                                <label for="profile-image" class="form-label">Immagine profilo (opzionale)</label>
                                <input type="file" id="profile-image" name="profileImage" accept="image/*" class="form-control">
                                <div id="profile-image-preview" class="mt-2" style="display:none;">
                                    <img src="" alt="Anteprima immagine" style="max-width: 120px; max-height: 120px; border-radius: 50%; border: 1px solid #ccc;" />
                                </div>
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="confirm-artisan" required>
                                <label class="form-check-label" for="confirm-artisan">
                                    Confermo di voler diventare un artigiano e pubblicare i miei prodotti
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
        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const confirm = form['confirm-artisan'].checked;
        if (!name || !email || !confirm) {
            showBootstrapToast('Compila tutti i campi e conferma la scelta', 'Errore', 'error');
            return;
        }
        if (email !== user.email) {
            showBootstrapToast('L\'email inserita non corrisponde a quella del tuo account', 'Errore', 'error');
            return;
        }
        try {
            // Aggiorna il ruolo dell'utente
            await UsersAPI.updateUserProfile({ name, role: 'artisan' });
            // Aggiorna localmente il ruolo
            const updatedUser = { ...user, name, role: 'artisan' };
            localStorage.setItem('auth_user', JSON.stringify(updatedUser));
            showBootstrapToast('Ora sei un artigiano! Benvenuto nella dashboard.', 'Successo', 'success');
            document.dispatchEvent(new CustomEvent('auth:change'));
            router.navigate('/artisan/dashboard');
        } catch (error) {
            showBootstrapToast('Errore durante la richiesta: ' + error.message, 'Errore', 'error');
        }
    }

    function mount() {
        const form = document.getElementById('became-artisan-form');
        const checkbox = document.getElementById('confirm-artisan');
        const btn = document.getElementById('became-artisan-btn');
        const fileInput = document.getElementById('profile-image');
        const previewDiv = document.getElementById('profile-image-preview');
        const previewImg = previewDiv ? previewDiv.querySelector('img') : null;
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }
        if (checkbox && btn) {
            btn.disabled = !checkbox.checked;
            checkbox.addEventListener('change', () => {
                btn.disabled = !checkbox.checked;
            });
        }
        if (fileInput && previewDiv && previewImg) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(ev) {
                        previewImg.src = ev.target.result;
                        previewDiv.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                } else {
                    previewImg.src = '';
                    previewDiv.style.display = 'none';
                }
            });
        }
    }
    function unmount() {
        const form = document.getElementById('became-artisan-form');
        if (form) {
            form.removeEventListener('submit', handleSubmit);
        }
    }
    return {
        render: () => pageElement,
        mount,
        unmount
    };
}
