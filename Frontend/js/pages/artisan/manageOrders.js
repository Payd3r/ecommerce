import { getOrdersByArtisan } from '../../../api/orders.js';
import { authService } from '../../services/authService.js';

export async function loadManageOrdersPage() {
    const pageElement = document.createElement('div');
    pageElement.className = 'container py-4';

    const user = authService.getUser();
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
    };

    // Stati disponibili (puoi modificarli in base al backend)
    const statusOptions = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];

    // Carica ordini
    try {
        orders = await getOrdersByArtisan(user.id);
        filteredOrders = [...orders];
    } catch (e) {
        filteredOrders = [];
    }

    // Funzione per filtrare e ordinare
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
            return ok;
        });
        filteredOrders.sort((a, b) => {
            if (filter.sort === 'asc') return new Date(a.created_at) - new Date(b.created_at);
            else return new Date(b.created_at) - new Date(a.created_at);
        });
        currentPage = 1;
        renderTable();
    }

    // Funzione per renderizzare la tabella
    function renderTable() {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        const pageOrders = filteredOrders.slice(start, end);
        const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
        const tableBody = pageElement.querySelector('#orders-table-body');
        tableBody.innerHTML = pageOrders.length === 0 ?
            `<tr><td colspan="7" class="text-center">Nessun ordine trovato</td></tr>` :
            pageOrders.map(o => `
                <tr>
                    <td class="text-center">${o.id}</td>
                    <td class="text-center">${o.created_at ? o.created_at.split('T')[0] : '-'}</td>
                    <td class="text-center">${o.total_price} €</td>
                    <td class="text-center">${o.status}</td>
                    <td class="text-center">${o.client_id}</td>
                    <td class="text-center">
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">Azioni</button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#">Visualizza</a></li>
                                <li><a class="dropdown-item" href="#">Modifica</a></li>
                                <li><a class="dropdown-item text-danger" href="#">Elimina</a></li>
                            </ul>
                        </div>
                    </td>
                </tr>
            `).join('');
        // Paginazione
        const pagination = pageElement.querySelector('#orders-pagination');
        pagination.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            pagination.innerHTML += `<li class="page-item${i === currentPage ? ' active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }
    }

    // HTML
    pageElement.innerHTML = `
        <div class="mb-4 d-flex align-items-center justify-content-between">
            <h1 class="h3">Gestione Ordini</h1>
            <a href="/artisan/dashboard" class="btn btn-outline-primary" data-route>Torna alla Dashboard</a>
        </div>
        <div class="row g-4">
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">Filtri</div>
                    <div class="card-body">
                        <form id="filters-form">
                            <div class="mb-3">
                                <label class="form-label">Prezzo totale (range)</label>
                                <div class="input-group">
                                    <input type="number" min="0" step="0.01" class="form-control" id="minPrice" placeholder="Min" />
                                    <input type="number" min="0" step="0.01" class="form-control" id="maxPrice" placeholder="Max" />
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Data creazione (range)</label>
                                <div class="input-group">
                                    <input type="date" class="form-control" id="startDate" />
                                    <input type="date" class="form-control" id="endDate" />
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Stato</label>
                                <select class="form-select" id="status">
                                    <option value="">Tutti</option>
                                    ${statusOptions.map(s => `<option value="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Ordinamento</label>
                                <select class="form-select" id="sort">
                                    <option value="desc">Dal più recente</option>
                                    <option value="asc">Dal meno recente</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Applica filtri</button>
                        </form>
                    </div>
                </div>
            </div>
            <div class="col-md-8">
                <div class="card h-100">
                    <div class="card-header">Ordini</div>
                    <div class="card-body p-0">
                        <table class="table table-bordered align-middle mb-0">
                            <thead>
                                <tr>
                                    <th class="text-center">ID</th>
                                    <th class="text-center">Data</th>
                                    <th class="text-center">Totale</th>
                                    <th class="text-center">Stato</th>
                                    <th class="text-center">Cliente</th>
                                    <th class="text-center">Azioni</th>
                                </tr>
                            </thead>
                            <tbody id="orders-table-body"></tbody>
                        </table>
                    </div>
                    <div class="card-footer">
                        <nav>
                            <ul class="pagination justify-content-center mb-0" id="orders-pagination"></ul>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Eventi filtri
    const form = pageElement.querySelector('#filters-form');
    form.addEventListener('submit', e => {
        e.preventDefault();
        filter.minPrice = form.minPrice.value;
        filter.maxPrice = form.maxPrice.value;
        filter.startDate = form.startDate.value;
        filter.endDate = form.endDate.value;
        filter.status = form.status.value;
        filter.sort = form.sort.value;
        applyFilters();
    });

    // Eventi paginazione
    pageElement.querySelector('#orders-pagination').addEventListener('click', e => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            currentPage = parseInt(e.target.dataset.page);
            renderTable();
        }
    });

    // Prima renderizzazione
    applyFilters();

    return {
        render: () => pageElement,
        mount: () => {},
        unmount: () => {}
    };
}
