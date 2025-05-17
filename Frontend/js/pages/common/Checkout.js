import CartAPI from '../../../api/cart.js';
import * as OrdersAPI from '../../../api/orders.js';
import { showBootstrapToast } from '../../components/Toast.js';
import { authService } from '../../services/authService.js';
import { ApiService } from '../../../api/auth.js';
import { router } from '../../router.js';

export async function loadCheckoutPage() {
    const pageElement = document.createElement('div');
    pageElement.className = 'checkout-page';
    
    // Stato per i dati del form
    let deliveryInfo = {
        stato: '',
        provincia: '',
        city: '',
        address: '', // via + numero_civico
        zip: '',
        phone: '',
        name: '',
        surname: ''
    };
    let cartItems = [];
    let total = 0;
    let userProfile = {};

    // Prova a precompilare con i dati address (API /address/me)
    try {
        const address = await ApiService.getAddress();
        if (address) {
            deliveryInfo.stato = address.stato || '';
            deliveryInfo.provincia = address.provincia || '';
            deliveryInfo.city = address.citta || '';
            deliveryInfo.zip = address.cap || '';
            deliveryInfo.name = address.name || '';
            deliveryInfo.surname = address.surname || '';
            // Unisco via e numero_civico in un solo campo
            deliveryInfo.address = address.via ? `${address.via}${address.numero_civico ? ' ' + address.numero_civico : ''}` : '';
        }
    } catch {}
    // Prova a precompilare telefono dal profilo
    try {
        userProfile = await ApiService.getProfile();
        deliveryInfo.phone = userProfile.phone || '';
    } catch {}

    // Carica carrello
    try {
        const data = await CartAPI.getCart();
        cartItems = data.items || [];
        total = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    } catch {
        cartItems = [];
        total = 0;
    }

    if (cartItems.length === 0) {
        pageElement.innerHTML = `<div class='alert alert-info text-center mt-5'>Il carrello è vuoto.</div>`;
        return { render: () => pageElement, mount: () => {}, unmount: () => {} };
    }

    pageElement.innerHTML = `
        <div class="container py-5">
            <h2 class="mb-4">Checkout - Informazioni di Consegna</h2>
            <form id="user-form" class="mb-4">
                <div class="row g-3 align-items-end">
                    <div class="col-md-4">
                        <label for="userName" class="form-label">Nome</label>
                        <input type="text" class="form-control" id="userName" name="userName" value="${deliveryInfo.name || ''}" required>
                    </div>
                    <div class="col-md-4">
                        <label for="userSurname" class="form-label">Cognome</label>
                        <input type="text" class="form-control" id="userSurname" name="userSurname" value="${deliveryInfo.surname || ''}" required>
                    </div>
                    <div class="col-md-4">
                        <label for="userEmail" class="form-label">Email</label>
                        <input type="email" class="form-control" id="userEmail" name="userEmail" value="${userProfile.email || ''}" required readonly>
                    </div>
                </div>
            </form>
            <form id="delivery-form" class="mb-4">
                <div class="row g-3">
                    <div class="col-md-4">
                        <label for="stato" class="form-label">Stato</label>
                        <input type="text" class="form-control" id="stato" name="stato" value="${deliveryInfo.stato}" required>
                    </div>
                    <div class="col-md-4">
                        <label for="provincia" class="form-label">Provincia</label>
                        <input type="text" class="form-control" id="provincia" name="provincia" value="${deliveryInfo.provincia}" required>
                    </div>
                    <div class="col-md-4">
                        <label for="city" class="form-label">Città</label>
                        <input type="text" class="form-control" id="city" name="city" value="${deliveryInfo.city}" required>
                    </div>
                    <div class="col-md-6">
                        <label for="address" class="form-label">Indirizzo (via e numero civico)</label>
                        <input type="text" class="form-control" id="address" name="address" value="${deliveryInfo.address}" required>
                    </div>
                    <div class="col-md-3">
                        <label for="zip" class="form-label">CAP</label>
                        <input type="text" class="form-control" id="zip" name="zip" value="${deliveryInfo.zip}" required>
                    </div>
                </div>
                <div class="mt-4 d-flex justify-content-end">
                    <button type="submit" class="btn btn-success btn-lg">Conferma Ordine</button>
                </div>
            </form>
            <h4 class="mb-3">Riepilogo Carrello</h4>
            <div class="table-responsive mb-3">
                <table class="table align-middle mb-0 cart-table-custom">
                    <thead><tr>
                        <th>Prodotto</th>
                        <th class="text-nowrap">Prezzo</th>
                        <th class="text-nowrap">Quantità</th>
                        <th class="text-nowrap">Totale</th>
                    </tr></thead>
                    <tbody>
                        ${cartItems.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${Number(item.price).toFixed(2)} €</td>
                                <td>${item.quantity}</td>
                                <td>${(Number(item.price) * item.quantity).toFixed(2)} €</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="cart-total-row d-flex flex-column flex-sm-row justify-content-sm-end align-items-center gap-2 mt-3 text-center">
                <span class="fs-5">Totale: <span class="fw-bold text-primary">${total.toFixed(2)} €</span></span>
            </div>
        </div>
    `;

    function mount() {
        // Gestione submit user-form (aggiorna nome se modificato)
        const userForm = pageElement.querySelector('#user-form');
        userForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Nome e cognome sono modificabili
            const name = userForm.userName.value.trim();
            const surname = userForm.userSurname.value.trim();
            if ((name && name !== (deliveryInfo.name || '')) || (surname && surname !== (deliveryInfo.surname || ''))) {
                deliveryInfo.name = name;
                deliveryInfo.surname = surname;
                showBootstrapToast('Nome e/o cognome aggiornati', 'Info', 'info');
            }
        });
        // Submit del form di consegna
        const form = pageElement.querySelector('#delivery-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Aggiorna nome se modificato prima di procedere
            await userForm.requestSubmit();
            // Prendi i dati dal form
            const fd = new FormData(form);
            // Splitta address in via e numero_civico
            let via = '';
            let numero_civico = '';
            const addressField = fd.get('address').trim();
            const match = addressField.match(/^(.*?)(?:\s+(\d+))?$/);
            if (match) {
                via = match[1].trim();
                numero_civico = match[2] ? match[2].trim() : '';
            } else {
                via = addressField;
            }
            // Salva/aggiorna indirizzo
            try {
                await ApiService.saveAddress({
                    stato: fd.get('stato'),
                    provincia: fd.get('provincia'),
                    citta: fd.get('city'),
                    via,
                    cap: fd.get('zip'),
                    numero_civico: numero_civico || '0',
                    name: deliveryInfo.name,
                    surname: deliveryInfo.surname
                });
            } catch (err) {
                showBootstrapToast('Errore nel salvataggio dell\'indirizzo', 'Errore', 'error');
                return;
            }
            // Invia ordine
            try {
                const user = authService.getUser();
                if (!user || !user.id) {
                    showBootstrapToast('Utente non autenticato', 'Errore', 'error');
                    return;
                }
                await OrdersAPI.checkoutOrder(user.id);
                showBootstrapToast('Ordine inviato con successo!', 'Successo', 'success');
                setTimeout(() => router.navigate('/myorders'), 1200);
            } catch (error) {
                showBootstrapToast(error.message || 'Errore nell\'invio dell\'ordine', 'Errore', 'error');
            }
        });
    }

    return {
        render: () => pageElement,
        mount,
        unmount: () => {}
    };
} 