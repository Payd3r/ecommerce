// Pagina creazione nuova segnalazione (issue)
import { createIssue } from '../../../api/issues.js';
import { authService } from '../../services/authService.js';

export function loadHelpIssuePage() {
    const page = document.createElement('div');
    page.className = 'container pb-5';
    page.innerHTML = `
        <section class="help-issues-section">
            <div class="container py-4 help-issues-page">
                <div class="d-flex align-items-center justify-content-between mb-0 mb-md-2 flex-wrap">
                    <h1 class="page-title mb-0 flex-grow-1">Le tue Segnalazioni</h1>
                    <div class="d-none d-md-flex align-items-center ms-2">
                        <button id="open-issue-modal" class="btn btn-primary ms-2" type="button">
                            <i class="bi bi-plus-circle"></i> Invia Segnalazione
                        </button>
                    </div>
                </div>
                <div class="spacer-mobile mb-3"></div>
                <div class="d-flex d-md-none align-items-center gap-2 mb-3">
                    <button id="toggle-filters" class="btn btn-outline-primary flex-fill" type="button">
                        <i class="bi bi-funnel"></i> Filtri
                    </button>
                    <button id="open-issue-modal-mobile" class="btn btn-primary flex-fill" type="button">
                        <i class="bi bi-plus-circle"></i> Invia Segnalazione
                    </button>
                </div>
                <div class="page-subtitle mb-4">Gestisci e consulta tutte le tue segnalazioni di assistenza o problemi relativi agli ordini.</div>
                <div class="spacer-mobile mb-3"></div>
                <div class="row pb-5 pt-2">
                    <aside class="col-12 col-md-4 mb-4 mb-md-0 pe-3" id="filters-container" style="${window.innerWidth < 768 ? 'display:none;' : 'display:block;'}">
                        <div class="card shadow-sm border-0 p-3 position-relative">
                            <button type="button" class="btn btn-link text-secondary position-absolute top-0 end-0 mt-4 me-2 p-0" id="reset-user-issues-filters-btn" style="font-size:1rem;">Reset</button>
                            <h5 class="mb-3">Filtra le segnalazioni</h5>
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
                            </form>
                        </div>
                    </aside>
                    <main class="col-12 col-md-8">
                        <div class="card shadow-sm border-0">
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table mb-0 align-middle" id="user-issues-table">
                                        <thead>
                                            <tr>
                                                <th class="d-none d-md-table-cell text-center">ID</th>
                                                <th>Titolo</th>
                                                <th class="text-center">Stato</th>
                                                <th class="d-none d-md-table-cell text-center">Data</th>
                                                <th class="text-center">Dettagli</th>
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
                    </main>
                </div>
            </div>
        </section>
        <!-- Modal per invio segnalazione -->
        <div class="modal fade" id="help-issue-modal" tabindex="-1" aria-labelledby="helpIssueModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="helpIssueModalLabel">Hai bisogno di aiuto?</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Chiudi"></button>
                    </div>
                    <div class="modal-body">
                        <form id="help-issue-form">
                            <div class="mb-3">
                                <label for="issue-title" class="form-label">Titolo *</label>
                                <input type="text" class="form-control" id="issue-title" name="title" required maxlength="100">
                            </div>
                            <div class="mb-3">
                                <label for="issue-description" class="form-label">Descrizione *</label>
                                <textarea class="form-control" id="issue-description" name="description" rows="4" required></textarea>
                            </div>
                            <div id="help-issue-error" class="alert alert-danger mt-3 d-none"></div>
                            <button type="submit" class="btn btn-primary w-100">Invia Segnalazione</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => {
        // Modal Bootstrap
        const openModalBtn = page.querySelector('#open-issue-modal');
        const openModalBtnMobile = page.querySelector('#open-issue-modal-mobile');
        const helpIssueModal = new bootstrap.Modal(page.querySelector('#help-issue-modal'));
        if (openModalBtn) {
            openModalBtn.addEventListener('click', () => {
                helpIssueModal.show();
            });
        }
        if (openModalBtnMobile) {
            openModalBtnMobile.addEventListener('click', () => {
                helpIssueModal.show();
            });
        }
        // Toggle filtri mobile
        const filtersContainer = page.querySelector('#filters-container');
        const toggleFiltersBtn = page.querySelector('#toggle-filters');
        function hideFiltersMobile() {
            if (window.innerWidth < 768 && filtersContainer) {
                filtersContainer.style.display = 'none';
            } else if (filtersContainer) {
                filtersContainer.style.display = 'block';
            }
        }
        if (toggleFiltersBtn && filtersContainer) {
            toggleFiltersBtn.addEventListener('click', () => {
                if (window.innerWidth < 768) {
                    if (filtersContainer.style.display === 'none' || filtersContainer.style.display === '') {
                        filtersContainer.style.display = 'block';
                    } else {
                        filtersContainer.style.display = 'none';
                    }
                }
            });
        }
        // Nascondi filtri dopo submit/reset su mobile
        const filtersForm = page.querySelector('#user-issues-filters-form');
        const resetBtn = page.querySelector('#reset-user-issues-filters-btn');
        if (filtersForm) {
            filtersForm.onsubmit = function(e) {
                e.preventDefault();
                applyUserIssuesFilters();
                hideFiltersMobile();
            };
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', function(e) {
                e.preventDefault();
                resetUserIssuesFilters();
                hideFiltersMobile();
            });
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
                        <td class="d-none d-md-table-cell text-center">${issue.id_issue}</td>
                        <td>${issue.title}</td>
                        <td class="text-center">${renderStatusBadge(issue.status)}</td>
                        <td class="d-none d-md-table-cell text-center">${formatDate(issue.created_at)}</td>
                        <td class="text-center align-middle p-0">
                            <div class="d-flex justify-content-center align-items-center" style="height:100%;min-height:38px;">
                                <button class="btn btn-link p-0 m-0 d-flex justify-content-center align-items-center user-issue-details-btn" data-issue-id="${issue.id_issue}" title="Dettagli segnalazione" style="height:38px;width:38px;">
                                    <i class="bi bi-eye fs-5"></i>
                                </button>
                            </div>
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
        function formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
            return `${date.getDate()} ${mesi[date.getMonth()]} ${date.getFullYear()}`;
        }
        function showUserIssueDetails(issue) {
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.tabIndex = -1;
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">Dettagli Segnalazione #${issue.id_issue}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Chiudi"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <span class="badge ${issue.status === 'open' ? 'bg-warning text-dark' : issue.status === 'closed' ? 'bg-success' : issue.status === 'refused' ? 'bg-danger' : 'bg-info'} px-3 py-2 fs-6">${renderStatusBadge(issue.status).replace(/<[^>]+>/g, '')}</span>
                            </div>
                            <div class="mb-2"><strong>Titolo:</strong><br><span class="text-dark">${issue.title}</span></div>
                            <div class="mb-2"><strong>Descrizione:</strong><br><span class="text-secondary">${issue.description || '-'}</span></div>
                            <div class="mb-2"><strong>Data:</strong> <span class="text-dark">${formatDate(issue.created_at)}</span></div>
                            <hr>
                            <div class="mb-2"><strong>Commento admin:</strong><br>${issue.admin_note ? `<span class="text-success">${issue.admin_note}</span>` : '<span class="text-muted">Nessun commento</span>'}</div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
            });
        }
        // Miglioramenti tabella mobile: meno spazi bianchi
        const style = document.createElement('style');
        style.textContent = `
        @media (max-width: 767px) {
            .help-issues-section .section-header h2 {
                font-size: 1.3rem;
                margin-bottom: 0.5rem;
            }
            .help-issues-section .section-header .btn {
                font-size: 1rem;
                padding: 0.4rem 0.7rem;
            }
            #filters-container {
                margin-bottom: 1.2rem;
            }
            #user-issues-table th, #user-issues-table td {
                padding: 0.4rem 0.3rem;
                font-size: 0.98rem;
            }
            #user-issues-table th.d-none, #user-issues-table td.d-none {
                display: none !important;
            }
            .card-body > h4.card-title {
                display: none;
            }
            .spacer-mobile { margin-bottom: 1.5rem !important; }
        }
        `;
        document.head.appendChild(style);
        loadUserIssues();
    }, 0);
    return page;
}
