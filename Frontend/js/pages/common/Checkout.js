import CartAPI from '../../../api/cart.js';
import * as OrdersAPI from '../../../api/orders.js';
import { showBootstrapToast } from '../../components/Toast.js';
import { authService } from '../../services/authService.js';
import { ApiService } from '../../../api/auth.js';
import { router } from '../../router.js';
import { createPaymentIntent } from '../../../api/orders.js';
import { countries } from '../../assets.geo.js';

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
        total = cartItems.reduce((sum, item) => {
            let prezzoScontato = Number(item.price);
            if (item.discount && item.discount > 0 && item.discount < 100) {
                prezzoScontato = prezzoScontato * (1 - item.discount / 100);
            }
            return sum + prezzoScontato * item.quantity;
        }, 0);
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
                        <select id="stato" name="stato" class="form-select" required></select>
                    </div>
                    <div class="col-md-4">
                        <label for="provincia" class="form-label">Provincia</label>
                        <select id="provincia" name="provincia" class="form-select" required></select>
                    </div>
                    <div class="col-md-4">
                        <label for="city" class="form-label">Città</label>
                        <select id="city" name="city" class="form-select" required></select>
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
                                <td>
                                    ${item.discount && item.discount > 0 && item.discount < 100 ?
                                        `<span class='text-danger'>${(Number(item.price) * (1 - item.discount / 100)).toFixed(2)} €</span> <span class='text-decoration-line-through text-muted small ms-1'>${Number(item.price).toFixed(2)} €</span>` :
                                        `${Number(item.price).toFixed(2)} €`
                                        
                                    }
                                </td>
                                <td>${item.quantity}</td>
                                <td>
                                    ${item.discount && item.discount > 0 && item.discount < 100 ?
                                        `<span class='text-danger'>${(Number(item.price) * (1 - item.discount / 100) * item.quantity).toFixed(2)} €</span> <span class='text-decoration-line-through text-muted small ms-1'>${(Number(item.price) * item.quantity).toFixed(2)} €</span>` :
                                        `${(Number(item.price) * item.quantity).toFixed(2)} €`
                                    }
                                </td>
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
        // --- POPOLAMENTO SELECT GEOGRAFICHE ---
        const statoSelect = pageElement.querySelector('#stato');
        const provinciaSelect = pageElement.querySelector('#provincia');
        const citySelect = pageElement.querySelector('#city');
        // Popola stati
        countries.forEach(country => {
            const opt = document.createElement('option');
            opt.value = country.name;
            opt.textContent = country.name;
            statoSelect.appendChild(opt);
        });
        // Seleziona stato salvato o aggiungi se mancante
        if (deliveryInfo.stato) {
            let found = Array.from(statoSelect.options).some(opt => opt.value === deliveryInfo.stato);
            if (!found) {
                const opt = document.createElement('option');
                opt.value = deliveryInfo.stato;
                opt.textContent = deliveryInfo.stato + ' (non più disponibile)';
                statoSelect.appendChild(opt);
            }
            statoSelect.value = deliveryInfo.stato;
        }
        // Popola province in base allo stato
        function updateProvinceSelect() {
            provinciaSelect.innerHTML = '<option value="">Seleziona provincia</option>';
            citySelect.innerHTML = '<option value="">Seleziona città</option>';
            const selectedCountry = countries.find(c => c.name === statoSelect.value);
            let provinceNames = [];
            if (selectedCountry) {
                selectedCountry.provinces.forEach(prov => {
                    const opt = document.createElement('option');
                    opt.value = prov.name;
                    opt.textContent = prov.name;
                    provinciaSelect.appendChild(opt);
                    provinceNames.push(prov.name);
                });
            }
            // Se la provincia salvata non è tra le opzioni, aggiungila
            if (deliveryInfo.provincia && !provinceNames.includes(deliveryInfo.provincia)) {
                const opt = document.createElement('option');
                opt.value = deliveryInfo.provincia;
                opt.textContent = deliveryInfo.provincia + ' (non più disponibile)';
                provinciaSelect.appendChild(opt);
            }
            if (deliveryInfo.provincia) {
                provinciaSelect.value = deliveryInfo.provincia;
                updateCitySelect();
            }
        }
        // Popola città in base alla provincia
        function updateCitySelect() {
            citySelect.innerHTML = '<option value="">Seleziona città</option>';
            const selectedCountry = countries.find(c => c.name === statoSelect.value);
            const selectedProvince = selectedCountry ? selectedCountry.provinces.find(p => p.name === provinciaSelect.value) : null;
            let cityNames = [];
            if (selectedProvince) {
                selectedProvince.cities.forEach(city => {
                    const opt = document.createElement('option');
                    opt.value = city;
                    opt.textContent = city;
                    citySelect.appendChild(opt);
                    cityNames.push(city);
                });
            }
            // Se la città salvata non è tra le opzioni, aggiungila
            if (deliveryInfo.city && !cityNames.includes(deliveryInfo.city)) {
                const opt = document.createElement('option');
                opt.value = deliveryInfo.city;
                opt.textContent = deliveryInfo.city + ' (non più disponibile)';
                citySelect.appendChild(opt);
            }
            if (deliveryInfo.city) {
                citySelect.value = deliveryInfo.city;
            }
        }
        statoSelect.addEventListener('change', updateProvinceSelect);
        provinciaSelect.addEventListener('change', updateCitySelect);
        // Inizializza province e città se già presenti
        updateProvinceSelect();
        // --- FINE POPOLAMENTO SELECT ---
        // Submit del form di consegna
        const form = pageElement.querySelector('#delivery-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await userForm.requestSubmit();
            const fd = new FormData(form);
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
            // Validazione select: devono essere tra le opzioni
            function isValidOption(select, value) {
                return Array.from(select.options).some(opt => opt.value === value);
            }
            if (!isValidOption(statoSelect, fd.get('stato'))) {
                showBootstrapToast('Seleziona uno stato valido', 'Errore', 'error');
                return;
            }
            if (!isValidOption(provinciaSelect, fd.get('provincia'))) {
                showBootstrapToast('Seleziona una provincia valida', 'Errore', 'error');
                return;
            }
            if (!isValidOption(citySelect, fd.get('city'))) {
                showBootstrapToast('Seleziona una città valida', 'Errore', 'error');
                return;
            }
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
            // --- INTEGRAZIONE STRIPE ---
            try {
                const user = authService.getUser();
                if (!user || !user.id) {
                    showBootstrapToast('Utente non autenticato', 'Errore', 'error');
                    return;
                }
                // 1. Ottieni clientSecret dal backend
                const { clientSecret } = await createPaymentIntent(user.id);
                // 2. Mostra un modal per inserire la carta
                const stripe = window.Stripe('pk_test_51RQktnE3wYvtSR1NPDjHv3Tgjx3jjX92MuXRzjnL4hDUW2NJJLQaQsuXTxvQvikCNq9x7YxaeUvpaJUrZ1E7iFYt00m0ZAtC6d');
                const elements = stripe.elements();
                let cardElement = elements.getElement('card');
                if (!cardElement) {
                    cardElement = elements.create('card');
                }
                // Crea modal
                let modal = document.getElementById('stripe-modal');
                if (!modal) {
                    modal = document.createElement('div');
                    modal.id = 'stripe-modal';
                    modal.innerHTML = `
                        <div class="modal fade" tabindex="-1" id="stripeModal" aria-hidden="true">
                          <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content">
                              <div class="modal-header">
                                <h5 class="modal-title">Pagamento con Carta</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                              </div>
                              <div class="modal-body">
                                <form id="stripe-card-form">
                                  <div id="stripe-card-element" class="mb-3"></div>
                                  <button type="submit" class="btn btn-primary w-100">Paga</button>
                                </form>
                                <div id="stripe-error" class="text-danger mt-2"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                    `;
                    document.body.appendChild(modal);
                }
                // Mostra il modal
                const bsModal = new bootstrap.Modal(document.getElementById('stripeModal'));
                bsModal.show();
                // Monta l'elemento carta
                setTimeout(() => {
                    cardElement.mount('#stripe-card-element');
                }, 100);
                // Gestisci submit del form Stripe
                const stripeForm = document.getElementById('stripe-card-form');
                stripeForm.onsubmit = async (ev) => {
                    ev.preventDefault();
                    document.getElementById('stripe-error').textContent = '';
                    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                        payment_method: {
                            card: cardElement,
                            billing_details: {
                                name: deliveryInfo.name + ' ' + deliveryInfo.surname
                            }
                        }
                    });
                    if (error) {
                        document.getElementById('stripe-error').textContent = error.message;
                        return;
                    }
                    if (paymentIntent && paymentIntent.status === 'succeeded') {
                        bsModal.hide();
                        // Procedi con la creazione dell'ordine, passando paymentIntentId
                        try {
                            await OrdersAPI.checkoutOrder(user.id, paymentIntent.id);
                            showBootstrapToast('Pagamento e ordine riusciti!', 'Successo', 'success');
                            setTimeout(() => router.navigate('/myorders'), 1200);
                        } catch (error) {
                            showBootstrapToast(error.message || 'Errore nell\'invio dell\'ordine', 'Errore', 'error');
                        }
                    }
                };
            } catch (error) {
                showBootstrapToast(error.message || 'Errore nel pagamento', 'Errore', 'error');
            }
            // --- FINE INTEGRAZIONE STRIPE ---
        });
    }

    return {
        render: () => pageElement,
        mount,
        unmount: () => {}
    };
} 