import { showBootstrapToast } from '../../components/Toast.js';
import UsersAPI from '../../../api/users.js';

/**
 * Carica la pagina di gestione utenti per l'amministratore.
 * Inizializza la UI, gestisce filtri, tabella utenti, paginazione, modali e azioni su utenti e artigiani.
 * @returns {Object} - Oggetto con i metodi del componente (render, mount, unmount)
 */
export async function loadUsersManagementPage() {
    // CSS mobile responsive (iniettato una sola volta)
    if (!document.getElementById('users-management-mobile-style')) {
        const style = document.createElement('style');
        style.id = 'users-management-mobile-style';
        style.innerHTML = `
        @media (max-width: 767.98px) {
          .admin-dashboard-page .mobile-btns {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 1rem;
          }
          .admin-dashboard-page .mobile-btns button {
            width: 100%;
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
          .admin-dashboard-page .card-title.d-mobile-hide {
            display: none !important;
          }
          .admin-dashboard-page #filters-card { display: none; }
          .admin-dashboard-page #filters-card.mobile-visible { display: block; margin-bottom: 1rem; }
          .admin-dashboard-page .table thead {
            display: table-header-group;
          }
          .admin-dashboard-page .table th, .admin-dashboard-page .table td {
            display: table-cell;
          }
          .admin-dashboard-page .table th.d-mobile-none, .admin-dashboard-page .table td.d-mobile-none {
            display: none !important;
          }
          .admin-dashboard-page .table td, .admin-dashboard-page .table th {
            padding: 0.75rem 0.5rem;
          }
          .admin-dashboard-page #pagination-container {
            justify-content: center !important;
            margin-top: 1rem;
          }
          .admin-dashboard-page #pagination-container ul.pagination {
            justify-content: center !important;
            margin-top: 1rem;
          }
          .admin-dashboard-page #pagination-container li.page-item {
            width: 48%;
            margin: 0 1%;
            font-size: 1.1rem;
          }
        }
        `;
        document.head.appendChild(style);
    }

    // Crea l'elemento principale della pagina
    const pageElement = document.createElement('div');
    pageElement.className = 'admin-dashboard-page';

    // Imposta l'HTML della pagina, inclusi header, filtri, tabella, modali
    pageElement.innerHTML = `
        <div class="container mt-4">
            <div class="row align-items-center">
                <div class="col-12 text-center">
                    <h1 class="display-5 fw-bold ">Gestione Utenti</h1>
                </div>
            </div>
            <div class="row mb-4 align-items-center d-none d-md-flex">
                <div class="col-6 d-flex align-items-center">
                    <button class="btn btn-outline-secondary" id="back-btn"><i class="bi bi-arrow-left"></i> Torna indietro</button>
                </div>
                <div class="col-6 d-flex justify-content-end">
                    <button id="add-user-btn" class="btn btn-success">Aggiungi Utente</button>
                </div>
            </div>
            <div class="row d-flex d-md-none">
                <div class="col-12 mobile-btns">
                    <button class="btn btn-outline-secondary" id="back-btn-mobile"><i class="bi bi-arrow-left"></i> Torna indietro</button>
                    <button class="btn btn-success" id="add-user-btn-mobile">Aggiungi Utente</button>
                    <button class="btn btn-primary" id="toggle-filters-mobile">Filtri</button>
                </div>
            </div>
            <div class="row align-items-start">
                <div class="col-md-4">
                    <div class="card mb-4" id="filters-card">
                        <div class="card-body">
                            <h5 class="card-title">Filtri</h5>
                            <form id="filters-form">
                                <div class="form-group mb-3"> 
                                    <label for="filter-name">Nome</label>
                                    <input type="text" id="filter-name" name="filter-name" class="form-control" placeholder="Inserisci il nome">
                                </div>
                                <div class="form-group mb-3"> 
                                    <label for="filter-email">Email</label>
                                    <input type="email" id="filter-email" name="filter-email" class="form-control" placeholder="Inserisci l'email">
                                </div>
                                <div class="form-group mb-3"> 
                                    <label for="filter-role">Ruolo</label>
                                    <select id="filter-role" name="filter-role" class="form-control">
                                        <option value="">Tutti</option>
                                        <option value="admin">Admin</option>
                                        <option value="artigiano">Artigiano</option>
                                        <option value="user">Utente</option>
                                    </select>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <button type="button" id="apply-filters-btn" class="btn btn-primary">Applica Filtri</button>
                                    <button type="button" id="reset-filters-btn" class="btn btn-secondary">Reset Filtri</button>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div class="card" id="pending-artisans-card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <span>Artigiani da approvare</span>
                        </div>
                        <div class="card-body p-0 table-responsive">
                            <table class="table mb-0">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Data registrazione</th>
                                        <th>Azione</th>
                                    </tr>
                                </thead>
                                <tbody id="pending-artisans-table-body">
                                    <tr><td colspan="4" class="text-center">Caricamento...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-md-8 mb-5">
                    <div class="card h-100">
                        <div class="card-body d-flex flex-column">
                            <div class="table-responsive flex-grow-1">
                                <table class="table mb-0"> 
                                    <thead>
                                        <tr>
                                            <th id="sort-name-col" style="cursor:pointer">Nome <span id="sort-name-icon"></span></th>
                                            <th id="sort-email-col" class="d-mobile-none">Email</th>
                                            <th id="sort-role-col"> Ruolo </th>
                                            <th id="sort-created-col" class="d-mobile-none" style="cursor:pointer">Data creazione <span id="sort-created-icon"></span></th>
                                            <th>Azioni</th>
                                        </tr>
                                    </thead>
                                    <tbody id="users-table-body">
                                       
                                    </tbody>
                                </table>
                            </div>
                            <div id="pagination-container" class="mt-3 d-flex justify-content-center"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    // Add modal HTML and event listener for the 'Aggiungi Utente' button
    pageElement.innerHTML += `
        <div class="modal fade" id="addUserModal" tabindex="-1" aria-labelledby="addUserModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="addUserModalLabel">Aggiungi Nuovo Utente</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="add-user-form">
                            <div class="mb-3">
                                <label for="user-name" class="form-label">Nome</label>
                                <input type="text" class="form-control" id="user-name" required>
                            </div>
                            <div class="mb-3">
                                <label for="user-email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="user-email" required>
                            </div>
                            <div class="mb-3">
                                <label for="user-password" class="form-label">Password</label>
                                <input type="password" class="form-control" id="user-password" required>
                            </div>
                            <div class="mb-3">
                                <label for="user-role" class="form-label">Ruolo</label>
                                <select class="form-select" id="user-role" required>
                                    <option value="admin">Admin</option>
                                    <option value="artisan">Artigiano</option>
                                    <option value="client">Utente</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                        <button type="button" id="save-user-btn" class="btn btn-primary">Salva</button>
                    </div>
                </div>
            </div>
        </div>`;

    // Modal per modifica utente
    pageElement.innerHTML += `
        <div class="modal fade" id="editUserModal" tabindex="-1" aria-labelledby="editUserModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="editUserModalLabel">Modifica Utente</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="edit-user-form">
                            <input type="hidden" id="edit-user-id">
                            <div class="mb-3">
                                <label for="edit-user-name" class="form-label">Nome</label>
                                <input type="text" class="form-control" id="edit-user-name" required>
                            </div>
                            <div class="mb-3">
                                <label for="edit-user-email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="edit-user-email" required>
                            </div>
                            <div class="mb-3">
                                <label for="edit-user-role" class="form-label">Ruolo</label>
                                <select class="form-select" id="edit-user-role" required>
                                    <option value="admin">Admin</option>
                                    <option value="artisan">Artigiano</option>
                                    <option value="client">Utente</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                        <button type="button" id="save-edit-user-btn" class="btn btn-primary">Salva Modifiche</button>
                    </div>
                </div>
            </div>
        </div>`;

    // Modal per conferma eliminazione utente
    pageElement.innerHTML += `
        <div class="modal fade" id="deleteUserModal" tabindex="-1" aria-labelledby="deleteUserModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="deleteUserModalLabel">Conferma eliminazione</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        Sei sicuro di voler eliminare questo utente?
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                        <button type="button" id="confirm-delete-user-btn" class="btn btn-danger">Elimina</button>
                    </div>
                </div>
            </div>
        </div>`;

    // Variabile per tenere traccia dell'utente da eliminare
    let userIdToDelete = null;

    // Stato filtri e paginazione
    let currentFilters = {
        name: '',
        email: '',
        role: '',
        page: 1,
        limit: 10,
        orderBy: 'created_at',
        orderDir: 'ASC'
    };

    /**
     * Restituisce il badge HTML per il ruolo dell'utente.
     * @param {string} role - Ruolo utente
     * @returns {string} - HTML del badge
     */
    function getRoleBadge(role) {
        let badgeClass = '';
        switch (role) {
            case 'admin':
                badgeClass = 'badge bg-danger';
                return `<span class="${badgeClass}">Admin</span>`;
            case 'artisan':
                badgeClass = 'badge bg-warning';
                return `<span class="${badgeClass}">Artigiano</span>`;
            case 'client':
                badgeClass = 'badge bg-primary';
                return `<span class="${badgeClass}">Cliente</span>`;
            default:
                badgeClass = 'badge bg-primary';
                return `<span class="${badgeClass}">Cliente</span>`;
        }
    }

    /**
     * Carica e popola la tabella degli utenti in base ai filtri correnti.
     * Gestisce anche la paginazione e le azioni di modifica/eliminazione.
     * @param {Object} params - Parametri opzionali per aggiornare i filtri/pagina
     */
    async function loadUsersTable(params = {}) {
        try {
            // Unisci i parametri ricevuti con quelli correnti
            currentFilters = { ...currentFilters, ...params };
            // Per sicurezza, estrai esplicitamente i parametri che ci interessano
            const page = parseInt(currentFilters.page) || 1;
            const name = currentFilters.name || '';
            const email = currentFilters.email || '';
            const role = currentFilters.role || '';
            const limit = currentFilters.limit || 10;
            const orderBy = currentFilters.orderBy || 'created_at';
            const orderDir = currentFilters.orderDir || 'ASC';
            
            // Crea un oggetto parametri pulito
            const apiParams = {
                page: page,
                pageNumber: page,
                currentPage: page,
                pageNum: page,
                name,
                email,
                role,
                limit,
                orderBy,
                orderDir
            };
            
            // Chiamata API diretta senza usare state complicati
            const response = await UsersAPI.getUsers(apiParams);
            
            // Ottieni gli utenti dalla risposta
            const users = response.users || [];
            const pagination = response.pagination || {};

            // IMPORTANTE: trova il table body
            const tableBody = document.getElementById('users-table-body');
            if (!tableBody) {
                return;
            }
            
            // IMPORTANTE: Svuota completamente la tabella prima di riempirla
            tableBody.innerHTML = '';
            
            // Messaggio se non ci sono utenti
            if (!users || users.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nessun utente trovato</td></tr>';
                return;
            }
            
            // Renderizza ogni utente ricevuto
            users.forEach((user, index) => {
                // Crea una nuova riga per questo utente
                const row = document.createElement('tr');
                
                // Variante mobile o desktop
                const isMobile = window.innerWidth < 768;
                
                if (isMobile) {
                    // Versione mobile: solo nome, ruolo e azioni
                    row.innerHTML = `
                        <td>${user.name || 'N/D'}</td>
                        <td>${getRoleBadge(user.role)}</td>
                        <td>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="bi bi-three-dots"></i>
                                </button>
                                <ul class="dropdown-menu">
                                    <li><button class="dropdown-item edit-user-btn" data-user-id="${user.id}">Modifica</button></li>
                                    <li><button class="dropdown-item text-danger delete-user-btn" data-user-id="${user.id}">Elimina</button></li>
                                </ul>
                            </div>
                        </td>
                    `;
                } else {
                    // Versione desktop: tutti i campi
                    row.innerHTML = `
                        <td>${user.name || 'N/D'}</td>
                        <td class="d-mobile-none">${user.email || 'N/D'}</td>
                        <td>${getRoleBadge(user.role)}</td>
                        <td class="d-mobile-none">${user.created_at ? formatDateIT(user.created_at) : 'N/D'}</td>
                        <td>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="bi bi-three-dots"></i>
                                </button>
                                <ul class="dropdown-menu">
                                    <li><button class="dropdown-item edit-user-btn" data-user-id="${user.id}">Modifica</button></li>
                                    <li><button class="dropdown-item text-danger delete-user-btn" data-user-id="${user.id}">Elimina</button></li>
                                </ul>
                            </div>
                        </td>
                    `;
                }
                
                // IMPORTANTE: Aggiungi la riga alla tabella
                tableBody.appendChild(row);
            });
            
            // Aggiungi event listener alle azioni
            document.querySelectorAll('.edit-user-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const userId = this.getAttribute('data-user-id');
                    editUser(userId);
                });
            });
            
            document.querySelectorAll('.delete-user-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const userId = this.getAttribute('data-user-id');
                    deleteUser(userId);
                });
            });
            
            // Renderizza la paginazione
            createPagination(pagination);
            
        } catch (error) {
            if (error.message && error.message.includes('401')) {
                window.history.back();
            } else {
                // Notifica utente
                showBootstrapToast('Errore nel caricamento degli utenti', 'Errore', 'danger');
                
                // Pulisci tabella con messaggio di errore
                const tableBody = document.getElementById('users-table-body');
                if (tableBody) {
                    tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Errore nel caricamento degli utenti</td></tr>';
                }
            }
        }
    }

    /**
     * Renderizza la paginazione in base al numero totale di pagine e alla pagina corrente.
     * Gestisce i bottoni di navigazione e il cambio pagina.
     * @param {Object} pagination - Oggetto con info paginazione
     */
    function createPagination(pagination) {
        const paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) return;
        
        paginationContainer.innerHTML = '';
        
        const totalPages = pagination.totalPages || pagination.total_pages || 1;
        const currentPage = parseInt(pagination.currentPage || pagination.current_page || 1);
        
        if (totalPages <= 1) return;
        
        // APPROCCIO ULTRASEMPLIFICATO SENZA ELEMENTI HTML COMPLESSI
        // Creiamo semplici bottoni senza alcun collegamento al router
        
        // Container per i bottoni
        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-group';
        
        // Bottone Precedente
        if (currentPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.type = 'button';
            prevBtn.className = 'btn btn-outline-primary';
            prevBtn.textContent = 'Precedente';
            prevBtn.onclick = function() {
                loadUsersTable({ ...currentFilters, page: currentPage - 1 });
            };
            btnGroup.appendChild(prevBtn);
        }
        
        // Bottoni pagina (massimo 5)
        const maxButtons = 5;
        const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        const endPage = Math.min(totalPages, startPage + maxButtons - 1);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.type = 'button';
            pageBtn.className = `btn ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'}`;
            pageBtn.textContent = i;
            
            // Solo per le pagine diverse da quella corrente
            if (i !== currentPage) {
                pageBtn.onclick = function() {
                    loadUsersTable({ ...currentFilters, page: i });
                };
            }
            
            btnGroup.appendChild(pageBtn);
        }
        
        // Bottone Successivo
        if (currentPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.type = 'button';
            nextBtn.className = 'btn btn-outline-primary';
            nextBtn.textContent = 'Successivo';
            nextBtn.onclick = function() {
                loadUsersTable({ ...currentFilters, page: currentPage + 1 });
            };
            btnGroup.appendChild(nextBtn);
        }
        
        // Aggiungiamo i bottoni al container
        paginationContainer.appendChild(btnGroup);
    }

    /**
     * Mostra il modal di modifica utente e popola i campi con i dati correnti.
     * @param {number} userId - ID utente da modificare
     */
    window.editUser = async function (userId) {
        try {
            const user = await UsersAPI.getUser(userId);
            document.getElementById('edit-user-id').value = user.id;
            document.getElementById('edit-user-name').value = user.name;
            document.getElementById('edit-user-email').value = user.email;
            document.getElementById('edit-user-role').value = user.role;
            const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
            editUserModal.show();
        } catch (error) {
            showBootstrapToast('Errore nel caricamento dati utente', 'Errore', 'danger');
        }
    };

    /**
     * Mostra il modal di conferma eliminazione utente.
     * @param {number} userId - ID utente da eliminare
     */
    window.deleteUser = function (userId) {
        userIdToDelete = userId;
        const deleteUserModal = new bootstrap.Modal(document.getElementById('deleteUserModal'));
        deleteUserModal.show();
    };

    // In un'implementazione reale, qui caricheremmo i dati dal backend
    async function loadDashboardData() {
        // Simulazione caricamento dati
        showBootstrapToast('Dashboard amministratore caricata con successo', 'Info', 'info');
    }

    /**
     * Carica e popola la tabella degli artigiani da approvare.
     */
    async function loadPendingArtisansTable() {
        const tableBody = document.getElementById('pending-artisans-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Caricamento...</td></tr>';
        try {
            const response = await UsersAPI.getPendingArtisans({ limit: 5 });
            const users = response.users || [];
            if (users.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Nessun artigiano da approvare</td></tr>';
                return;
            }
            tableBody.innerHTML = '';
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.name || 'N/D'}</td>
                    <td>${user.created_at ? formatDateIT(user.created_at) : 'N/D'}</td>
                    <td><button class="btn btn-sm btn-outline-success approve-artisan-btn" data-user-id="${user.id}">Approva</button></td>
                `;
                tableBody.appendChild(row);
            });
            // Event listener per i bottoni Approva
            document.querySelectorAll('.approve-artisan-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const userId = this.getAttribute('data-user-id');
                    // Recupera info utente
                    let userInfo = users.find(u => String(u.id) === String(userId));
                    if (!userInfo) {
                        showBootstrapToast('Utente non trovato', 'Errore', 'danger');
                        return;
                    }
                    // Crea modal dinamico
                    let modalHtml = `
                    <div class="modal fade" id="approveArtisanModal" tabindex="-1" aria-labelledby="approveArtisanModalLabel" aria-hidden="true">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="approveArtisanModalLabel">Approva Artigiano</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    <p><b>Nome:</b> ${userInfo.name || 'N/D'}</p>
                                    <p><b>Email:</b> ${userInfo.email || 'N/D'}</p>
                                    <p><b>Data registrazione:</b> ${userInfo.created_at ? formatDateIT(userInfo.created_at) : 'N/D'}</p>
                                    <p>Vuoi davvero approvare questo utente come artigiano?</p>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                                    <button type="button" class="btn btn-success" id="confirm-approve-artisan-btn">Approva</button>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    // Rimuovi eventuale modal precedente
                    let oldModal = document.getElementById('approveArtisanModal');
                    if (oldModal) oldModal.remove();
                    // Inserisci il modal nel DOM
                    document.body.insertAdjacentHTML('beforeend', modalHtml);
                    const approveModal = new bootstrap.Modal(document.getElementById('approveArtisanModal'));
                    approveModal.show();
                    // Gestisci click su Approva
                    document.getElementById('confirm-approve-artisan-btn').onclick = async () => {
                        try {
                            await UsersAPI.approveArtisan(userId);
                            showBootstrapToast('Utente approvato con successo!', 'Successo', 'success');
                            approveModal.hide();
                            await loadPendingArtisansTable();
                            await loadUsersTable({ page: 1 }); // aggiorna anche la tabella utenti
                        } catch (err) {
                            showBootstrapToast('Errore durante l\'approvazione.', 'Errore', 'danger');
                        }
                    };
                });
            });
        } catch (e) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Errore nel caricamento</td></tr>';
        }
    }

    /**
     * Inizializza gli event listener principali della pagina (filtri, bottoni, modali, ordinamento, ecc).
     */
    function mount() {
        // Invece carico direttamente la tabella una sola volta all'avvio
        currentFilters.page = 1;
        loadUsersTable(currentFilters);
        
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.history.back();
            });
        }
        const backBtnMobile = document.getElementById('back-btn-mobile');
        if (backBtnMobile) {
            backBtnMobile.addEventListener('click', () => window.history.back());
        }
        // Modifica per utilizzare onclick invece di submit per il bottone "Applica Filtri"
        document.getElementById('apply-filters-btn').onclick = async () => {
            const filtersForm = document.getElementById('filters-form');
            const formData = new FormData(filtersForm);
            let rawrole = "";
            switch (formData.get('filter-role')) {
                case 'admin':
                    rawrole = 'admin';
                    break;
                case 'artigiano':
                    rawrole = 'artisan';
                    break;
                case 'user':
                    rawrole = 'client';
                    break;
                default:
                    break;
            }
            currentFilters = {
                ...currentFilters,
                name: formData.get('filter-name') || '',
                email: formData.get('filter-email') || '',
                role: rawrole || '',
                page: 1 // resetta sempre alla prima pagina
            };
            await loadUsersTable(currentFilters);
        };

        // Modifica per utilizzare onclick per il bottone "Reset Filtri"
        document.getElementById('reset-filters-btn').onclick = async () => {
            document.getElementById('filters-form').reset();
            currentFilters = {
                ...currentFilters,
                name: '',
                email: '',
                role: '',
                page: 1
            };
            await loadUsersTable(currentFilters);
        };

        // Add event listener for the 'Aggiungi Utente' button
        document.getElementById('add-user-btn').addEventListener('click', () => {
            document.getElementById('add-user-form').reset(); // Svuota i campi del form
            const addUserModal = new bootstrap.Modal(document.getElementById('addUserModal'));
            addUserModal.show();
        });

        // Add event listener for the 'Salva' button in the modal
        document.getElementById('save-user-btn').addEventListener('click', async () => {
            const name = document.getElementById('user-name').value;
            const email = document.getElementById('user-email').value;
            const password = document.getElementById('user-password').value;
            const role = document.getElementById('user-role').value;

            if (!name || !email || !password || !role) {
                showBootstrapToast('Tutti i campi sono obbligatori!', 'Errore', 'danger');
                return;
            }

            try {
                await UsersAPI.createUser({ name, email, password, role });
                showBootstrapToast('Utente aggiunto con successo!', 'Successo', 'success');
                const addUserModal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
                if (addUserModal) addUserModal.hide(); // Chiudi il modal solo se l'istanza esiste
                await loadUsersTable();
            } catch (error) {
                showBootstrapToast('Errore durante l\'aggiunta dell\'utente.', 'Errore', 'danger');
            }
        });

        // Add event listener for the 'Salva Modifiche' button in the edit modal
        document.getElementById('save-edit-user-btn').addEventListener('click', async () => {
            const id = document.getElementById('edit-user-id').value;
            const name = document.getElementById('edit-user-name').value;
            const email = document.getElementById('edit-user-email').value;
            const role = document.getElementById('edit-user-role').value;
            if (!name || !email || !role) {
                showBootstrapToast('Tutti i campi sono obbligatori!', 'Errore', 'danger');
                return;
            }
            try {
                await UsersAPI.updateUser(id, { name, email, role });
                showBootstrapToast('Utente modificato con successo!', 'Successo', 'success');
                const editUserModal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
                editUserModal.hide();
                await loadUsersTable();
            } catch (error) {
                showBootstrapToast('Errore durante la modifica utente.', 'Errore', 'danger');
            }
        });

        // Add event listener for the 'Conferma Eliminazione' button in the delete modal
        document.getElementById('confirm-delete-user-btn').addEventListener('click', async () => {
            if (!userIdToDelete) return;
            try {
                await UsersAPI.deleteUser(userIdToDelete);
                showBootstrapToast('Utente eliminato con successo!', 'Successo', 'success');
                const deleteUserModal = bootstrap.Modal.getInstance(document.getElementById('deleteUserModal'));
                deleteUserModal.hide();
                userIdToDelete = null;
                await loadUsersTable();
            } catch (error) {
                showBootstrapToast('Errore durante l\'eliminazione utente.', 'Errore', 'danger');
            }
        });

        // Event listener per ordinamento colonna Nome
        let sortNameOrder = 'asc';
        let sortCreatedOrder = 'asc';
        const sortNameCol = document.getElementById('sort-name-col');
        const sortNameIcon = document.getElementById('sort-name-icon');
        function updateSortNameIcon() {
            sortNameIcon.innerHTML = sortNameOrder === 'asc' ? '▲' : '▼';
        }
        updateSortNameIcon();
        sortNameCol.addEventListener('click', async () => {
            sortNameOrder = sortNameOrder === 'asc' ? 'desc' : 'asc';
            updateSortNameIcon();
            const params = {
                orderBy: 'name' || '',
                orderDir: sortNameOrder,
            };
            await loadUsersTable(params);
        });

        const sortCreatedCol = document.getElementById('sort-created-col');
        const sortCreatedIcon = document.getElementById('sort-created-icon');
        function updateSortCreatedIcon() {
            sortCreatedIcon.innerHTML = sortCreatedOrder === 'asc' ? '▲' : '▼';
        }
        updateSortCreatedIcon();
        sortCreatedCol.addEventListener('click', async () => {
            sortCreatedOrder = sortCreatedOrder === 'asc' ? 'desc' : 'asc';
            updateSortCreatedIcon();
            const params = {
                orderBy: 'created_at' || '',
                orderDir: sortCreatedOrder,
            };
            await loadUsersTable(params);
        });

        const addUserBtnMobile = document.getElementById('add-user-btn-mobile');
        if (addUserBtnMobile) {
            addUserBtnMobile.addEventListener('click', () => {
                document.getElementById('add-user-form').reset(); // Svuota i campi del form
                const addUserModal = new bootstrap.Modal(document.getElementById('addUserModal'));
                addUserModal.show();
            });
        }
        const toggleFiltersMobile = document.getElementById('toggle-filters-mobile');
        if (toggleFiltersMobile) {
            toggleFiltersMobile.addEventListener('click', () => {
                const filtersCard = document.getElementById('filters-card');
                filtersCard.classList.toggle('mobile-visible');
            });
        }

        loadPendingArtisansTable();
    }

    /**
     * Rimuove gli event listener (placeholder per eventuale cleanup futuro).
     */
    function unmount() {
        // Nessun event listener da rimuovere
    }

    // Ritorna i metodi principali del componente
    return {
        render: () => pageElement,
        mount,
        unmount
    };
}