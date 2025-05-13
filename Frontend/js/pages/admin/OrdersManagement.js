import { authService } from '../../services/authService.js';
import { showBootstrapToast } from '../../components/Toast.js';
import * as OrdersAPI from '../../../api/orders.js';
import { router } from '../../router.js';

/**
 * Carica la pagina di gestione ordini per l'amministratore
 * @returns {Object} - Oggetto con i metodi del componente
 */
export async function loadOrdersManagementPage() {
    const pageElement = document.createElement('div');
    pageElement.className = 'admin-dashboard-page';

    let sortCreatedOrder = 'DESC';

    pageElement.innerHTML = `
        <div class="container mt-4">
            <div class="row mb-4 align-items-center">
                <div class="col-12 text-center">
                    <h1 class="display-5 fw-bold mb-2">Gestione Ordini</h1>
                </div>
            </div>
            <div class="row mb-4 align-items-center d-none d-md-flex">
                <div class="col-6 d-flex align-items-center">
                    <button class="btn btn-outline-secondary" id="back-btn"><i class="bi bi-arrow-left"></i> Torna indietro</button>
                </div>
                <div class="col-6 d-flex justify-content-end">
                    <button id="refresh-orders-btn" class="btn btn-primary">Aggiorna Lista</button>
                </div>
            </div>
            <div class="row d-flex d-md-none">
                <div class="col-12 mobile-btns">
                    <button class="btn btn-outline-secondary w-100" id="back-btn-mobile"><i class="bi bi-arrow-left"></i> Torna indietro</button>
                    <button class="btn btn-primary w-100" id="refresh-orders-btn-mobile">Aggiorna Lista</button>
                    <button class="btn btn-success w-100" id="toggle-filters-mobile">Filtri</button>
                </div>
            </div>
            <div class="row align-items-start">
                <div class="col-md-4 pb-4" id="filters-card">
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
                                <div class="form-group mb-3">
                                    <label>Data ordine</label>
                                    <div class="d-flex gap-2">
                                        <input type="date" id="filter-date-from" name="filter-date-from" class="form-control" placeholder="Da">
                                        <input type="date" id="filter-date-to" name="filter-date-to" class="form-control" placeholder="A">
                                    </div>
                                </div>
                                <div class="form-group mb-3">
                                    <label>Totale ordine (€)</label>
                                    <div class="d-flex gap-2">
                                        <input type="number" step="0.01" min="0" id="filter-total-min" name="filter-total-min" class="form-control" placeholder="Min">
                                        <input type="number" step="0.01" min="0" id="filter-total-max" name="filter-total-max" class="form-control" placeholder="Max">
                                    </div>
                                </div>
                                <div class="form-group mb-3">
                                    <label for="filter-payment">Metodo di pagamento</label>
                                    <select id="filter-payment" name="filter-payment" class="form-control">
                                        <option value="">Tutti</option>
                                        <option value="card">Carta</option>
                                        <option value="paypal">PayPal</option>
                                        <option value="bank">Bonifico</option>
                                        <option value="cod">Contrassegno</option>
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
                <div class="col-md-8 mb-5 pb-4">
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

    // Modal Dettagli Ordine
    pageElement.innerHTML += `
        <div class="modal fade" id="orderDetailsModal" tabindex="-1" aria-labelledby="orderDetailsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="orderDetailsModalLabel">Dettagli Conto</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="table-responsive mb-3">
                            <table class="table table-bordered align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Quantità</th>
                                        <th>Prezzo</th>
                                        <th>Sconto</th>
                                        <th>Totale</th>
                                        <th>Articolo</th>
                                    </tr>
                                </thead>
                                <tbody id="order-details-table-body"></tbody>
                            </table>
                        </div>
                        <div class="d-flex gap-2 justify-content-end">
                            <button type="button" class="btn btn-outline-primary" id="order-details-change-status-btn">Cambia stato</button>
                            <button type="button" class="btn btn-outline-danger" id="order-details-delete-btn">Elimina ordine</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    let orderIdToDelete = null;
    let orderIdToChangeStatus = null;

    function getStatusBadge(status) {
        switch (status) {
            case 'pending': return '<span class="badge bg-secondary">In attesa</span>';
            case 'accepted': return '<span class="badge bg-warning">Accettato</span>';
            case 'refused': return '<span class="badge bg-danger">Rifiutato</span>';
            case 'shipped': return '<span class="badge bg-info">Spedito</span>';
            case 'delivered': return '<span class="badge bg-success">Consegnato</span>';
            default: return `<span class="badge bg-secondary">${status}</span>`;
        }
    }

    function renderPagination(pagination) {
        const paginationContainer = document.getElementById('pagination-container');
        paginationContainer.innerHTML = '';
        
        if (!pagination || pagination.totalPages <= 1) return;
        
        const totalPages = pagination.totalPages;
        const currentPage = pagination.currentPage;
        
        // Container per i bottoni
        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-group';
        
        // Bottone Precedente
        if (pagination.hasPrevPage) {
            const prevBtn = document.createElement('button');
            prevBtn.type = 'button';
            prevBtn.className = 'btn btn-sm btn-outline-primary';
            prevBtn.textContent = 'Precedente';
            prevBtn.onclick = function() {
                loadOrdersTable({ page: currentPage - 1 });
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
            pageBtn.className = `btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'}`;
            pageBtn.textContent = i;
            
            // Solo per le pagine diverse da quella corrente
            if (i !== currentPage) {
                pageBtn.onclick = function() {
                    loadOrdersTable({ page: i });
                };
            }
            
            btnGroup.appendChild(pageBtn);
        }
        
        // Bottone Successivo
        if (pagination.hasNextPage) {
            const nextBtn = document.createElement('button');
            nextBtn.type = 'button';
            nextBtn.className = 'btn btn-sm btn-outline-primary';
            nextBtn.textContent = 'Successivo';
            nextBtn.onclick = function() {
                loadOrdersTable({ page: currentPage + 1 });
            };
            btnGroup.appendChild(nextBtn);
        }
        
        // Aggiungiamo i bottoni al container
        paginationContainer.appendChild(btnGroup);
    }

    async function loadOrdersTable(params = {}) {
        try {
            // Parametri di filtro
            let customer = params.customer !== undefined ? params.customer : '';
            let status = params.status !== undefined ? params.status : '';
            let dateFrom = params.dateFrom !== undefined ? params.dateFrom : '';
            let dateTo = params.dateTo !== undefined ? params.dateTo : '';
            let totalMin = params.totalMin !== undefined ? params.totalMin : '';
            let totalMax = params.totalMax !== undefined ? params.totalMax : '';
            let payment = params.payment !== undefined ? params.payment : '';
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
            if (dateFrom) {
                orders = orders.filter(o => o.created_at && new Date(o.created_at) >= new Date(dateFrom));
            }
            if (dateTo) {
                orders = orders.filter(o => o.created_at && new Date(o.created_at) <= new Date(dateTo));
            }
            if (totalMin) {
                orders = orders.filter(o => o.total_price && Number(o.total_price) >= Number(totalMin));
            }
            if (totalMax) {
                orders = orders.filter(o => o.total_price && Number(o.total_price) <= Number(totalMax));
            }
            if (payment) {
                orders = orders.filter(o => o.payment_method && o.payment_method === payment);
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
            paginatedOrders.forEach((order, idx) => {
                const row = document.createElement('tr');
                if (window.innerWidth < 768) {
                    row.innerHTML = `
                        <td>${order.client_name || '-'}</td>
                        <td>${getStatusBadge(order.status)}</td>
                        <td class="text-center align-middle" style="vertical-align: middle !important;">
                            <button class="btn btn-link p-0 m-0 d-flex justify-content-center align-items-center" title="Dettagli ordine">
                                <i class="bi bi-eye fs-5" onclick="viewOrderDetails(${order.id})"></i>
                            </button>
                        </td>
                    `;
                } else {
                    row.innerHTML = `
                        <td>${order.id}</td>
                        <td>${order.client_name || '-'}</td>
                        <td>€ ${order.total_price ? Number(order.total_price).toFixed(2) : '-'}</td>
                        <td>${getStatusBadge(order.status)}</td>
                        <td>${order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</td>
                        <td class="text-center align-middle" style="vertical-align: middle !important;">
                            <button class="btn btn-link p-0 m-0 d-flex justify-content-center align-items-center" title="Dettagli ordine">
                                <i class="bi bi-eye fs-5" onclick="viewOrderDetails(${order.id})"></i>
                            </button>
                        </td>
                    `;
                }
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
    window.viewOrderDetails = async function (orderId) {
        window._lastOrderDetailsId = orderId; // salva id per riapertura
        try {
            const items = await OrdersAPI.getOrderItems(orderId);
            const tableBody = document.getElementById('order-details-table-body');
            tableBody.innerHTML = '';
            if (!items || items.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nessun prodotto trovato</td></tr>';
            } else {
                items.forEach(item => {
                    const prezzo = item.unit_price ? Number(item.unit_price).toFixed(2) : '-';
                    const sconto = item.discount ? Number(item.discount).toFixed(2) : '0.00';
                    const totale = item.unit_price && item.quantity ? (Number(item.unit_price) * Number(item.quantity) - Number(sconto)).toFixed(2) : '-';
                    const row = `<tr>
                        <td><b>${item.quantity}</b></td>
                        <td>${prezzo} €</td>
                        <td style="color:#ff9800;font-weight:bold;">${sconto}</td>
                        <td style="color:#4caf50;font-weight:bold;">${totale}</td>
                        <td>${item.product_name || '-'}</td>
                    </tr>`;
                    tableBody.innerHTML += row;
                });
            }
            document.getElementById('order-details-change-status-btn').onclick = function() {
                // Chiudi modal dettagli e apri cambio stato
                const modal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
                modal.hide();
                setTimeout(() => {
                    window.changeOrderStatus(orderId);
                }, 300); // attende chiusura animazione
            };
            document.getElementById('order-details-delete-btn').onclick = function() {
                // Chiudi modal dettagli e apri conferma
                const modal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
                modal.hide();
                setTimeout(() => {
                    window.deleteOrder(orderId);
                }, 300); // attende chiusura animazione
            };
            const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
            modal.show();
        } catch (error) {
            showBootstrapToast('Errore nel caricamento dei dettagli ordine', 'Errore', 'danger');
        }
    };

    function mount() {
        loadOrdersTable();
        const backBtn = document.getElementById('back-btn');
        if (backBtn) backBtn.addEventListener('click', () => {
            router.navigate('/admin/dashboard');
        });
        const backBtnMobile = document.getElementById('back-btn-mobile');
        if (backBtnMobile) backBtnMobile.addEventListener('click', () => {
            router.navigate('/admin/dashboard');
        });
        const refreshOrdersBtnMobile = document.getElementById('refresh-orders-btn-mobile');
        if (refreshOrdersBtnMobile) refreshOrdersBtnMobile.addEventListener('click', () => {
            document.getElementById('filters-form').reset();
            loadOrdersTable();
        });
        const toggleFiltersMobile = document.getElementById('toggle-filters-mobile');
        if (toggleFiltersMobile) toggleFiltersMobile.addEventListener('click', () => {
            const filtersCard = document.getElementById('filters-card');
            filtersCard.classList.toggle('mobile-visible');
        });
        document.getElementById('apply-filters-btn').onclick = async () => {
            const filtersForm = document.getElementById('filters-form');
            const formData = new FormData(filtersForm);
            const params = {
                customer: formData.get('filter-customer') || '',
                status: formData.get('filter-status') || '',
                dateFrom: formData.get('filter-date-from') || '',
                dateTo: formData.get('filter-date-to') || '',
                totalMin: formData.get('filter-total-min') || '',
                totalMax: formData.get('filter-total-max') || '',
                payment: formData.get('filter-payment') || '',
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
                await OrdersAPI.deleteOrder(orderIdToDelete);
                const orderDetailsModalEl = document.getElementById('orderDetailsModal');
                if (orderDetailsModalEl && orderDetailsModalEl.classList.contains('show')) {
                    const orderDetailsModal = bootstrap.Modal.getInstance(orderDetailsModalEl);
                    orderDetailsModal.hide();
                }
                showBootstrapToast('Ordine eliminato', 'Successo', 'success');
                const deleteOrderModal = bootstrap.Modal.getInstance(document.getElementById('deleteOrderModal'));
                deleteOrderModal.hide();
                orderIdToDelete = null;
                await loadOrdersTable();
            } catch (error) {
                showBootstrapToast(error.message || 'Errore durante l\'eliminazione ordine.', 'Errore', 'danger');
            }
        });
        // Riapri il modal dettagli se si annulla la conferma eliminazione
        document.querySelector('#deleteOrderModal .btn-secondary').addEventListener('click', function() {
            const lastId = window._lastOrderDetailsId;
            if (lastId) {
                setTimeout(() => window.viewOrderDetails(lastId), 300); // attende chiusura animazione
            }
        });
        // Riapri il modal dettagli se si annulla il cambio stato
        document.querySelector('#changeStatusModal .btn-secondary').addEventListener('click', function() {
            const lastId = window._lastOrderDetailsId;
            if (lastId) {
                setTimeout(() => window.viewOrderDetails(lastId), 300); // attende chiusura animazione
            }
        });
        document.getElementById('save-status-btn').addEventListener('click', async () => {
            const orderId = document.getElementById('change-status-order-id').value;
            const newStatus = document.getElementById('new-status').value;
            if (!orderId || !newStatus) return;
            try {
                await OrdersAPI.updateOrderStatus(orderId, newStatus);
                showBootstrapToast('Stato ordine aggiornato', 'Successo', 'success');
                const changeStatusModal = bootstrap.Modal.getInstance(document.getElementById('changeStatusModal'));
                changeStatusModal.hide();
                await loadOrdersTable();
            } catch (error) {
                showBootstrapToast(error.message || 'Errore durante il cambio stato.', 'Errore', 'danger');
            }
        });
        // Ordinamento per data
        const sortCreatedCol = document.getElementById('sort-created-col');
        const sortCreatedIcon = document.getElementById('sort-created-icon');
        function updateSortCreatedIcon() {
            sortCreatedIcon.innerHTML = sortCreatedOrder === 'ASC' ? '▲' : '▼';
        }
        updateSortCreatedIcon();
        sortCreatedCol.addEventListener('click', async () => {
            sortCreatedOrder = sortCreatedOrder === 'ASC' ? 'DESC' : 'ASC';
            updateSortCreatedIcon();
            const params = { orderBy: 'created_at', orderDir: sortCreatedOrder };
            await loadOrdersTable(params);
        });

        // CSS responsive mobile
        if (!document.getElementById('orders-management-mobile-style')) {
            const style = document.createElement('style');
            style.id = 'orders-management-mobile-style';
            style.innerHTML = `
            @media (max-width: 767.98px) {
              .admin-dashboard-page .container,
              .admin-dashboard-page .row,
              .admin-dashboard-page .col-12 {
                padding-left: 0 !important;
                padding-right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
              }
              .admin-dashboard-page .mobile-btns {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                margin-bottom: 1rem;
              }
              .admin-dashboard-page .mobile-btns button {
                width: 100%;
              }
              .admin-dashboard-page #filters-card { display: none; }
              .admin-dashboard-page #filters-card.mobile-visible { display: block; margin-bottom: 1rem; }
              .admin-dashboard-page .table thead, .admin-dashboard-page .table th:not(:nth-child(2)):not(:nth-child(4)):not(:last-child), .admin-dashboard-page .table td:not(:nth-child(2)):not(:nth-child(4)):not(:last-child) {
                display: none;
              }
              .admin-dashboard-page .table td:nth-child(2), .admin-dashboard-page .table th:nth-child(2), .admin-dashboard-page .table td:nth-child(4), .admin-dashboard-page .table th:nth-child(4), .admin-dashboard-page .table td:last-child, .admin-dashboard-page .table th:last-child {
                display: table-cell;
              }
              .admin-dashboard-page .table td, .admin-dashboard-page .table th {
                padding: 0.75rem 0.5rem;
              }
              .admin-dashboard-page #pagination-container {
                justify-content: center !important;
                margin-top: 1rem;
              }
              .admin-dashboard-page #pagination-container button {
                width: 48%;
                margin: 0 1%;
                font-size: 1.1rem;
              }
            }
            `;
            document.head.appendChild(style);
        }
    }

    function unmount() { }

    return {
        render: () => pageElement,
        mount,
        unmount
    };
}
