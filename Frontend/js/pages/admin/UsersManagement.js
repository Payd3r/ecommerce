import { authService } from '../../services/authService.js';
import { toast } from '../../components/Toast.js';
import UsersAPI from '../../../api/users.js';

/**
 * Carica la dashboard dell'amministratore
 * @returns {Object} - Oggetto con i metodi del componente
 */
export async function loadUsersManagementPage() {
    // Crea l'elemento principale della pagina
    const pageElement = document.createElement('div');
    pageElement.className = 'admin-dashboard-page';

    // Ottiene i dati dell'utente
    const user = authService.getUser();

    // Stato per l'ordinamento
    let sortBy = 'name';
    let sortOrder = 'asc';

    // Modifica il layout del titolo e aggiungi un pulsante per aggiungere utenti sulla destra
    pageElement.innerHTML = `
        <div class="container mt-4">
            <div class="row mb-4">
                <div class="col d-flex justify-content-between align-items-center">
                    <h1 class="text-left">Gestione Utenti</h1>
                    <button id="add-user-btn" class="btn btn-success">Aggiungi Utente</button>
                </div>
            </div>

            <div class="row">
                <!-- Colonna per i filtri -->
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Filtri</h5>
                            <form id="filters-form">
                                <div class="form-group">
                                    <label for="filter-name">Nome</label>
                                    <input type="text" id="filter-name" name="filter-name" class="form-control" placeholder="Inserisci il nome">
                                </div>
                                <div class="form-group">
                                    <label for="filter-email">Email</label>
                                    <input type="email" id="filter-email" name="filter-email" class="form-control" placeholder="Inserisci l'email">
                                </div>
                                <div class="form-group">
                                    <label for="filter-role">Ruolo</label>
                                    <select id="filter-role" name="filter-role" class="form-control mb-3">
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
                </div>

                <!-- Colonna per la tabella degli utenti -->
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Utenti Registrati</h5>
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th id="sort-name-col" style="cursor:pointer">Nome <span id="sort-name-icon"></span></th>
                                        <th>Email</th>
                                        <th>Ruolo</th>
                                        <th>Data Creazione</th>
                                        <th>Azioni</th>
                                    </tr>
                                </thead>
                                <tbody id="users-table-body">
                                   
                                </tbody>
                            </table>
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

    // Funzione per generare un badge colorato in base al ruolo
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

    // Aggiungi i bottoni per la paginazione sotto la tabella
    function renderPagination(pagination) {
        const paginationContainer = document.getElementById('pagination-container');
        paginationContainer.innerHTML = '';

        if (pagination.totalPages > 1) {
            const prevButton = document.createElement('button');
            prevButton.className = 'btn btn-secondary me-2';
            prevButton.textContent = 'Precedente';
            prevButton.disabled = !pagination.hasPrevPage;
            prevButton.addEventListener('click', () => {
                loadUsersTable({ page: pagination.currentPage - 1 });
            });
            paginationContainer.appendChild(prevButton);

            const nextButton = document.createElement('button');
            nextButton.className = 'btn btn-secondary';
            nextButton.textContent = 'Successivo';
            nextButton.disabled = !pagination.hasNextPage;
            nextButton.addEventListener('click', () => {
                loadUsersTable({ page: pagination.currentPage + 1 });
            });
            paginationContainer.appendChild(nextButton);
        }
    }

    // Funzione per caricare e popolare la tabella degli utenti
    async function loadUsersTable(params = {}) {
        try {
            // Se i parametri sono passati (ad esempio da Applica Filtri), usali, altrimenti leggi dal form
            let name = params.name !== undefined ? params.name : '';
            let email = params.email !== undefined ? params.email : '';
            let role = params.role !== undefined ? params.role : '';
            let page = params.page !== undefined ? params.page : 1;
            let limit = params.limit !== undefined ? params.limit : 10;
            let orderBy = params.orderBy !== undefined ? params.orderBy : sortBy;
            let orderDir = params.orderDir !== undefined ? params.orderDir : sortOrder;

            // Prepara i parametri per la chiamata API secondo UsersAPI.getUsers
            const apiParams = {
                page,
                role,
                name,
                email,
                limit,
                orderBy,
                orderDir
            };

            const response = await UsersAPI.getUsers(apiParams);

            const users = response.users || [];
            const pagination = response.pagination || {};

            const tableBody = document.getElementById('users-table-body');
            tableBody.innerHTML = '';

            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${getRoleBadge(user.role)}</td>
                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-secondary" type="button" id="dropdownMenuButton-${user.id}" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-three-dots"></i>
                            </button>
                            <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton-${user.id}">
                                <li><button class="dropdown-item" onclick="editUser(${user.id})">Modifica</button></li>
                                <li><button class="dropdown-item text-danger" onclick="deleteUser(${user.id})">Elimina</button></li>
                            </ul>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            renderPagination(pagination);
        } catch (error) {
            if (error.message && error.message.includes('401')) {
                console.error('Errore di autenticazione. Reindirizzamento alla pagina di login.');
                window.location.href = '/login';
            } else {
                console.error('Errore durante il caricamento degli utenti:', error);
            }
        }
    }

    // Rendi le funzioni editUser e deleteUser accessibili globalmente
    window.editUser = function (userId) {
        console.log(`Modifica utente con ID: ${userId}`);
        // Implementa la logica per modificare l'utente
    };

    window.deleteUser = function (userId) {
        console.log(`Elimina utente con ID: ${userId}`);
        // Implementa la logica per eliminare l'utente
    };

    // In un'implementazione reale, qui caricheremmo i dati dal backend
    async function loadDashboardData() {
        // Simulazione caricamento dati
        toast.info('Dashboard amministratore caricata con successo');
        await loadUsersTable();
    }

    /**
     * Inizializza gli event listener
     */
    function mount() {
        loadDashboardData();

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
            const params = {
                name: formData.get('filter-name') || '',
                email: formData.get('filter-email') || '',
                role: rawrole || '',
            };
            await loadUsersTable(params);
        };

        // Modifica per utilizzare onclick per il bottone "Reset Filtri"
        document.getElementById('reset-filters-btn').onclick = async () => {
            document.getElementById('filters-form').reset();
            await loadUsersTable();
        };

        // Add event listener for the 'Aggiungi Utente' button
        document.getElementById('add-user-btn').addEventListener('click', () => {
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
                toast.error('Tutti i campi sono obbligatori!');
                return;
            }

            try {
                await UsersAPI.createUser({ name, email, password, role });
                toast.success('Utente aggiunto con successo!');
                const addUserModal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
                addUserModal.hide();
                await loadUsersTable();
            } catch (error) {
                toast.error('Errore durante l\'aggiunta dell\'utente.');
                console.error(error);
            }
        });

        // Event listener per ordinamento colonna Nome
        const sortNameCol = document.getElementById('sort-name-col');
        const sortNameIcon = document.getElementById('sort-name-icon');
        function updateSortIcon() {
            sortNameIcon.innerHTML = sortOrder === 'asc' ? '▲' : '▼';
        }
        updateSortIcon();
        sortNameCol.addEventListener('click', async () => {
            sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
            updateSortIcon();
            await loadUsersTable();
        });
    }

    /**
     * Rimuove gli event listener
     */
    function unmount() {
        // Nessun event listener da rimuovere
    }

    return {
        render: () => pageElement,
        mount,
        unmount
    };
}