// Scheletro base per la pagina Gestione Segnalazioni (Issues)
import { showIssueModal } from './modals/issues_modal.js';
import { updateIssue } from '../../../api/issues.js';
import { router } from '../../router.js';

/**
 * Carica la pagina di gestione delle segnalazioni (issues) per l'amministratore.
 * Inizializza la UI, gestisce filtri, ordinamento, paginazione, refresh e modale dettagli.
 * @returns {Object} - Oggetto con i metodi del componente (render, mount, unmount)
 */
export async function loadIssuesManagementPage() {
    // Crea l'elemento principale della pagina
    const pageElement = document.createElement('div');
    pageElement.className = 'issues-management-page';
    pageElement.innerHTML = `
        <div class="container pb-5 mt-4">
            <div class="row">
                <div class="col-12 text-center">
                    <h1 class="display-5 fw-bold">Gestione Segnalazioni</h1>
                </div>
            </div>
            <div class="row mb-4 align-items-center mx-5">
                <div class="col-6 d-flex align-items-center">
                    <button class="btn btn-outline-secondary" id="back-btn"><i class="bi bi-arrow-left"></i> Torna indietro</button>
                </div>
                <div class="col-6 d-flex justify-content-end">
                    <button class="btn btn-outline-primary d-flex align-items-center gap-2" id="refresh-issues-btn"><span id="refresh-spinner" class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span><i class="bi bi-arrow-clockwise"></i> Aggiorna lista</button>
                </div>
            </div>
            <div class="row g-4 mx-5">
                <div class="col-md-4 col-12 mb-4 mb-md-0" style="min-width:0;">
                    <div class="card filters-card">
                        <div class="card-body">
                            <h5 class="card-title">Filtri</h5>
                            <form id="issues-filters-form">
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
                                <button type="button" class="btn btn-secondary w-100 mt-2" id="reset-filters-btn">Reset filtri</button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="col-md-8 mb-5 pb-4">
                    <div class="card h-100">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">Segnalazioni</h5>
                            <div class="table-responsive flex-grow-1">
                                <table class="table mb-0">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th id="sort-title" style="cursor:pointer">Titolo <span id="sort-title-icon"></span></th>
                                            <th id="sort-client" style="cursor:pointer">Cliente <span id="sort-client-icon"></span></th>
                                            <th id="sort-status" style="cursor:pointer">Stato <span id="sort-status-icon"></span></th>
                                            <th id="sort-date" style="cursor:pointer">Data <span id="sort-date-icon"></span></th>
                                            <th>Nota admin</th>
                                            <th>Azioni</th>
                                        </tr>
                                    </thead>
                                    <tbody id="issues-table-body">
                                        <tr><td colspan="7" class="text-center text-muted py-5">Nessuna segnalazione trovata.</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <div id="pagination-container" class="mt-3 d-flex justify-content-center"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Stato locale per le segnalazioni e la paginazione
    let issues = [];
    let filteredIssues = [];
    let totalIssues = 0;
    let sortBy = 'created_at';
    let sortDir = 'DESC';
    // Stato filtri e paginazione
    let currentFilters = {
        title: '',
        status: '',
        date: '',
        page: 1,
        pageSize: 10
    };

    /**
     * Carica le segnalazioni dal server e aggiorna lo stato locale.
     * Applica i filtri correnti e aggiorna la paginazione.
     * @param {Object} params - Parametri opzionali per aggiornare i filtri/pagina
     */
    async function fetchIssues(params = {}) {
        currentFilters = { ...currentFilters, ...params };
        try {
            const res = await import('../../../api/issues.js');
            const data = await res.getIssues(currentFilters.page, currentFilters.pageSize);
            issues = data.issues || [];
            filteredIssues = [...issues];
            totalIssues = data.total || 0;
            applyFilters(false); // Applica i filtri correnti senza resettare la pagina
            renderPagination(Math.ceil(filteredIssues.length / currentFilters.pageSize) || 1);
        } catch (e) {
            issues = [];
            filteredIssues = [];
            totalIssues = 0;
            renderTable();
            renderPagination(1);
        }
    }

    /**
     * Applica i filtri frontend alle segnalazioni caricate.
     * Aggiorna la tabella e la paginazione.
     * @param {boolean} resetPage - Se true, resetta la pagina a 1
     */
    function applyFilters(resetPage = true) {
        const form = document.getElementById('issues-filters-form');
        const title = form.title.value.trim().toLowerCase();
        const status = form.status.value;
        const date = form.date.value;
        currentFilters.title = title;
        currentFilters.status = status;
        currentFilters.date = date;
        if (resetPage) currentFilters.page = 1;
        filteredIssues = issues.filter(issue => {
            let ok = true;
            if (title && !(issue.title || '').toLowerCase().includes(title)) ok = false;
            if (status && issue.status !== status) ok = false;
            if (date && issue.created_at && issue.created_at.split('T')[0] !== date) ok = false;
            return ok;
        });
        renderTable();
        renderPagination(Math.ceil(filteredIssues.length / currentFilters.pageSize) || 1);
    }

    /**
     * Reset dei filtri: azzera i valori e mostra tutte le segnalazioni.
     */
    function resetFilters() {
        const form = document.getElementById('issues-filters-form');
        form.reset();
        currentFilters = { ...currentFilters, title: '', status: '', date: '', page: 1 };
        filteredIssues = [...issues];
        renderTable();
        renderPagination(Math.ceil(filteredIssues.length / currentFilters.pageSize) || 1);
    }

    /**
     * Renderizza la tabella delle segnalazioni filtrate e ordinate.
     * Mostra solo la pagina corrente.
     */
    function renderTable() {
        const tableBody = document.getElementById('issues-table-body');
        tableBody.innerHTML = '';
        // Applica ordinamento
        filteredIssues.sort((a, b) => {
            let v1, v2;
            switch (sortBy) {
                case 'title':
                    v1 = (a.title || '').toLowerCase(); v2 = (b.title || '').toLowerCase(); break;
                case 'client_name':
                    v1 = (a.client_name || '').toLowerCase(); v2 = (b.client_name || '').toLowerCase(); break;
                case 'status':
                    v1 = (a.status || '').toLowerCase(); v2 = (b.status || '').toLowerCase(); break;
                case 'created_at':
                    v1 = a.created_at || ''; v2 = b.created_at || ''; break;
                default:
                    v1 = a[sortBy]; v2 = b[sortBy]; break;
            }
            if (sortBy === 'created_at') {
                v1 = v1 ? new Date(v1) : new Date(0);
                v2 = v2 ? new Date(v2) : new Date(0);
            }
            if (v1 < v2) return sortDir === 'ASC' ? -1 : 1;
            if (v1 > v2) return sortDir === 'ASC' ? 1 : -1;
            return 0;
        });
        // Mostra solo la pagina corrente
        const startIdx = (currentFilters.page - 1) * currentFilters.pageSize;
        const endIdx = startIdx + currentFilters.pageSize;
        const pageIssues = filteredIssues.slice(startIdx, endIdx);
        if (pageIssues.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-5">Nessuna segnalazione trovata.</td></tr>`;
        } else {
            pageIssues.forEach(issue => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${issue.id_issue}</td>
                        <td>${issue.title}</td>
                        <td>${issue.client_name || '-'}</td>
                        <td>${renderStatusBadge(issue.status)}</td>
                        <td>${issue.created_at ? issue.created_at.split('T')[0] : '-'}</td>
                        <td>${issue.admin_note ? issue.admin_note : '-'}</td>
                        <td class="text-center align-middle" style="vertical-align: middle !important;">
                        <button class="btn btn-link p-0 m-0 d-flex justify-content-center align-items-center" title="Dettagli segnalazione" onclick="viewIssueDetails(${issue.id_issue})">
                            <i class="bi bi-eye fs-5"></i>
                        </button>
                    </td>
                    </tr>`;
            });
        }
    }

    /**
     * Restituisce il badge HTML per lo stato della segnalazione.
     * @param {string} status - Stato della segnalazione
     * @returns {string} - HTML del badge
     */
    function renderStatusBadge(status) {
        switch (status) {
            case 'open': return '<span class="badge bg-warning text-dark">Aperta</span>';
            case 'closed': return '<span class="badge bg-success">Chiusa</span>';
            case 'refused': return '<span class="badge bg-danger">Rifiutata</span>';
            case 'solved': return '<span class="badge bg-info text-dark">Risolta</span>';
            default: return `<span class="badge bg-secondary">${status ? status.charAt(0).toUpperCase() + status.slice(1) : ''}</span>`;
        }
    }

    /**
     * Renderizza la paginazione in base al numero totale di pagine e alla pagina corrente.
     * Gestisce i bottoni di navigazione e il cambio pagina.
     * @param {number} totalPages - Numero totale di pagine
     */
    function renderPagination(totalPages) {
        const paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';

        if (totalPages <= 1) return;

        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-group';

        // Bottone Precedente
        if (currentFilters.page > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.type = 'button';
            prevBtn.className = 'btn btn-outline-primary btn-sm';
            prevBtn.textContent = 'Precedente';
            prevBtn.onclick = function() {
                fetchIssues({ page: currentFilters.page - 1 });
            };
            btnGroup.appendChild(prevBtn);
        }

        // Bottoni pagina (massimo 5)
        const maxButtons = 5;
        const startPage = Math.max(1, currentFilters.page - Math.floor(maxButtons / 2));
        const endPage = Math.min(totalPages, startPage + maxButtons - 1);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.type = 'button';
            pageBtn.className = `btn btn-sm ${i === currentFilters.page ? 'btn-primary' : 'btn-outline-primary'}`;
            pageBtn.textContent = i;
            if (i !== currentFilters.page) {
                pageBtn.onclick = function() {
                    fetchIssues({ page: i });
                };
            }
            btnGroup.appendChild(pageBtn);
        }

        // Bottone Successivo
        if (currentFilters.page < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.type = 'button';
            nextBtn.className = 'btn btn-outline-primary btn-sm';
            nextBtn.textContent = 'Successivo';
            nextBtn.onclick = function() {
                fetchIssues({ page: currentFilters.page + 1 });
            };
            btnGroup.appendChild(nextBtn);
        }

        paginationContainer.appendChild(btnGroup);
    }

    /**
     * Funzione di mount: aggiunge i listener ai bottoni principali, filtri, ordinamento e refresh.
     * Inizializza la tabella e la paginazione.
     */
    function mount() {
        const backBtn = document.getElementById('back-btn');
        if (backBtn) backBtn.addEventListener('click', () => {
            router.navigate('/admin/dashboard');
        });
        // Ordinamento colonne
        function updateSortIcons() {
            document.getElementById('sort-title-icon').textContent = sortBy === 'title' ? (sortDir === 'ASC' ? '▲' : '▼') : '';
            document.getElementById('sort-client-icon').textContent = sortBy === 'client_name' ? (sortDir === 'ASC' ? '▲' : '▼') : '';
            document.getElementById('sort-status-icon').textContent = sortBy === 'status' ? (sortDir === 'ASC' ? '▲' : '▼') : '';
            document.getElementById('sort-date-icon').textContent = sortBy === 'created_at' ? (sortDir === 'ASC' ? '▲' : '▼') : '';
        }
        document.getElementById('sort-title').onclick = function () {
            if (sortBy === 'title') sortDir = sortDir === 'ASC' ? 'DESC' : 'ASC'; else { sortBy = 'title'; sortDir = 'ASC'; }
            updateSortIcons();
            renderTable();
        };
        document.getElementById('sort-client').onclick = function () {
            if (sortBy === 'client_name') sortDir = sortDir === 'ASC' ? 'DESC' : 'ASC'; else { sortBy = 'client_name'; sortDir = 'ASC'; }
            updateSortIcons();
            renderTable();
        };
        document.getElementById('sort-status').onclick = function () {
            if (sortBy === 'status') sortDir = sortDir === 'ASC' ? 'DESC' : 'ASC'; else { sortBy = 'status'; sortDir = 'ASC'; }
            updateSortIcons();
            renderTable();
        };
        document.getElementById('sort-date').onclick = function () {
            if (sortBy === 'created_at') sortDir = sortDir === 'ASC' ? 'DESC' : 'ASC'; else { sortBy = 'created_at'; sortDir = 'DESC'; }
            updateSortIcons();
            renderTable();
        };
        updateSortIcons();

        const refreshBtn = document.getElementById('refresh-issues-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const spinner = document.getElementById('refresh-spinner');
                spinner.classList.remove('d-none');
                refreshBtn.setAttribute('disabled', 'disabled');
                await fetchIssues();
                spinner.classList.add('d-none');
                refreshBtn.removeAttribute('disabled');
                if (typeof showBootstrapToast === 'function') {
                    showBootstrapToast('Lista aggiornata!', 'Successo', 'success');
                }
            });
        }
        document.getElementById('issues-filters-form').onsubmit = function (e) {
            e.preventDefault();
            applyFilters();
        };
        // Bottone reset filtri
        const resetBtn = document.getElementById('reset-filters-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function (e) {
                e.preventDefault();
                resetFilters();
            });
        }
        fetchIssues();
    }

    /**
     * Funzione di unmount: placeholder per eventuale cleanup futuro.
     */
    function unmount() {
        // Eventuali cleanup futuri
    }

    /**
     * Funzione globale per mostrare il modal dettagli/modifica di una segnalazione.
     * Aggiorna la segnalazione lato backend e localmente.
     * @param {number} issueId - ID della segnalazione
     */
    window.viewIssueDetails = function (issueId) {
        const issue = issues.find(i => i.id_issue == issueId);
        if (!issue) return;
        showIssueModal(issue, async (updated) => {
            // Aggiorna lato backend
            await updateIssue(updated);
            // Aggiorna localmente
            const idx = issues.findIndex(i => i.id_issue == updated.id_issue);
            if (idx !== -1) {
                issues[idx] = { ...issues[idx], ...updated };
                // Aggiorna anche in filteredIssues se necessario
                const fidx = filteredIssues.findIndex(i => i.id_issue == updated.id_issue);
                if (fidx !== -1) filteredIssues[fidx] = { ...filteredIssues[fidx], ...updated };
                renderTable();
            }
        });
    };

    // Ritorna i metodi principali del componente
    return {
        render: () => pageElement,
        mount,
        unmount
    };
}
