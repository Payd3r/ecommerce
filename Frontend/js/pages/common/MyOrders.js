import { authService } from '../../services/authService.js';
import * as OrdersAPI from '../../../api/orders.js';
import { router } from '../../router.js';

/**
 * Carica la pagina "I miei ordini" per l'utente client autenticato.
 * Crea e restituisce il componente con la tabella ordini, i dettagli e le azioni disponibili.
 * @returns {Object} Oggetto con i metodi: render, mount, unmount
 */
export async function loadClientOrdersPage() {
    // Crea l'elemento principale della pagina
    const pageElement = document.createElement('div');
    pageElement.className = 'container py-4';

    // Recupera l'utente autenticato
    const user = authService.getUser();
    if (!user) {
        // Mostra messaggio se non autenticato
        pageElement.innerHTML = `<div class="alert alert-danger mt-4">Devi essere autenticato per visualizzare i tuoi ordini.</div>`;
        return { render: () => pageElement, mount: () => { }, unmount: () => { } };
    }

    // Struttura HTML della pagina
    pageElement.innerHTML = `
        <div class="row align-items-center">
            <div class="col-12 text-start">
                <h1 class="page-title">I miei ordini</h1>
                <p class="page-subtitle d-none d-md-block">Visualizza e gestisci i tuoi ordini.</p>
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
                        <div id="order-details-actions"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    /**
     * Carica e visualizza la lista degli ordini dell'utente.
     * Mostra un messaggio se non ci sono ordini.
     */
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
                // Aggiunge l'evento per visualizzare i dettagli dell'ordine
                row.querySelector('button').addEventListener('click', () => viewOrderDetails(order.id));
                tableBody.appendChild(row);
            });
        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Errore nel caricamento degli ordini</td></tr>';
        }
    }

    /**
     * Restituisce il badge HTML per lo stato dell'ordine.
     * @param {string} status Stato dell'ordine
     * @returns {string} HTML del badge
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
     * Visualizza il dettaglio di un ordine in un modal.
     * Mostra i prodotti, i dettagli di spedizione e permette di segnare come ricevuto.
     * @param {number} orderId ID dell'ordine da visualizzare
     */
    async function viewOrderDetails(orderId) {
        const tableBody = pageElement.querySelector('#order-details-table-body');
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Caricamento...</td></tr>';
        let order = null;
        try {
            const orders = await OrdersAPI.getOrdersByClient(user.id);
            order = orders.find(o => o.id === orderId);
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
            // Mostra le informazioni di spedizione se presenti
            const addressHtml = order && order.via ? `
                <div class="mt-4">
                    <h6 class="fw-bold">Informazioni di spedizione</h6>
                    <ul class="list-group mb-2">
                        <li class="list-group-item"><b>Nome:</b> ${order.address_name || ''}</li>
                        <li class="list-group-item"><b>Cognome:</b> ${order.address_surname || ''}</li>
                        <li class="list-group-item"><b>Indirizzo:</b> ${order.via || ''} ${order.numero_civico || ''}</li>
                        <li class="list-group-item"><b>Città:</b> ${order.citta || ''}</li>
                        <li class="list-group-item"><b>Provincia:</b> ${order.provincia || ''}</li>
                        <li class="list-group-item"><b>CAP:</b> ${order.cap || ''}</li>
                        <li class="list-group-item"><b>Stato:</b> ${order.stato || ''}</li>
                    </ul>
                </div>
            ` : '';
            const modalBody = pageElement.querySelector('#orderDetailsModal .modal-body');
            if (modalBody && !modalBody.querySelector('.list-group')) {
                modalBody.insertAdjacentHTML('beforeend', addressHtml);
            }
        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Errore nel caricamento dei dettagli ordine</td></tr>';
        }
        const modal = new bootstrap.Modal(pageElement.querySelector('#orderDetailsModal'));
        // Bottone "Segna come ricevuto" se lo stato è "spedito"
        let actionsContainer = pageElement.querySelector('#order-details-actions');
        if (!actionsContainer) {
            actionsContainer = document.createElement('div');
            actionsContainer.id = 'order-details-actions';
            pageElement.querySelector('#orderDetailsModal .modal-body').appendChild(actionsContainer);
        }
        actionsContainer.innerHTML = '';
        if (order && order.status === 'shipped') {
            const receivedBtn = document.createElement('button');
            receivedBtn.className = 'btn btn-success';
            receivedBtn.textContent = 'Segna come ricevuto';
            receivedBtn.onclick = async () => {
                await OrdersAPI.updateOrderStatus(orderId, 'delivered');
                modal.hide();
                await loadOrders();
            };
            actionsContainer.appendChild(receivedBtn);
        }
        modal.show();
    }

    // Eventi: aggiorna lista ordini
    pageElement.querySelector('#refresh-orders-btn').onclick = loadOrders;

    // Prima renderizzazione della lista ordini
    await loadOrders();

    // Restituisce l'interfaccia del componente pagina ordini
    return {
        render: () => pageElement,
        mount: () => {
            const backBtn = document.getElementById('back-btn');
            if (backBtn) backBtn.addEventListener('click', () => {
                router.navigate('/');
            });
        },
        unmount: () => { }
    };
}
