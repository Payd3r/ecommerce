import CartAPI from '../../../api/cart.js';
import * as OrdersAPI from '../../../api/orders.js';
import { showBootstrapToast } from '../../components/Toast.js';
import { authService } from '../../services/authService.js';

const ICONS = ['🛒', '🎁', '🧵', '🎨', '🖼️', '🪡', '🪆', '🧶', '🪵', '🪚'];

export async function loadCartPage() {
    const pageElement = document.createElement('div');
    pageElement.className = 'cart-page';
    pageElement.innerHTML = `
        <div class="container py-5">
            <h2 class="mb-4">Il tuo Carrello</h2>
            <div id="cart-content">
                <div class="text-center my-5">
                    <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Caricamento...</span></div>
                </div>
            </div>
            <div class="d-flex justify-content-end mt-4">
                <button id="checkout-btn" class="btn btn-success btn-lg" disabled>Procedi col checkout</button>
            </div>
        </div>
    `;

    async function renderCart() {
        const cartContent = document.getElementById('cart-content');
        try {
            const data = await CartAPI.getCart();
            const items = data.items || [];
            if (items.length === 0) {
                cartContent.innerHTML = `<div class='alert alert-info text-center'>Il carrello è vuoto.</div><div style='height: 20vh;'></div>`;
                document.getElementById('checkout-btn').disabled = true;
                return;
            }
            let html = `<div class="table-responsive"><table class="table align-middle">
                <thead><tr>
                    <th></th>
                    <th>Prodotto</th>
                    <th>Prezzo</th>
                    <th>Quantità</th>
                    <th>Totale</th>
                    <th></th>
                </tr></thead><tbody>`;
            let total = 0;
            items.forEach(item => {
                const icon = ICONS[Math.floor(Math.random() * ICONS.length)];
                const price = Number(item.price);
                const subtotal = price * item.quantity;
                total += subtotal;
                html += `
                    <tr data-item-id="${item.item_id}">
                        <td style="font-size:2rem;">${icon}</td>
                        <td>${item.name}</td>
                        <td>${price.toFixed(2)} €</td>
                        <td style="max-width:120px;">
                            <div class="input-group input-group-sm">
                                <button class="btn btn-outline-secondary btn-qty-minus" type="button">-</button>
                                <input type="number" class="form-control text-center cart-qty-input" value="${item.quantity}" min="1" style="width:50px;">
                                <button class="btn btn-outline-secondary btn-qty-plus" type="button">+</button>
                            </div>
                        </td>
                        <td><span class="fw-bold">${subtotal.toFixed(2)} €</span></td>
                        <td><button class="btn btn-danger btn-sm btn-remove-item"><i class="bi bi-trash"></i></button></td>
                    </tr>
                `;
            });
            html += `</tbody></table></div>`;
            html += `<div class="d-flex justify-content-end align-items-center gap-3 mt-3">
                        <span class="fs-5">Totale: <span class="fw-bold text-primary">${total.toFixed(2)} €</span></span>
                    </div>`;
            cartContent.innerHTML = html;
            document.getElementById('checkout-btn').disabled = false;
            // Se pochi prodotti, aggiungi spazio per il footer
            if (items.length < 4) {
                cartContent.innerHTML += `<div style='height: 15vh;'></div>`;
            }
        } catch (error) {
            cartContent.innerHTML = `<div class='alert alert-danger text-center'>Errore nel caricamento del carrello.</div>`;
            document.getElementById('checkout-btn').disabled = true;
        }
    }

    async function updateQuantity(itemId, newQty) {
        try {
            await CartAPI.updateItem(itemId, newQty);
            await renderCart();
            showBootstrapToast('Quantità aggiornata', 'Successo', 'success');
        } catch (error) {
            showBootstrapToast(error.message || 'Errore nell\'aggiornamento della quantità', 'Errore', 'error');
        }
    }

    async function removeItem(itemId) {
        try {
            await CartAPI.removeItem(itemId);
            await renderCart();
            showBootstrapToast('Prodotto rimosso dal carrello', 'Successo', 'success');
        } catch (error) {
            showBootstrapToast(error.message || 'Errore nella rimozione dal carrello', 'Errore', 'error');
        }
    }

    function mount() {
        renderCart();
        // Event delegation per bottoni quantità e rimozione
        document.getElementById('cart-content').addEventListener('click', async (e) => {
            const tr = e.target.closest('tr[data-item-id]');
            if (!tr) return;
            const itemId = tr.getAttribute('data-item-id');
            // Aumenta quantità
            if (e.target.classList.contains('btn-qty-plus')) {
                const input = tr.querySelector('.cart-qty-input');
                const newQty = parseInt(input.value, 10) + 1;
                await updateQuantity(itemId, newQty);
            }
            // Diminuisci quantità
            if (e.target.classList.contains('btn-qty-minus')) {
                const input = tr.querySelector('.cart-qty-input');
                const newQty = Math.max(1, parseInt(input.value, 10) - 1);
                await updateQuantity(itemId, newQty);
            }
            // Rimuovi prodotto
            if (e.target.classList.contains('btn-remove-item') || e.target.closest('.btn-remove-item')) {
                await removeItem(itemId);
            }
        });
        // Cambio manuale quantità
        document.getElementById('cart-content').addEventListener('change', async (e) => {
            if (e.target.classList.contains('cart-qty-input')) {
                const tr = e.target.closest('tr[data-item-id]');
                const itemId = tr.getAttribute('data-item-id');
                let newQty = parseInt(e.target.value, 10);
                if (isNaN(newQty) || newQty < 1) newQty = 1;
                await updateQuantity(itemId, newQty);
            }
        });
        // Checkout (implementato)
        document.getElementById('checkout-btn').addEventListener('click', async () => {
            try {
                const user = authService.getUser();
                if (!user || !user.id) {
                    showBootstrapToast('Utente non autenticato', 'Errore', 'error');
                    return;
                }
                const result = await OrdersAPI.checkoutOrder(user.id);
                await renderCart();
                showBootstrapToast(`Ordine creato! Totale: ${result.total.toFixed(2)} €`, 'Successo', 'success');
            } catch (error) {
                showBootstrapToast(error.message || 'Errore nel checkout', 'Errore', 'error');
            }
        });
    }

    return {
        render: () => pageElement,
        mount
    };
}
