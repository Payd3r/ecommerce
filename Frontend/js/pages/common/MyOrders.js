import { authService } from '../../services/authService.js';
import { showBootstrapToast } from '../../components/Toast.js';
import * as OrdersAPI from '../../../api/orders.js';

/**
 * Pagina "I miei ordini" per utenti client
 */
export async function loadClientOrdersPage() {
    const pageElement = document.createElement('div');
    pageElement.className = 'container py-4';

    const user = authService.getUser();
    if (!user || user.role !== 'client') {
        pageElement.innerHTML = `<div class="alert alert-danger mt-4">Solo i clienti possono visualizzare i propri ordini.</div>`;
        return { render: () => pageElement, mount: () => { }, unmount: () => { } };
    }

    pageElement.innerHTML = `
        <div class="row mb-4 align-items-center">
            <div class="col-12 text-center">
                <h1 class="display-5 fw-bold mb-2">I miei ordini</h1>
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
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table mb-0">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Data</th>
                                        <th>Totale</th>
                                        <th>Stato</th>
                                        <th>Azioni</th>
                                    </tr>
                                </thead>
                                <tbody id="orders-table-body"></tbody>
                            </table>
                        </div>
                        <div id="no-orders-message" class="text-center text-muted mt-4" style="display:none;">Nessun ordine trovato.</div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Modal Dettagli Ordine -->
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
                    </div>
                </div>
            </div>
        </div>
    `;

    async function loadOrders() {
        const tableBody = pageElement.querySelector('#orders-table-body');
        const noOrdersMsg = pageElement.querySelector('#no-orders-message');
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Caricamento...</td></tr>';
        try {
            const orders = await OrdersAPI.getOrdersByClient(user.id);
            if (!orders || orders.length === 0) {
                tableBody.innerHTML = '';
                noOrdersMsg.style.display = '';
                return;
            }
            noOrdersMsg.style.display = 'none';
            tableBody.innerHTML = '';
            orders.forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.id}</td>
                    <td>${order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</td>
                    <td>€ ${order.total_price ? Number(order.total_price).toFixed(2) : '-'}</td>
                    <td>${getStatusBadge(order.status)}</td>
                    <td class="text-center align-middle">
                        <button class="btn btn-link p-0 m-0 d-flex justify-content-center align-items-center" title="Dettagli ordine">
                            <i class="bi bi-eye fs-5"></i>
                        </button>
                    </td>
                `;
                row.querySelector('button').addEventListener('click', () => viewOrderDetails(order.id));
                tableBody.appendChild(row);
            });
        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Errore nel caricamento degli ordini</td></tr>';
        }
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

    async function viewOrderDetails(orderId) {
        const tableBody = pageElement.querySelector('#order-details-table-body');
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Caricamento...</td></tr>';
        try {
            const items = await OrdersAPI.getOrderItems(orderId);
            if (!items || items.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nessun prodotto trovato</td></tr>';
            } else {
                tableBody.innerHTML = '';
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
        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Errore nel caricamento dei dettagli ordine</td></tr>';
        }
        const modal = new bootstrap.Modal(pageElement.querySelector('#orderDetailsModal'));
        modal.show();
    }

    // Eventi
    pageElement.querySelector('#refresh-orders-btn').onclick = loadOrders;
    pageElement.querySelector('#back-btn').onclick = () => window.history.back();

    // Prima renderizzazione
    await loadOrders();

    return {
        render: () => pageElement,
        mount: () => {
            const backBtn = document.getElementById('back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    window.history.back();
                });
            }
        },
        unmount: () => { }
    };
}
