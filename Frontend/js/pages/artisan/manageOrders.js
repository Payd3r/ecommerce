import { getOrdersByArtisan, getOrderItems, deleteOrder, updateOrderStatus } from '../../../api/orders.js';
import { authService } from '../../services/authService.js';

export async function loadManageOrdersPage() {
    const pageElement = document.createElement('div');
    pageElement.className = 'admin-dashboard-page';

    let sortCreatedOrder = 'DESC';
    let orderIdToDelete = null;
    let orderIdToChangeStatus = null;
    let orders = [];
    let filteredOrders = [];
    let currentPage = 1;
    const pageSize = 12;

    // Stato filtri
    let filter = {
        minPrice: '',
        maxPrice: '',
        startDate: '',
        endDate: '',
        status: '',
        sort: 'desc',
        customer: '',
    };

    // Stati disponibili
    const statusOptions = [
        { value: 'pending', label: 'In attesa' },
        { value: 'processing', label: 'In lavorazione' },
        { value: 'shipped', label: 'Spedito' },
        { value: 'completed', label: 'Completato' },
        { value: 'cancelled', label: 'Annullato' }
    ];

    // HTML struttura principale
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
                                        ${statusOptions.map(s => `<option value="${s.value}">${s.label}</option>`).join('')}
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
                                    <label for="filter-sort">Ordinamento</label>
                                    <select id="filter-sort" name="filter-sort" class="form-control">
                                        <option value="desc">Dal più recente</option>
                                        <option value="asc">Dal meno recente</option>
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

    // Modali
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
                                    ${statusOptions.map(s => `<option value="${s.value}">${s.label}</option>`).join('')}
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
    pageElement.innerHTML += `
        <div class="modal fade" id="orderDetailsModal" tabindex="-1" aria-labelledby="orderDetailsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="orderDetailsModalLabel">Dettagli Ordine</h5>
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

    // Carica ordini
    const user = authService.getUser();
    async function reloadOrders() {
        try {
            orders = await getOrdersByArtisan(user.id);
            filteredOrders = [...orders];
        } catch (e) {
            filteredOrders = [];
        }
        applyFilters();
    }
    try {
        orders = await getOrdersByArtisan(user.id);
        filteredOrders = [...orders];
    } catch (e) {
        filteredOrders = [];
    }

    function getStatusBadge(status) {
        switch (status) {
            case 'pending': return '<span class="badge bg-warning">In attesa</span>';
            case 'processing': return '<span class="badge bg-info">In lavorazione</span>';
            case 'shipped': return '<span class="badge bg-primary">Spedito</span>';
            case 'completed': return '<span class="badge bg-success">Completato</span>';
            case 'cancelled': return '<span class="badge bg-danger">Annullato</span>';
            default: return `<span class="badge bg-secondary">${status}</span>`;
        }
    }

    function renderPagination(totalPages) {
        const paginationContainer = pageElement.querySelector('#pagination-container');
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
                }
            });
            paginationContainer.appendChild(nextButton);
        }
    }

    function applyFilters() {
        filteredOrders = orders.filter(o => {
            const price = parseFloat(o.total_price);
            const created = new Date(o.created_at);
            let ok = true;
            if (filter.minPrice && price < parseFloat(filter.minPrice)) ok = false;
            if (filter.maxPrice && price > parseFloat(filter.maxPrice)) ok = false;
            if (filter.startDate && created < new Date(filter.startDate)) ok = false;
            if (filter.endDate && created > new Date(filter.endDate)) ok = false;
            if (filter.status && o.status !== filter.status) ok = false;
            if (filter.customer && o.client_name && !o.client_name.toLowerCase().includes(filter.customer.toLowerCase())) ok = false;
            return ok;
        });
        filteredOrders.sort((a, b) => {
            if (filter.sort === 'asc') return new Date(a.created_at) - new Date(b.created_at);
            else return new Date(b.created_at) - new Date(a.created_at);
        });
        currentPage = 1;
        renderTable();
    }

    function renderTable() {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        const pageOrders = filteredOrders.slice(start, end);
        const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
        const tableBody = pageElement.querySelector('#orders-table-body');
        tableBody.innerHTML = '';
        if (pageOrders.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center">Nessun ordine trovato</td></tr>`;
        } else {
            pageOrders.forEach(order => {
                const row = document.createElement('tr');
                if (window.innerWidth < 768) {
                    row.innerHTML = `
                        <td>${order.client_name || '-'}</td>
                        <td>${getStatusBadge(order.status)}</td>
                        <td class="text-center align-middle" style="vertical-align: middle !important;">
                            <button class="btn btn-link p-0 m-0 d-flex justify-content-center align-items-center" title="Dettagli ordine">
                                <i class="bi bi-eye fs-5"></i>
                            </button>
                        </td>
                    `;
                    row.querySelector('button').addEventListener('click', () => viewOrderDetails(order.id));
                } else {
                    row.innerHTML = `
                        <td>${order.id}</td>
                        <td>${order.client_name || '-'}</td>
                        <td>€ ${order.total_price ? Number(order.total_price).toFixed(2) : '-'}</td>
                        <td>${getStatusBadge(order.status)}</td>
                        <td>${order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</td>
                        <td class="text-center align-middle" style="vertical-align: middle !important;">
                            <button class="btn btn-link p-0 m-0 d-flex justify-content-center align-items-center" title="Dettagli ordine">
                                <i class="bi bi-eye fs-5"></i>
                            </button>
                        </td>
                    `;
                    row.querySelector('button').addEventListener('click', () => viewOrderDetails(order.id));
                }
                tableBody.appendChild(row);
            });
        }
        renderPagination(totalPages);
    }

    // Visualizza dettagli ordine (mostra solo prodotti dell'artigiano loggato)
    async function viewOrderDetails(orderId) {
        window._lastOrderDetailsId = orderId;
        const tableBody = pageElement.querySelector('#order-details-table-body');
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Caricamento...</td></tr>';
        try {
            const items = await getOrderItems(orderId);
            const user = authService.getUser();
            const artisanItems = items.filter(item => item.artisan_id === user.id);
            if (!artisanItems.length) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nessun prodotto trovato</td></tr>';
            } else {
                tableBody.innerHTML = '';
                artisanItems.forEach(item => {
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
        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Errore nel caricamento dei dettagli ordine</td></tr>';
        }
        // Mostra modal
        const modal = new bootstrap.Modal(pageElement.querySelector('#orderDetailsModal'));
        modal.show();
        // Bottoni cambio stato/elimina
        pageElement.querySelector('#order-details-change-status-btn').onclick = function() {
            modal.hide();
            setTimeout(() => changeOrderStatus(orderId), 300);
        };
        pageElement.querySelector('#order-details-delete-btn').onclick = function() {
            modal.hide();
            setTimeout(() => showDeleteOrderModal(orderId), 300);
        };
    }

    function showDeleteOrderModal(orderId) {
        orderIdToDelete = orderId;
        const deleteOrderModal = new bootstrap.Modal(pageElement.querySelector('#deleteOrderModal'));
        deleteOrderModal.show();
    }
    
    function changeOrderStatus(orderId) {
        orderIdToChangeStatus = orderId;
        pageElement.querySelector('#change-status-order-id').value = orderId;
        const changeStatusModal = new bootstrap.Modal(pageElement.querySelector('#changeStatusModal'));
        changeStatusModal.show();
    }

    // Eventi filtri
    const form = pageElement.querySelector('#filters-form');
    form.addEventListener('submit', e => {
        e.preventDefault();
        filter.minPrice = form['filter-total-min'].value;
        filter.maxPrice = form['filter-total-max'].value;
        filter.startDate = form['filter-date-from'].value;
        filter.endDate = form['filter-date-to'].value;
        filter.status = form['filter-status'].value;
        filter.sort = form['filter-sort'].value;
        filter.customer = form['filter-customer'].value;
        applyFilters();
    });
    pageElement.querySelector('#apply-filters-btn').onclick = () => form.requestSubmit();
    pageElement.querySelector('#reset-filters-btn').onclick = () => {
        form.reset();
        filter = { minPrice: '', maxPrice: '', startDate: '', endDate: '', status: '', sort: 'desc', customer: '' };
        applyFilters();
    };
    pageElement.querySelector('#refresh-orders-btn').onclick = () => {
        form.reset();
        filter = { minPrice: '', maxPrice: '', startDate: '', endDate: '', status: '', sort: 'desc', customer: '' };
        applyFilters();
    };
    pageElement.querySelector('#back-btn').onclick = () => window.history.back();

    // Modal elimina ordine
    pageElement.querySelector('#confirm-delete-order-btn').addEventListener('click', async () => {
        if (!orderIdToDelete) return;
        try {
            await deleteOrder(orderIdToDelete); // chiama la funzione API
        } catch (e) {
            alert(e.message || 'Errore durante l\'eliminazione');
        }
        const deleteOrderModal = bootstrap.Modal.getInstance(pageElement.querySelector('#deleteOrderModal'));
        deleteOrderModal.hide();
        orderIdToDelete = null;
        await reloadOrders();
    });
    // Riapri dettagli se si annulla eliminazione
    pageElement.querySelector('#deleteOrderModal .btn-secondary').addEventListener('click', function() {
        const lastId = window._lastOrderDetailsId;
        if (lastId) {
            setTimeout(() => viewOrderDetails(lastId), 300);
        }
    });
    // Modal cambio stato
    pageElement.querySelector('#save-status-btn').addEventListener('click', async () => {
        const orderId = pageElement.querySelector('#change-status-order-id').value;
        const newStatus = pageElement.querySelector('#new-status').value;
        if (!orderId || !newStatus) return;
        try {
            await updateOrderStatus(orderId, newStatus);
        } catch (e) {
            alert(e.message || 'Errore durante l\'aggiornamento stato');
        }
        const changeStatusModal = bootstrap.Modal.getInstance(pageElement.querySelector('#changeStatusModal'));
        changeStatusModal.hide();
        await reloadOrders();
    });
    // Riapri dettagli se si annulla cambio stato
    pageElement.querySelector('#changeStatusModal .btn-secondary').addEventListener('click', function() {
        const lastId = window._lastOrderDetailsId;
        if (lastId) {
            setTimeout(() => viewOrderDetails(lastId), 300);
        }
    });
    // Ordinamento per data
    const sortCreatedCol = pageElement.querySelector('#sort-created-col');
    const sortCreatedIcon = pageElement.querySelector('#sort-created-icon');
    function updateSortCreatedIcon() {
        sortCreatedIcon.innerHTML = sortCreatedOrder === 'ASC' ? '▲' : '▼';
    }
    updateSortCreatedIcon();
    sortCreatedCol.addEventListener('click', () => {
        sortCreatedOrder = sortCreatedOrder === 'ASC' ? 'DESC' : 'ASC';
        filter.sort = sortCreatedOrder.toLowerCase();
        updateSortCreatedIcon();
        applyFilters();
    });

    // Prima renderizzazione
    applyFilters();

    // CSS responsive mobile
    if (!document.getElementById('artisan-orders-mobile-style')) {
        const style = document.createElement('style');
        style.id = 'artisan-orders-mobile-style';
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

    // Gestione bottoni mobile nel mount
    const backBtnMobile = pageElement.querySelector('#back-btn-mobile');
    if (backBtnMobile) backBtnMobile.onclick = () => window.history.back();
    const refreshOrdersBtnMobile = pageElement.querySelector('#refresh-orders-btn-mobile');
    if (refreshOrdersBtnMobile) refreshOrdersBtnMobile.onclick = () => {
        form.reset();
        filter = { minPrice: '', maxPrice: '', startDate: '', endDate: '', status: '', sort: 'desc', customer: '' };
        applyFilters();
    };
    const toggleFiltersMobile = pageElement.querySelector('#toggle-filters-mobile');
    if (toggleFiltersMobile) toggleFiltersMobile.onclick = () => {
        const filtersCard = pageElement.querySelector('#filters-card');
        filtersCard.classList.toggle('mobile-visible');
    };

    return {
        render: () => pageElement,
        mount: () => {},
        unmount: () => {}
    };
}
