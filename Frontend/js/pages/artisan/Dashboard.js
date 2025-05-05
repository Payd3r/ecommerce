// Importo le dipendenze
import { authService } from '../../services/authService.js';
import { getOrdersByArtisan, getMonthlySalesByArtisan, getMonthlyOrdersByArtisan } from '../../../api/orders.js';
import { getProductsByArtisan } from '../../../api/products.js';
import UsersAPI from '../../../api/users.js';
import { showBootstrapToast } from '../../components/Toast.js';

/**
 * Carica la dashboard dell'artigiano
 * @returns {Object} - Oggetto con i metodi del componente
 */
export async function loadArtisanDashboardPage() {
    const pageElement = document.createElement('div');
    pageElement.className = 'container py-4';

    const user = authService.getUser();
    let products = [];
    let orders = [];
    let salesStats = [];
    let ordersStats = [];
    let notifications = [];
    let clientNames = {};

    // Carica dati reali
    try {
        const [productsRes, ordersRes, salesStatsRes, ordersStatsRes] = await Promise.all([
            getProductsByArtisan(user.id, { limit: 8 }),
            getOrdersByArtisan(user.id),
            getMonthlySalesByArtisan(user.id),
            getMonthlyOrdersByArtisan(user.id)
        ]);
        products = productsRes.products || [];
        orders = ordersRes || [];
        salesStats = salesStatsRes || [];
        ordersStats = ordersStatsRes || [];
    } catch (e) {
        showBootstrapToast('Errore nel caricamento dati dashboard', 'Errore', 'danger');
    }

    // Calcoli rapidi
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const totalSales = salesStats.reduce((sum, s) => sum + Number(s.total_sales), 0).toFixed(2);
    // Calcolo vendite mensili (ultimo mese disponibile)
    let monthlySales = 0;
    if (salesStats.length > 0) {
        monthlySales = Number(salesStats[salesStats.length - 1].total_sales).toFixed(2);
    }

    // Ultimi ordini (max 5)
    const latestOrders = orders.slice(0, 5);
    // Preleva tutti i client_id unici
    const clientIds = [...new Set(latestOrders.map(o => o.client_id))];
    // Fetch nomi clienti
    await Promise.all(clientIds.map(async (id) => {
        try {
            const data = await UsersAPI.getUser(id);
            clientNames[id] = data.name || `Cliente #${id}`;
        } catch {
            clientNames[id] = `Cliente #${id}`;
        }
    }));

    // HTML
    pageElement.innerHTML = `
        <div class="mb-4">
            <h1 class="display-5">Dashboard Artigiano</h1>
            <p class="lead">Benvenuto, <b>${user.name}</b>!</p>
        </div>

        ${notifications.length > 0 ? `
        <div class="alert alert-warning">
            <ul class="mb-0">
                ${notifications.map(n => `<li>${n}</li>`).join('')}
            </ul>
        </div>` : ''}

        <div class="row g-4 mb-4 align-items-stretch">
            <div class="col-lg-12">
                <div class="row g-3">
                    <div class="col-3">
                        <div class="card text-bg-primary h-100">
                            <div class="card-body">
                                <h5 class="card-title">Prodotti</h5>
                                <p class="card-text fs-2">${totalProducts}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="card text-bg-success h-100">
                            <div class="card-body">
                                <h5 class="card-title">Ordini</h5>
                                <p class="card-text fs-2">${totalOrders}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="card text-bg-warning h-100">
                            <div class="card-body">
                                <h5 class="card-title">Vendite totali</h5>
                                <p class="card-text fs-2">${totalSales} €</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="card text-bg-info h-100">
                            <div class="card-body">
                                <h5 class="card-title">Vendite mensili</h5>
                                <p class="card-text fs-2">${monthlySales} €</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>            
        </div>

        <div class="row g-4 mb-4">
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span>Ultimi ordini</span>
                        <a href="/artisan/manage-orders" class="btn btn-sm btn-outline-info" data-route>Vai a Gestione Ordini</a>
                    </div>
                    <div class="card-body p-0">
                        <table class="table mb-0">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Cliente</th>
                                    <th>Totale</th>
                                    <th>Stato</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${latestOrders.length === 0 ? `
                                    <tr><td colspan="5" class="text-center">Nessun ordine recente</td></tr>
                                ` : latestOrders.map(o => `
                                    <tr>
                                        <td>${o.created_at ? o.created_at.split('T')[0] : '-'}</td>
                                        <td>${clientNames[o.client_id] || '-'}</td>
                                        <td>${o.total_price} €</td>
                                        <td>${o.status}</td>
                                        <td><a href="/artisan/orders/${o.id}" class="btn btn-sm btn-outline-info" data-route>Dettagli</a></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span>I tuoi prodotti</span>
                        <a href="/artisan/manage-products" class="btn btn-sm btn-outline-info" data-route>Vai a Gestione Prodotti</a>
                    </div>
                    <div class="card-body p-0">
                        <table class="table mb-0">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Prezzo</th>
                                    <th>Stato</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${products.length === 0 ? `
                                    <tr><td colspan="4" class="text-center">Nessun prodotto</td></tr>
                                ` : products.map(p => `
                                    <tr>
                                        <td>${p.name}</td>
                                        <td>${p.price} €</td>
                                        <td>${p.stock > 0 ? 'Disponibile' : 'Non disponibile'}</td>
                                        <td>
                                            <a href="/artisan/products/${p.id}/edit" class="btn btn-sm btn-outline-primary" data-route>Modifica</a>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4 mb-4">
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header">Andamento vendite (ultimi mesi)</div>
                    <div class="card-body">
                        <canvas id="salesChart" height="200"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header">Numero ordini (ultimi mesi)</div>
                    <div class="card-body">
                        <canvas id="ordersChart" height="200"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Grafici Chart.js
    setTimeout(() => {
        if (window.Chart) {
            // Vendite
            const salesLabels = salesStats.map(s => s.month);
            const salesData = salesStats.map(s => Number(s.total_sales));
            const salesCtx = pageElement.querySelector('#salesChart');
            if (salesCtx) {
                new Chart(salesCtx, {
                    type: 'bar',
                    data: {
                        labels: salesLabels,
                        datasets: [{
                            label: 'Vendite mensili (€)',
                            data: salesData,
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }
            // Ordini
            const ordersLabels = ordersStats.map(s => s.month);
            const ordersData = ordersStats.map(s => Number(s.total_orders));
            const ordersCtx = pageElement.querySelector('#ordersChart');
            if (ordersCtx) {
                new Chart(ordersCtx, {
                    type: 'line',
                    data: {
                        labels: ordersLabels,
                        datasets: [{
                            label: 'Numero ordini',
                            data: ordersData,
                            backgroundColor: 'rgba(255, 193, 7, 0.3)',
                            borderColor: 'rgba(255, 193, 7, 1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.3
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }
        }
    }, 200);

    return {
        render: () => pageElement,
        mount: () => {},
        unmount: () => {}
    };
} 