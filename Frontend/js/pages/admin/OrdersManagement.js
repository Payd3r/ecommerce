import { authService } from '../../services/authService.js';
import { showBootstrapToast } from '../../components/Toast.js';
import * as OrdersAPI from '../../../api/orders.js';

/**
 * Carica la pagina di gestione ordini per l'amministratore
 * @returns {Object} - Oggetto con i metodi del componente
 */
export async function loadOrdersManagementPage() {
    const pageElement = document.createElement('div');
    pageElement.className = 'admin-dashboard-page';

    // Stato per l'ordinamento
    let sortBy = 'created_at';
    let sortOrder = 'desc';

    pageElement.innerHTML = `
        <div class="container mt-4">
            <div class="row mb-4 align-items-center">
                <div class="col-12 text-center">
                    <h1 class="display-5 fw-bold mb-2">Gestione Ordini</h1>
                </div>
            </div>
            <div class="row mb-2 align-items-center">
                <div class="col-6 d-flex align-items-center">
                    <button class="btn btn-outline-secondary" id="back-btn"><i class="bi bi-arrow-left"></i> Torna indietro</button>
                </div>
                <div class="col-6 d-flex justify-content-end">
                    <button id="refresh-orders-btn" class="btn btn-primary">Aggiorna Lista</button>
                </div>
            </div>
            <div class="row align-items-start">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Filtri</h5>
                            <form id="filters-form">
                                <div class="form-group mb-3">
                                    <label for="filter-customer">Cliente</label>
                                    <input type="text" id="filter-customer" name="filter-customer" class="form-control" placeholder="Nome cliente">
                                </div>
                                <div class="form-group mb-3">
                                    <label for="filter-status">Stato</label>
                                    <select id="filter-status" name="filter-status" class="form-control">
                                        <option value="">Tutti</option>
                                        <option value="pending">In attesa</option>
                                        <option value="processing">In lavorazione</option>
                                        <option value="shipped">Spedito</option>
                                        <option value="delivered">Consegnato</option>
                                        <option value="cancelled">Annullato</option>
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
                <div class="col-md-8 mb-5">
                    <div class="card h-100">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">Ordini</h5>
                            <div class="table-responsive flex-grow-1">
                                <table class="table mb-0">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Cliente</th>
                                            <th>Totale</th>
                                            <th>Stato</th>
                                            <th id="sort-created-col" style="cursor:pointer">Data <span id="sort-created-icon"></span></th>
                                            <th>Azioni</th>
                                        </tr>
                                    </thead>
                                    <tbody id="orders-table-body"></tbody>
                                </table>
                            </div>
                            <div id="pagination-container" class="mt-3 d-flex justify-content-center"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    // Modal per conferma eliminazione ordine
    pageElement.innerHTML += `
        <div class="modal fade" id="deleteOrderModal" tabindex="-1" aria-labelledby="deleteOrderModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="deleteOrderModalLabel">Conferma eliminazione</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        Sei sicuro di voler eliminare questo ordine?
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
                        <button type="button" id="confirm-delete-order-btn" class="btn btn-danger">Elimina</button>
                    </div>
                </div>
            </div>
        </div>`;

    // Modal per cambio stato ordine
    pageElement.innerHTML += `
        <div class="modal fade" id="changeStatusModal" tabindex="-1" aria-labelledby="changeStatusModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="changeStatusModalLabel">Cambia stato ordine</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="change-status-form">
                            <input type="hidden" id="change-status-order-id">
                            <div class="mb-3">
                                <label for="new-status" class="form-label">Nuovo stato</label>
                                <select class="form-select" id="new-status" required>
                                    <option value="pending">In attesa</option>
                                    <option value="processing">In lavorazione</option>
                                    <option value="shipped">Spedito</option>
                                    <option value="delivered">Consegnato</option>
                                    <option value="cancelled">Annullato</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                        <button type="button" id="save-status-btn" class="btn btn-primary">Salva</button>
                    </div>
                </div>
            </div>
        </div>`;

    let orderIdToDelete = null;
    let orderIdToChangeStatus = null;

    function getStatusBadge(status) {
        switch (status) {
            case 'pending': return '<span class="badge bg-warning">In attesa</span>';
            case 'processing': return '<span class="badge bg-info">In lavorazione</span>';
            case 'shipped': return '<span class="badge bg-primary">Spedito</span>';
            case 'delivered': return '<span class="badge bg-success">Consegnato</span>';
            case 'cancelled': return '<span class="badge bg-danger">Annullato</span>';
            default: return `<span class="badge bg-secondary">${status}</span>`;
        }
    }

    function renderPagination(pagination) {
        const paginationContainer = document.getElementById('pagination-container');
        paginationContainer.innerHTML = '';
        if (pagination && pagination.totalPages > 1) {
            const prevButton = document.createElement('button');
            prevButton.className = 'btn btn-secondary me-2';
            prevButton.textContent = 'Precedente';
            prevButton.disabled = !pagination.hasPrevPage;
            prevButton.addEventListener('click', () => {
                loadOrdersTable({ page: pagination.currentPage - 1 });
            });
            paginationContainer.appendChild(prevButton);
            const nextButton = document.createElement('button');
            nextButton.className = 'btn btn-secondary';
            nextButton.textContent = 'Successivo';
            nextButton.disabled = !pagination.hasNextPage;
            nextButton.addEventListener('click', () => {
                loadOrdersTable({ page: pagination.currentPage + 1 });
            });
            paginationContainer.appendChild(nextButton);
        }
    }

    async function loadOrdersTable(params = {}) {
        try {
            // Parametri di filtro
            let customer = params.customer !== undefined ? params.customer : '';
            let status = params.status !== undefined ? params.status : '';
            let page = params.page !== undefined ? params.page : 1;
            let limit = params.limit !== undefined ? params.limit : 10;
            let orderBy = params.orderBy !== undefined ? params.orderBy : 'created_at';
            let orderDir = params.orderDir !== undefined ? params.orderDir : 'DESC';

            // Chiamata API (qui puoi adattare se hai endpoint paginati/filtrati)
            const ordersData = await OrdersAPI.getOrders();
            let orders = ordersData.orders || ordersData || [];
            // Filtro lato client (adatta se hai API con filtri)
            if (customer) {
                orders = orders.filter(o => o.client_name && o.client_name.toLowerCase().includes(customer.toLowerCase()));
            }
            if (status) {
                orders = orders.filter(o => o.status === status);
            }
            // Ordinamento
            orders = orders.sort((a, b) => {
                if (orderBy === 'created_at') {
                    return orderDir === 'DESC' ? new Date(b.created_at) - new Date(a.created_at) : new Date(a.created_at) - new Date(b.created_at);
                }
                return 0;
            });
            // Paginazione lato client
            const totalOrders = orders.length;
            const totalPages = Math.ceil(totalOrders / limit);
            const currentPage = page;
            const paginatedOrders = orders.slice((page - 1) * limit, page * limit);

            const tableBody = document.getElementById('orders-table-body');
            tableBody.innerHTML = '';
            paginatedOrders.forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.id}</td>
                    <td>${order.client_name || '-'}</td>
                    <td>€ ${order.total_price ? Number(order.total_price).toFixed(2) : '-'}</td>
                    <td>${getStatusBadge(order.status)}</td>
                    <td>${order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</td>
                    <td class="position-relative">
                        <div class="dropdown">
                            <button class="btn btn-sm btn-secondary" type="button" id="dropdownMenuButton-${order.id}" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-three-dots"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end position-absolute" style="z-index: 1050;" aria-labelledby="dropdownMenuButton-${order.id}">
                                <li><button class="dropdown-item" onclick="viewOrderDetails(${order.id})">Dettagli</button></li>
                                <li><button class="dropdown-item" onclick="changeOrderStatus(${order.id})">Cambia stato</button></li>
                                <li><button class="dropdown-item text-danger" onclick="deleteOrder(${order.id})">Elimina</button></li>
                            </ul>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            renderPagination({ totalPages, currentPage, hasPrevPage: currentPage > 1, hasNextPage: currentPage < totalPages });
        } catch (error) {
            showBootstrapToast('Errore durante il caricamento degli ordini', 'Errore', 'danger');
        }
    }

    // Funzioni globali per azioni
    window.deleteOrder = function (orderId) {
        orderIdToDelete = orderId;
        const deleteOrderModal = new bootstrap.Modal(document.getElementById('deleteOrderModal'));
        deleteOrderModal.show();
    };
    window.changeOrderStatus = function (orderId) {
        orderIdToChangeStatus = orderId;
        document.getElementById('change-status-order-id').value = orderId;
        const changeStatusModal = new bootstrap.Modal(document.getElementById('changeStatusModal'));
        changeStatusModal.show();
    };
    window.viewOrderDetails = function (orderId) {
        // Qui puoi implementare la visualizzazione dettagli ordine (es. apri modale o redirect)
        showBootstrapToast('Funzionalità Dettagli ordine da implementare', 'Info', 'info');
    };

    function mount() {
        loadOrdersTable();
        document.getElementById('back-btn').addEventListener('click', () => window.history.back());
        document.getElementById('refresh-orders-btn').addEventListener('click', () => loadOrdersTable());
        document.getElementById('apply-filters-btn').onclick = async () => {
            const filtersForm = document.getElementById('filters-form');
            const formData = new FormData(filtersForm);
            const params = {
                customer: formData.get('filter-customer') || '',
                status: formData.get('filter-status') || '',
            };
            await loadOrdersTable(params);
        };
        document.getElementById('reset-filters-btn').onclick = async () => {
            document.getElementById('filters-form').reset();
            await loadOrdersTable();
        };
        document.getElementById('confirm-delete-order-btn').addEventListener('click', async () => {
            if (!orderIdToDelete) return;
            try {
                // Qui dovresti chiamare OrdersAPI.deleteOrder(orderIdToDelete) se esiste
                showBootstrapToast('Ordine eliminato (mock)', 'Successo', 'success');
                const deleteOrderModal = bootstrap.Modal.getInstance(document.getElementById('deleteOrderModal'));
                deleteOrderModal.hide();
                orderIdToDelete = null;
                await loadOrdersTable();
            } catch (error) {
                showBootstrapToast('Errore durante l\'eliminazione ordine.', 'Errore', 'danger');
            }
        });
        document.getElementById('save-status-btn').addEventListener('click', async () => {
            const orderId = document.getElementById('change-status-order-id').value;
            const newStatus = document.getElementById('new-status').value;
            if (!orderId || !newStatus) return;
            try {
                // Qui dovresti chiamare OrdersAPI.updateOrderStatus(orderId, newStatus) se esiste
                showBootstrapToast('Stato ordine aggiornato (mock)', 'Successo', 'success');
                const changeStatusModal = bootstrap.Modal.getInstance(document.getElementById('changeStatusModal'));
                changeStatusModal.hide();
                await loadOrdersTable();
            } catch (error) {
                showBootstrapToast('Errore durante il cambio stato.', 'Errore', 'danger');
            }
        });
        // Ordinamento per data
        let sortCreatedOrder = 'desc';
        const sortCreatedCol = document.getElementById('sort-created-col');
        const sortCreatedIcon = document.getElementById('sort-created-icon');
        function updateSortCreatedIcon() {
            sortCreatedIcon.innerHTML = sortCreatedOrder === 'asc' ? '▲' : '▼';
        }
        updateSortCreatedIcon();
        sortCreatedCol.addEventListener('click', async () => {
            sortCreatedOrder = sortCreatedOrder === 'asc' ? 'desc' : 'asc';
            updateSortCreatedIcon();
            await loadOrdersTable({ orderBy: 'created_at', orderDir: sortCreatedOrder });
        });
    }

    function unmount() {}

    return {
        render: () => pageElement,
        mount,
        unmount
    };
}
