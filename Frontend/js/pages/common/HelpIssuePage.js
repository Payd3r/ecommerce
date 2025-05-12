// Pagina creazione nuova segnalazione (issue)
import { createIssue } from '../../../api/issues.js';
import { authService } from '../../services/authService.js';

export function loadHelpIssuePage() {
    const page = document.createElement('div');
    page.className = 'container py-5';
    page.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <h2 class="card-title mb-4 text-center">Hai bisogno di aiuto?</h2>
                        <form id="help-issue-form">
                            <div class="mb-3">
                                <label for="issue-title" class="form-label">Titolo *</label>
                                <input type="text" class="form-control" id="issue-title" name="title" required maxlength="100">
                            </div>
                            <div class="mb-3">
                                <label for="issue-description" class="form-label">Descrizione *</label>
                                <textarea class="form-control" id="issue-description" name="description" rows="4" required></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Invia Segnalazione</button>
                        </form>
                        <div id="help-issue-error" class="alert alert-danger mt-3 d-none"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    setTimeout(() => {
        const form = page.querySelector('#help-issue-form');
        const error = page.querySelector('#help-issue-error');
        if (form) {
            form.onsubmit = async function (e) {
                e.preventDefault();
                error.classList.add('d-none');
                const formData = new FormData(form);
                const user = authService.getUser();
                console.log('USER:', user);
                if (!user || (!user.id && !user.id_user)) {
                    error.textContent = 'Devi essere autenticato per inviare una segnalazione.';
                    error.classList.remove('d-none');
                    return;
                }
                try {
                    // Preparo i dati
                    let title = formData.get('title') || '';
                    if (title.length > 32) title = title.slice(0, 32);
                    let description = formData.get('description') || '';
                    // Converto la data in formato YYYY-MM-DD
                    const now = new Date();
                    const created_at = now.toISOString().split('T')[0];
                    const id_client = user.id || user.id_user;
                    // Validazione extra
                    if (!title.trim() || !description.trim()) {
                        error.textContent = 'Compila tutti i campi obbligatori.';
                        error.classList.remove('d-none');
                        return;
                    }
                    if (title.length > 32) {
                        error.textContent = 'Il titolo non può superare i 32 caratteri.';
                        error.classList.remove('d-none');
                        return;
                    }
                    await createIssue({
                        title,
                        description,
                        status: 'open',
                        created_at,
                        id_client
                    });
                    form.reset();
                    if (typeof showBootstrapToast === 'function') {
                        showBootstrapToast('Segnalazione inviata con successo!', 'Successo', 'success');
                    }
                } catch (err) {
                    if (typeof showBootstrapToast === 'function') {
                        showBootstrapToast(err.message || 'Errore durante l\'invio della segnalazione.', 'Errore', 'danger');
                    } else {
                        error.textContent = err.message || 'Errore durante l\'invio della segnalazione.';
                        error.classList.remove('d-none');
                    }
                }
            }
        }
    }, 0);
    return page;
}
