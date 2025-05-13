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
        <div class="row justify-content-center mt-5">
            <div class="col-md-10 col-lg-8">
                <div class="row g-4">
                    <div class="col-md-4 col-12 mb-4 mb-md-0" style="min-width:0;">
                        <div class="card filters-card">
                            <div class="card-body">
                                <h5 class="card-title">Filtri</h5>
                                <form id="user-issues-filters-form">
                                    <div class="mb-3">
                                        <label for="filter-title" class="form-label">Titolo</label>
                                        <input type="text" class="form-control" id="filter-title" name="title" placeholder="Cerca per titolo">
                                    </div>
                                    <div class="mb-3">
                                        <label for="filter-status" class="form-label">Stato</label>
                                        <select class="form-select" id="filter-status" name="status">
                                            <option value="">Tutti</option>
                                            <option value="open">Aperta</option>
                                            <option value="closed">Chiusa</option>
                                            <option value="refused">Rifiutata</option>
                                            <option value="solved">Risolta</option>
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label for="filter-date" class="form-label">Data</label>
                                        <input type="date" class="form-control" id="filter-date" name="date">
                                    </div>
                                    <button type="submit" class="btn btn-primary w-100">Applica filtri</button>
                                    <button type="button" class="btn btn-secondary w-100 mt-2" id="reset-user-issues-filters-btn">Reset filtri</button>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-8 col-12">
                        <div class="card shadow-sm">
                            <div class="card-body">
                                <h4 class="card-title mb-3 text-center">Le tue segnalazioni inviate</h4>
                                <div class="table-responsive">
                                    <table class="table mb-0">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Titolo</th>
                                                <th>Stato</th>
                                                <th>Data</th>
                                                <th>Dettagli</th>
                                            </tr>
                                        </thead>
                                        <tbody id="user-issues-table-body">
                                            <tr><td colspan="5" class="text-center text-muted py-4">Caricamento...</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div id="user-issues-pagination" class="mt-3 d-flex justify-content-center"></div>
                            </div>
                        </div>
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
        let allUserIssues = [];
        let filteredUserIssues = [];
        let currentPage = 1;
        const PAGE_SIZE = 5;
        // Carica e mostra le issue dell'utente
        async function loadUserIssues(page = 1) {
            const user = authService.getUser();
            if (!user || (!user.id && !user.id_user)) return;
            let userId = user.id || user.id_user;
            let issues = [];
            try {
                const { getIssues } = await import('../../../api/issues.js');
                // Prendi tutte le issue (filtro lato frontend)
                const data = await getIssues(1, 100); // Prendi le prime 100
                issues = (data.issues || []).filter(issue => issue.id_client == userId);
            } catch (e) {
                issues = [];
            }
            allUserIssues = issues;
            filteredUserIssues = [...allUserIssues];
            currentPage = page;
            renderUserIssuesTable();
            renderUserIssuesPagination();
        }
        function applyUserIssuesFilters() {
            const form = document.getElementById('user-issues-filters-form');
            const title = form.title.value.trim().toLowerCase();
            const status = form.status.value;
            const date = form.date.value;
            filteredUserIssues = allUserIssues.filter(issue => {
                let ok = true;
                if (title && !(issue.title || '').toLowerCase().includes(title)) ok = false;
                if (status && issue.status !== status) ok = false;
                if (date && issue.created_at && issue.created_at.split('T')[0] !== date) ok = false;
                return ok;
            });
            currentPage = 1;
            renderUserIssuesTable();
            renderUserIssuesPagination();
        }
        function resetUserIssuesFilters() {
            const form = document.getElementById('user-issues-filters-form');
            form.reset();
            filteredUserIssues = [...allUserIssues];
            currentPage = 1;
            renderUserIssuesTable();
            renderUserIssuesPagination();
        }
        function renderUserIssuesTable() {
            const tableBody = document.getElementById('user-issues-table-body');
            if (!tableBody) return;
            const startIdx = (currentPage - 1) * PAGE_SIZE;
            const pageIssues = filteredUserIssues.slice(startIdx, startIdx + PAGE_SIZE);
            if (!pageIssues.length) {
                tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Nessuna segnalazione trovata.</td></tr>`;
                return;
            }
            tableBody.innerHTML = '';
            pageIssues.forEach(issue => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${issue.id_issue}</td>
                        <td>${issue.title}</td>
                        <td>${renderStatusBadge(issue.status)}</td>
                        <td>${issue.created_at ? issue.created_at.split('T')[0] : '-'}</td>
                        <td class="text-center">
                            <button class="btn btn-link p-0 m-0 d-flex justify-content-center align-items-center user-issue-details-btn" data-issue-id="${issue.id_issue}" title="Dettagli segnalazione">
                                <i class="bi bi-eye fs-5"></i>
                            </button>
                        </td>
                    </tr>`;
            });
            // Eventi dettagli
            tableBody.querySelectorAll('.user-issue-details-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = btn.getAttribute('data-issue-id');
                    const issue = filteredUserIssues.find(i => i.id_issue == id);
                    if (issue) showUserIssueDetails(issue);
                });
            });
        }
        function renderUserIssuesPagination() {
            const pagContainer = document.getElementById('user-issues-pagination');
            if (!pagContainer) return;
            pagContainer.innerHTML = '';
            const totalPages = Math.ceil(filteredUserIssues.length / PAGE_SIZE) || 1;
            if (totalPages <= 1) return;
            const btnGroup = document.createElement('div');
            btnGroup.className = 'btn-group';
            // Bottone Precedente
            if (currentPage > 1) {
                const prevBtn = document.createElement('button');
                prevBtn.type = 'button';
                prevBtn.className = 'btn btn-outline-primary btn-sm';
                prevBtn.textContent = 'Precedente';
                prevBtn.onclick = function() {
                    currentPage--;
                    renderUserIssuesTable();
                    renderUserIssuesPagination();
                };
                btnGroup.appendChild(prevBtn);
            }
            // Bottoni pagina (max 5)
            const maxButtons = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
            let endPage = Math.min(totalPages, startPage + maxButtons - 1);
            if (endPage - startPage < maxButtons - 1) {
                startPage = Math.max(1, endPage - maxButtons + 1);
            }
            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.type = 'button';
                pageBtn.className = `btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'}`;
                pageBtn.textContent = i;
                if (i !== currentPage) {
                    pageBtn.onclick = function() {
                        currentPage = i;
                        renderUserIssuesTable();
                        renderUserIssuesPagination();
                    };
                }
                btnGroup.appendChild(pageBtn);
            }
            // Bottone Successivo
            if (currentPage < totalPages) {
                const nextBtn = document.createElement('button');
                nextBtn.type = 'button';
                nextBtn.className = 'btn btn-outline-primary btn-sm';
                nextBtn.textContent = 'Successivo';
                nextBtn.onclick = function() {
                    currentPage++;
                    renderUserIssuesTable();
                    renderUserIssuesPagination();
                };
                btnGroup.appendChild(nextBtn);
            }
            pagContainer.appendChild(btnGroup);
        }
        function renderStatusBadge(status) {
            switch (status) {
                case 'open': return '<span class="badge bg-warning">Aperta</span>';
                case 'closed': return '<span class="badge bg-success">Chiusa</span>';
                case 'refused': return '<span class="badge bg-danger">Rifiutata</span>';
                case 'solved': return '<span class="badge bg-info">Risolta</span>';
                default: return `<span class="badge bg-secondary">${status}</span>`;
            }
        }
        function showUserIssueDetails(issue) {
            // Modal semplice con dettagli e commento admin
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.tabIndex = -1;
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Dettagli Segnalazione #${issue.id_issue}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p><strong>Titolo:</strong> ${issue.title}</p>
                            <p><strong>Descrizione:</strong><br>${issue.description || '-'}</p>
                            <p><strong>Stato:</strong> ${renderStatusBadge(issue.status)}</p>
                            <p><strong>Data:</strong> ${issue.created_at ? issue.created_at.split('T')[0] : '-'}</p>
                            <hr>
                            <p><strong>Commento admin:</strong><br>${issue.admin_note ? issue.admin_note : '<span class="text-muted">Nessun commento</span>'}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            // Bootstrap Modal
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
            });
        }
        // Eventi filtri
        const filtersForm = document.getElementById('user-issues-filters-form');
        if (filtersForm) {
            filtersForm.onsubmit = function(e) {
                e.preventDefault();
                applyUserIssuesFilters();
            };
            const resetBtn = document.getElementById('reset-user-issues-filters-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    resetUserIssuesFilters();
                });
            }
        }
        loadUserIssues();
    }, 0);
    return page;
}
