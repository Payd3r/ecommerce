import { getOrdersByArtisan, getOrderItems, deleteOrder, updateOrderStatus, getAddressByUserId } from '../../../api/orders.js';
import { authService } from '../../services/authService.js';

/**
 * Carica la pagina di gestione ordini per l'artigiano.
 * Inizializza la UI, gestisce filtri, tabella ordini, paginazione, modali e azioni sugli ordini.
 * @returns {Object} - Oggetto con i metodi del componente (render, mount, unmount)
 */
export async function loadManageOrdersPage() {
    // Crea l'elemento principale della pagina
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

    // Stati disponibili per gli ordini
    const statusOptions = [
        { value: 'pending', label: 'In attesa' },
        { value: 'processing', label: 'In lavorazione' },
        { value: 'shipped', label: 'Spedito' },
        { value: 'completed', label: 'Completato' },
        { value: 'cancelled', label: 'Annullato' }
    ];

    // HTML struttura principale (header, filtri, tabella, modali)
    pageElement.innerHTML = `
        <div class="container pt-2 pb-5 orders-page">
            <!-- DESKTOP: Titolo e sottotitolo allineati a sinistra -->
            <div class="d-none d-md-block">
                <div class="row mb-0 mb-md-2">
                    <div class="col-12">
                        <h1 class="page-title mb-1">Gestione Ordini</h1>
                        <div class="page-subtitle mb-3">Gestisci i tuoi ordini, aggiorna lo stato o consulta i dettagli.</div>
                    </div>
                </div>
                <div class="row align-items-center mb-4">
                    <div class="col-6">
                        <button class="btn btn-outline-secondary" id="back-btn"><i class="bi bi-arrow-left"></i> Torna indietro</button>
                    </div>
                    <div class="col-6 text-end">
                        <button id="refresh-orders-btn" class="btn btn-primary">Aggiorna lista</button>
                    </div>
                </div>
            </div>
            <!-- MOBILE: tutto invariato -->
            <div class="row d-md-none align-items-center mb-0 mb-md-2">
                <div class="col-12 d-flex d-md-none flex-column gap-2">
                    <h1 class="page-title mb-2">Gestione Ordini</h1>
                    <div class="d-flex gap-2">
                        <button id="toggle-filters" class="btn btn-outline-primary flex-fill" type="button">
                            <i class="bi bi-funnel"></i> Filtri
                        </button>
                        <button id="refresh-orders-btn-mobile" class="btn btn-primary flex-fill"><i class="bi bi-arrow-clockwise me-2"></i>Aggiorna lista</button>
                    </div>
                </div>
            </div>
            <div class="row pb-5 pt-2">
                <aside class="col-12 col-md-4 mb-4 mb-md-0" id="filters-container" style="${window.innerWidth < 768 ? 'display:none;' : ''}">
                    <div class="card shadow-sm border-0 p-3 position-relative me-0 me-md-3">
                        <button type="reset" class="btn btn-link text-secondary position-absolute top-0 end-0 mt-4 me-2 p-0" id="reset-filters-btn" style="font-size:1rem;">Reset</button>
                        <h5 class="mb-3">Filtra gli ordini</h5>
                        <form id="filters-form" class="filters-form">
                            <div class="mb-3">
                                <label for="filter-customer" class="form-label">Cliente</label>
                                <input type="text" id="filter-customer" name="filter-customer" class="form-control" placeholder="Nome cliente">
                            </div>
                            <div class="mb-3">
                                <label for="filter-status" class="form-label">Stato</label>
                                <select id="filter-status" name="filter-status" class="form-control">
                                    <option value="">Tutti</option>
                                    ${statusOptions.map(s => `<option value="${s.value}">${s.label}</option>`).join('')}
                                </select>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6">
                                    <label for="filter-date-from" class="form-label">Da</label>
                                    <input type="date" id="filter-date-from" name="filter-date-from" class="form-control" placeholder="Da">
                                </div>
                                <div class="col-6">
                                    <label for="filter-date-to" class="form-label">A</label>
                                    <input type="date" id="filter-date-to" name="filter-date-to" class="form-control" placeholder="A">
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6">
                                    <label for="filter-total-min" class="form-label">Totale min (€)</label>
                                    <input type="number" step="0.01" min="0" id="filter-total-min" name="filter-total-min" class="form-control" placeholder="Min">
                                </div>
                                <div class="col-6">
                                    <label for="filter-total-max" class="form-label">Totale max (€)</label>
                                    <input type="number" step="0.01" min="0" id="filter-total-max" name="filter-total-max" class="form-control" placeholder="Max">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="filter-sort" class="form-label">Ordinamento</label>
                                <select id="filter-sort" name="filter-sort" class="form-control">
                                    <option value="desc">Dal più recente</option>
                                    <option value="asc">Dal meno recente</option>
                                </select>
                            </div>
                            <div class="d-flex justify-content-between">
                                <button type="button" id="apply-filters-btn" class="btn btn-primary w-100">Applica Filtri</button>
                            </div>
                        </form>
                    </div>
                </aside>
                <main class="col-12 col-md-8">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-body p-0">
                            <table class="table table-bordered align-middle mb-0">
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
                        <div class="card-footer p-0 border-0">
                            <nav>
                                <ul class="pagination justify-content-center mb-0" id="pagination-container"></ul>
                            </nav>
                        </div>
                    </div>
                </main>
            </div>
        </div>`;

    // Modal
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
                        <div id="order-details-actions"></div>
                        <div class="d-flex gap-2 justify-content-end">
                            <button type="button" class="btn btn-outline-danger" id="order-details-delete-btn">Elimina ordine</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    // Carica ordini dell'artigiano loggato
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

    /**
     * Restituisce il badge HTML per lo stato dell'ordine.
     * @param {string} status - Stato dell'ordine
     * @returns {string} - HTML del badge
     */
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

    /**
     * Renderizza la paginazione in base al numero totale di pagine e alla pagina corrente.
     * Gestisce i bottoni di navigazione e il cambio pagina.
     * @param {Object} pagination - Oggetto con info paginazione
     */
    function renderPagination(pagination) {
        const paginationContainer = pageElement.querySelector('#pagination-container');
        if (!paginationContainer) return;
        
        paginationContainer.innerHTML = '';
        
        if (!pagination || pagination.totalPages <= 1) return;
        
        const totalPages = pagination.totalPages;
        const currentPage = pagination.currentPage;
        
        // Container per i bottoni
        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-group';
        
        // Bottone Precedente
        if (currentPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.type = 'button';
            prevBtn.className = 'btn btn-sm btn-outline-primary';
            prevBtn.textContent = 'Precedente';
            prevBtn.onclick = function() {
                filter.page = currentPage - 1;
                applyFilters();
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
                    filter.page = i;
                    applyFilters();
                };
            }
            
            btnGroup.appendChild(pageBtn);
        }
        
        // Bottone Successivo
        if (currentPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.type = 'button';
            nextBtn.className = 'btn btn-sm btn-outline-primary';
            nextBtn.textContent = 'Successivo';
            nextBtn.onclick = function() {
                filter.page = currentPage + 1;
                applyFilters();
            };
            btnGroup.appendChild(nextBtn);
        }
        
        // Aggiungiamo i bottoni al container
        paginationContainer.appendChild(btnGroup);
    }

    /**
     * Applica i filtri agli ordini e aggiorna la tabella.
     */
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

    /**
     * Renderizza la tabella degli ordini filtrati e paginati.
     */
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
        renderPagination({ totalPages, currentPage });
    }

    /**
     * Mostra il modal dettagli ordine, inclusi prodotti dell'artigiano e indirizzo spedizione.
     * Gestisce anche le azioni di accetta/rifiuta/spedisci/elimina ordine.
     * @param {number} orderId - ID ordine da visualizzare
     */
    async function viewOrderDetails(orderId) {
        window._lastOrderDetailsId = orderId;
        const tableBody = pageElement.querySelector('#order-details-table-body');
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Caricamento...</td></tr>';
        let order = orders.find(o => o.id === orderId);
        let address = null;
        try {
            // Carica subito i dati di spedizione del cliente
            address = await getAddressByUserId(order.client_id);
        } catch (e) {
            address = null;
        }
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
        // Bottoni azione dinamici
        const actionsContainer = pageElement.querySelector('#order-details-actions');
        actionsContainer.innerHTML = '';
        if (order.status === 'pending') {
            const acceptBtn = document.createElement('button');
            acceptBtn.className = 'btn btn-success me-2';
            acceptBtn.textContent = 'Accetta';
            acceptBtn.onclick = async () => {
                try {
                    await updateOrderStatus(orderId, 'accepted');
                    modal.hide();
                    await reloadOrders();
                } catch (e) {
                    showBootstrapToast(e.message || 'Errore durante l\'accettazione dell\'ordine', 'Errore', 'danger');
                }
            };
            const refuseBtn = document.createElement('button');
            refuseBtn.className = 'btn btn-danger me-2';
            refuseBtn.textContent = 'Rifiuta';
            refuseBtn.onclick = async () => {
                await updateOrderStatus(orderId, 'refused');
                modal.hide();
                await reloadOrders();
            };
            actionsContainer.appendChild(acceptBtn);
            actionsContainer.appendChild(refuseBtn);
        } else if (order.status === 'accepted') {
            const shipBtn = document.createElement('button');
            shipBtn.className = 'btn btn-primary me-2';
            shipBtn.textContent = 'Spedisci';
            shipBtn.onclick = async () => {
                await updateOrderStatus(orderId, 'shipped');
                modal.hide();
                await reloadOrders();
            };
            actionsContainer.appendChild(shipBtn);
        }
        // Bottone elimina sempre visibile
        const deleteBtn = pageElement.querySelector('#order-details-delete-btn');
        deleteBtn.onclick = function() {
            modal.hide();
            setTimeout(() => showDeleteOrderModal(orderId), 300);
        };
        // Mostra info spedizione SEMPRE nel modal
        const modalBody = pageElement.querySelector('#orderDetailsModal .modal-body');
        let shippingInfoContainer = modalBody.querySelector('#shipping-info-container');
        if (!shippingInfoContainer) {
            shippingInfoContainer = document.createElement('div');
            shippingInfoContainer.className = 'mt-4';
            shippingInfoContainer.id = 'shipping-info-container';
            modalBody.appendChild(shippingInfoContainer);
        }
        if (address) {
            shippingInfoContainer.innerHTML = `
                <h6 class="fw-bold">
                    Informazioni di spedizione
                    <i class="bi bi-truck ms-2"></i>
                </h6>
                <ul class="list-group mb-2">
                    <li class="list-group-item"><b>Nome:</b> ${address.name || '-'}</li>
                    <li class="list-group-item"><b>Cognome:</b> ${address.surname || '-'}</li>
                    <li class="list-group-item"><b>Stato:</b> ${address.stato || '-'}</li>
                    <li class="list-group-item"><b>Città:</b> ${address.citta || '-'}</li>
                    <li class="list-group-item"><b>Provincia:</b> ${address.provincia || '-'}</li>
                    <li class="list-group-item"><b>Indirizzo:</b> ${address.via || '-'} ${address.numero_civico || ''}</li>
                    <li class="list-group-item"><b>CAP:</b> ${address.cap || '-'}</li>
                </ul>
            `;
        } else {
            shippingInfoContainer.innerHTML = `
                <h6 class="fw-bold">
                    Informazioni di spedizione
                    <i class="bi bi-truck ms-2"></i>
                </h6>
                <div class="text-danger">Dati di spedizione non disponibili</div>
            `;
        }
        modal.show();
    }

    /**
     * Mostra il modal di conferma eliminazione ordine.
     * @param {number} orderId - ID ordine da eliminare
     */
    function showDeleteOrderModal(orderId) {
        orderIdToDelete = orderId;
        const deleteOrderModal = new bootstrap.Modal(pageElement.querySelector('#deleteOrderModal'));
        deleteOrderModal.show();
    }
    
    /**
     * Mostra il modal per cambiare lo stato dell'ordine.
     * @param {number} orderId - ID ordine da modificare
     */
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

    // Bottone filtri mobile: mostra/nasconde i filtri
    const toggleFiltersBtn = pageElement.querySelector('#toggle-filters');
    const filtersCard = pageElement.querySelector('#filters-container');
    if (toggleFiltersBtn && filtersCard) {
        toggleFiltersBtn.onclick = () => {
            if (filtersCard.style.display === 'none' || filtersCard.style.display === '') {
                filtersCard.style.display = 'block';
            } else {
                filtersCard.style.display = 'none';
            }
        };
    }
    const refreshOrdersBtnMobile = pageElement.querySelector('#refresh-orders-btn-mobile');
    if (refreshOrdersBtnMobile) refreshOrdersBtnMobile.onclick = () => {
        form.reset();
        filter = { minPrice: '', maxPrice: '', startDate: '', endDate: '', status: '', sort: 'desc', customer: '' };
        applyFilters();
    };

    /**
     * Funzione toast Bootstrap (se non già presente).
     * @param {string} message - Messaggio da mostrare
     * @param {string} title - Titolo toast
     * @param {string} type - Tipo (info, success, danger, ecc.)
     */
    function showBootstrapToast(message, title = '', type = 'info') {
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.position = 'fixed';
            toastContainer.style.top = '1rem';
            toastContainer.style.right = '1rem';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type} border-0 show`;
        toast.role = 'alert';
        toast.ariaLive = 'assertive';
        toast.ariaAtomic = 'true';
        toast.style.minWidth = '250px';
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <strong>${title ? title + ': ' : ''}</strong>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    // Ritorna i metodi principali del componente
    return {
        render: () => pageElement,
        mount: () => {},
        unmount: () => {}
    };
}
