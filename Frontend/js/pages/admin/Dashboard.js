// Importo le dipendenze
import { authService } from '../../services/authService.js';
import { showBootstrapToast } from '../../components/Toast.js';
import UsersAPI from '../../../api/users.js';
import { getProducts } from '../../../api/products.js';
import { getOrders } from '../../../api/orders.js';
import { getIssues } from '../../../api/issues.js';

/**
 * Carica la dashboard dell'amministratore
 * @returns {Object} - Oggetto con i metodi del componente
 */
export async function loadAdminDashboardPage() {
    const pageElement = document.createElement('div');
    pageElement.className = 'container py-4';

    const user = authService.getUser();
    // Statistiche
    let artisansCount = 0;
    let clientsCount = 0;
    let adminsCount = 0;
    let productsCount = 0;
    let ordersCount = 0;
    let ordersProcessingCount = 0;
    let latestUsers = [];
    let latestOrders = [];
    let productsRes = { products: [] };
    let ordersRes = { orders: [] };
    let issues = [];

    // Carica dati reali
    try {
        const counts = await UsersAPI.getCounts();
        artisansCount = counts.artisans || 0;
        clientsCount = counts.clients || 0;
        adminsCount = counts.admins || 0;

        // Ultimi utenti (opzionale, qui lasciamo la logica esistente per la tabella)
        const usersRes = await UsersAPI.getUsers({ limit: 5, orderBy: 'created_at', orderDir: 'desc' });
        latestUsers = usersRes.users || usersRes.data || [];

        // Prodotti e ordini: logica invariata
        const [prodRes, ordRes] = await Promise.all([
            getProducts({ limit: 1 }),
            getOrders()
        ]);
        productsRes = prodRes;
        ordersRes = ordRes;
        // Estrai conteggi prodotti
        if (productsRes.products) {
            productsCount = productsRes.pagination?.total || productsRes.products.length;
        } else if (Array.isArray(productsRes)) {
            productsCount = productsRes.length;
        } else {
            productsCount = productsRes.total || productsRes.count || 0;
        }
        // Estrai ordini
        let allOrders = [];
        if (ordersRes.orders) {
            allOrders = ordersRes.orders;
        } else if (Array.isArray(ordersRes)) {
            allOrders = ordersRes;
        } else if (ordersRes.data) {
            allOrders = ordersRes.data;
        }
        ordersCount = allOrders.length;
        ordersProcessingCount = allOrders.filter(o => o.status === 'pending' || o.status === 'processing').length;
        latestOrders = allOrders.slice(0, 5);

        // Estrai segnalazioni
        issues = (await getIssues()).issues || [];
    } catch (e) {
        showBootstrapToast('Errore nel caricamento dati dashboard', 'Errore', 'danger');
        productsRes = { products: [] };
        ordersRes = { orders: [] };
        issues = [];
    }

    pageElement.innerHTML = `
        <div class="mb-4">
            <h1 class="display-5">Dashboard Amministratore</h1>
            <p class="lead">Benvenuto, <b>${user.name}</b>!</p>
        </div>
        <div class="row g-4 mb-4 align-items-stretch">
            <div class="col-12">
                <div class="row g-3">
                    <div class="col-4 col-md-2">
                        <div class="card bg-success text-dark h-100 bg-opacity-10">
                            <div class="card-body text-center">
                                <div class="display-4 mb-2">🧑‍🎨</div>
                                <h6 class="card-title">Artigiani</h6>
                                <p class="card-text fs-4">${artisansCount}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-4 col-md-2">
                        <div class="card bg-secondary text-dark h-100 bg-opacity-10">
                            <div class="card-body text-center">
                                <div class="display-4 mb-2">🧑‍💼</div>
                                <h6 class="card-title">Clienti</h6>
                                <p class="card-text fs-4">${clientsCount}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-4 col-md-2">
                        <div class="card bg-dark text-dark h-100 bg-opacity-10">
                            <div class="card-body text-center">
                                <div class="display-4 mb-2">🛡️</div>
                                <h6 class="card-title">Admin</h6>
                                <p class="card-text fs-4">${adminsCount}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-4 col-md-2">
                        <div class="card bg-warning text-dark h-100 bg-opacity-10">
                            <div class="card-body text-center">
                                <div class="display-4 mb-2">📦</div>
                                <h6 class="card-title">Prodotti</h6>
                                <p class="card-text fs-4">${productsCount}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-4 col-md-2">
                        <div class="card bg-info text-dark h-100 bg-opacity-10">
                            <div class="card-body text-center">
                                <div class="display-4 mb-2">🛒</div>
                                <h6 class="card-title">Ordini</h6>
                                <p class="card-text fs-4">${ordersCount}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-4 col-md-2">
                        <div class="card bg-danger text-dark h-100 bg-opacity-10">
                            <div class="card-body text-center">
                                <div class="display-4 mb-2">⏳</div>
                                <h6 class="card-title">Ordini in lavorazione</h6>
                                <p class="card-text fs-4">${ordersProcessingCount}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row g-4 mb-4">
            <div class="col-12">
                <div class="card p-4">
                    <div class="row g-3">
                        <div class="col-md-3 d-grid">
                            <a href="/admin/users-management" class="btn btn-outline-primary btn-lg" data-route>Gestisci utenti</a>
                        </div>
                        <div class="col-md-3 d-grid">
                            <a href="/admin/products-management" class="btn btn-outline-success btn-lg" data-route>Gestisci prodotti</a>
                        </div>
                        <div class="col-md-3 d-grid">
                            <a href="/admin/categories-management" class="btn btn-outline-warning btn-lg" data-route>Gestisci categorie</a>
                        </div>
                        <div class="col-md-3 d-grid">
                            <a href="/admin/orders-management" class="btn btn-outline-info btn-lg" data-route>Gestisci ordini</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row g-4 mb-4">
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span>Ultimi utenti registrati</span>
                        <a href="/admin/users-management" class="btn btn-sm btn-outline-primary" data-route>Vedi tutti</a>
                    </div>
                    <div class="card-body p-0 table-responsive">
                        <table class="table mb-0">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Ruolo</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${latestUsers.length === 0 ? `
                                    <tr><td colspan="3" class="text-center">Nessun utente recente</td></tr>
                                ` : latestUsers.map(u => `
                                    <tr>
                                        <td>${u.name}</td>
                                        <td>${u.role}</td>
                                        <td><a href="/admin/users-management?search=${encodeURIComponent(u.name)}" class="btn btn-sm btn-outline-primary" data-route>Dettagli</a></td>
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
                        <span>Ultimi ordini</span>
                        <a href="/admin/orders-management" class="btn btn-sm btn-outline-info" data-route>Vedi tutti</a>
                    </div>
                    <div class="card-body p-0 table-responsive">
                        <table class="table mb-0">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Totale</th>
                                    <th>Stato</th>
                                    <th>Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${latestOrders.length === 0 ? `
                                    <tr><td colspan="4" class="text-center">Nessun ordine recente</td></tr>
                                ` : latestOrders.map(o => `
                                    <tr>
                                        <td>${o.client_name || o.client_id || '-'}</td>
                                        <td>${o.total_price} €</td>
                                        <td>${o.status}</td>
                                        <td>${o.created_at ? o.created_at.split('T')[0] : '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <!-- Nuove tabelle: Prodotti e Segnalazioni -->
        <div class="row g-4 mb-4">
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span>Ultimi prodotti aggiunti</span>
                        <a href="/admin/products-management" class="btn btn-sm btn-outline-success" data-route>Vedi tutti</a>
                    </div>
                    <div class="card-body p-0">
                        <table class="table mb-0">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Categoria</th>
                                    <th>Prezzo</th>
                                    <th>Stato</th>
                                    <th>Creato il</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(productsRes.products && productsRes.products.length > 0 ? productsRes.products.slice(0,5) : []).length === 0 ? `
                                    <tr><td colspan="5" class="text-center">Nessun prodotto recente</td></tr>
                                ` : productsRes.products.slice(0,5).map(p => `
                                    <tr>
                                        <td>${p.name}</td>
                                        <td>${p.category_name || p.category || '-'}</td>
                                        <td>${p.price} €</td>
                                        <td>${p.status || '-'}</td>
                                        <td>${p.created_at ? p.created_at.split('T')[0] : '-'}</td>
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
                        <span>Segnalazioni</span>
                        <a href="/admin/issues-management" class="btn btn-sm btn-outline-danger" data-route>Vedi tutte</a>
                    </div>
                    <div class="card-body p-0">
                        <table class="table mb-0">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Titolo</th>
                                    <th>Cliente</th>
                                    <th>Stato</th>
                                    <th>Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(issues.slice(0, 5).length === 0) ? `
                                    <tr><td colspan="5" class="text-center">Nessuna segnalazione recente</td></tr>
                                ` : issues.slice(0, 5).map(issue => `
                                    <tr>
                                        <td>${issue.id_issue}</td>
                                        <td>${issue.title}</td>
                                        <td>${issue.client_name || '-'}</td>
                                        <td>${issue.status || '-'}</td>
                                        <td>${issue.created_at ? issue.created_at.split('T')[0] : '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    return {
        render: () => pageElement,
        mount: () => {},
        unmount: () => {}
    };
}