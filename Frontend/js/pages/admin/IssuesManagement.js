// Scheletro base per la pagina Gestione Segnalazioni (Issues)
export async function loadIssuesManagementPage() {
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
                    <button class="btn btn-outline-primary" id="refresh-issues-btn"><i class="bi bi-arrow-clockwise"></i> Aggiorna lista</button>
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
                                            <th>Titolo</th>
                                            <th>Cliente</th>
                                            <th>Stato</th>
                                            <th>Data</th>
                                            <th>Azioni</th>
                                        </tr>
                                    </thead>
                                    <tbody id="issues-table-body">
                                        <tr><td colspan="6" class="text-center text-muted py-5">Nessuna segnalazione trovata.</td></tr>
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

    // Stato locale
    let issues = [];
    let filteredIssues = [];
    let totalIssues = 0;
    let currentPage = 1;
    const pageSize = 10;

    // Carica segnalazioni dal server
    async function fetchIssues(page = 1) {
        try {
            const res = await import('../../../api/issues.js');
            const data = await res.getIssues(page, pageSize);
            issues = data.issues || [];
            filteredIssues = [...issues];
            totalIssues = data.total || 0;
            renderTable();
            renderPagination(Math.ceil(filteredIssues.length / pageSize) || 1);
        } catch (e) {
            issues = [];
            filteredIssues = [];
            totalIssues = 0;
            renderTable();
            renderPagination(1);
        }
    }

    // Applica i filtri (frontend)
    function applyFilters() {
        const form = document.getElementById('issues-filters-form');
        const title = form.title.value.trim().toLowerCase();
        const status = form.status.value;
        const date = form.date.value;
        filteredIssues = issues.filter(issue => {
            let ok = true;
            if (title && !(issue.title || '').toLowerCase().includes(title)) ok = false;
            if (status && issue.status !== status) ok = false;
            if (date && issue.created_at && issue.created_at.split('T')[0] !== date) ok = false;
            return ok;
        });
        currentPage = 1;
        renderTable();
        renderPagination(Math.ceil(filteredIssues.length / pageSize) || 1);
    }

    // Reset filtri
    function resetFilters() {
        const form = document.getElementById('issues-filters-form');
        form.reset();
        filteredIssues = [...issues];
        currentPage = 1;
        renderTable();
        renderPagination(Math.ceil(filteredIssues.length / pageSize) || 1);
    }

    // Renderizza la tabella
    function renderTable() {
        const tableBody = document.getElementById('issues-table-body');
        tableBody.innerHTML = '';
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        const pageIssues = filteredIssues.slice(start, end);
        if (pageIssues.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-5">Nessuna segnalazione trovata.</td></tr>`;
        } else {
            pageIssues.forEach(issue => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${issue.id_issue}</td>
                        <td>${issue.title}</td>
                        <td>${issue.client_name || '-'}</td>
                        <td>${renderStatusBadge(issue.status)}</td>
                        <td>${issue.created_at ? issue.created_at.split('T')[0] : '-'}</td>
                        <td></td>
                    </tr>`;
            });
        }
    }

    // Badge stato
    function renderStatusBadge(status) {
        switch (status) {
            case 'open': return '<span class="badge bg-warning">Aperta</span>';
            case 'closed': return '<span class="badge bg-success">Chiusa</span>';
            default: return `<span class="badge bg-secondary">${status}</span>`;
        }
    }

    // Renderizza la paginazione
    function renderPagination(totalPages) {
        const paginationContainer = document.getElementById('pagination-container');
        paginationContainer.innerHTML = '';
        if (totalPages > 1) {
            const prevButton = document.createElement('button');
            prevButton.className = 'btn btn-secondary me-2';
            prevButton.textContent = 'Precedente';
            prevButton.disabled = currentPage === 1;
            prevButton.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderTable();
                    renderPagination(totalPages);
                }
            });
            paginationContainer.appendChild(prevButton);
            const nextButton = document.createElement('button');
            nextButton.className = 'btn btn-secondary';
            nextButton.textContent = 'Successivo';
            nextButton.disabled = currentPage === totalPages;
            nextButton.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    renderTable();
                    renderPagination(totalPages);
                }
            });
            paginationContainer.appendChild(nextButton);
        }
    }

    // Eventi
    function mount() {
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.history.back();
            });
        }
        const refreshBtn = document.getElementById('refresh-issues-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', (e) => {
                e.preventDefault();
                fetchIssues();
            });
        }
        document.getElementById('issues-filters-form').onsubmit = function(e) {
            e.preventDefault();
            applyFilters();
        };
        // Bottone reset filtri
        const resetBtn = document.getElementById('reset-filters-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function(e) {
                e.preventDefault();
                resetFilters();
            });
        }
        fetchIssues();
    }

    function unmount() {
        // Eventuali cleanup futuri
    }

    return {
        render: () => pageElement,
        mount,
        unmount
    };
}
