import CartAPI from '../../../api/cart.js';
import { showBootstrapToast } from '../../components/Toast.js';
import { authService } from '../../services/authService.js';
import { router } from '../../router.js';


export async function loadCartPage() {
    const pageElement = document.createElement('div');
    pageElement.className = 'cart-page';
    pageElement.innerHTML = `
        <div class="container py-5">
            <h1 class="page-title mb-2">Il tuo Carrello</h1>
            <div class="page-subtitle mb-4">Rivedi i prodotti selezionati prima di procedere all'acquisto.</div>
            <div id="cart-content">
                <div class="text-center my-5">
                    <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Caricamento...</span></div>
                </div>
            </div>
            <div class="d-flex justify-content-center mt-4">
                <button id="checkout-btn" class="btn btn-success btn-lg w-100 w-sm-auto" disabled style="max-width:340px;">Procedi col checkout</button>
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
            let html = `<div class="table-responsive"><table class="table align-middle mb-0 cart-table-custom">
                <thead><tr>
                    <th class="d-none d-sm-table-cell"></th>
                    <th>Prodotto</th>
                    <th class="text-nowrap d-none d-sm-table-cell">Prezzo</th>
                    <th class="text-nowrap text-center">Quantità</th>
                    <th class="text-nowrap text-center">Totale</th>
                    <th></th>
                </tr></thead><tbody>`;
            let total = 0;
            items.forEach(item => {
                const price = Number(item.price);
                let prezzoScontato = price;
                if (item.discount && item.discount > 0 && item.discount < 100) {
                    prezzoScontato = price * (1 - item.discount / 100);
                }
                const subtotal = prezzoScontato * item.quantity;
                total += subtotal;
                html += `
                    <tr data-item-id="${item.item_id}">
                        <td class="d-none d-sm-table-cell" style="width:48px;">
                            ${item.image ?
                                `<img src=\"${item.image.url || item.image}\" alt=\"img\" style=\"width:40px; height:40px; object-fit:cover; border-radius:8px; border:1.5px solid #e0e0e0;\" />` :
                                '<span style="font-size:1.5rem;">🛒</span>'
                            }
                        </td>
                        <td style="min-width:100px; font-size:0.98rem;">
                            ${item.name}
                        </td>
                        <td class="d-none d-sm-table-cell" style="width:80px; font-size:0.98rem;">
                            ${item.discount && item.discount > 0 && item.discount < 100 ?
                                `<span class='text-danger'>${prezzoScontato.toFixed(2)} €</span> <span class='text-decoration-line-through text-muted small ms-1'>${price.toFixed(2)} €</span>` :
                                `${price.toFixed(2)} €`
                            }
                        </td>
                        <td style="max-width:60px;" class="text-center">
                            <div class="input-group input-group-sm flex-nowrap">
                                <button class="btn btn-outline-secondary btn-qty-minus px-2" type="button">-</button>
                                <input type="number" class="form-control text-center cart-qty-input px-1" value="${item.quantity}" min="1" style="width:36px;">
                                <button class="btn btn-outline-secondary btn-qty-plus px-2" type="button">+</button>
                            </div>
                        </td>
                        <td style="width:100px;" class="text-center"><span class="fw-bold">
                            ${item.discount && item.discount > 0 && item.discount < 100 ?
                                `<span class='text-danger'>${subtotal.toFixed(2)} €</span> <span class='text-decoration-line-through text-muted small ms-1'>${(price * item.quantity).toFixed(2)} €</span>` :
                                `${subtotal.toFixed(2)} €`
                            }
                        </span></td>
                        <td><button class="btn btn-danger btn-sm btn-remove-item"><i class="bi bi-trash"></i></button></td>
                    </tr>
                `;
            });
            html += `</tbody></table></div>`;
            html += `<div class="cart-total-row d-flex flex-column flex-sm-row justify-content-sm-end align-items-center gap-2 mt-3 text-center">
                        <span class="fs-5">Totale: <span class="fw-bold text-primary">${total.toFixed(2)} €</span></span>
                    </div>`;
            cartContent.innerHTML = html + `
            <style>
            @media (max-width: 576px) {
                .cart-table-custom th, .cart-table-custom td { padding: 0.35rem 0.3rem; font-size: 0.97rem; }
                .cart-table-custom input[type=number] { font-size: 0.97rem; }
                .cart-total-row { justify-content: center !important; text-align: center; }
                .cart-table-custom th:nth-child(4), .cart-table-custom th:nth-child(5),
                .cart-table-custom td:nth-child(4), .cart-table-custom td:nth-child(5) {
                    text-align: center !important;
                }
            }
            </style>`;
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
                // Naviga alla pagina di checkout invece di inviare subito l'ordine
                router.navigate('/checkout');
            } catch (error) {
                showBootstrapToast(error.message || 'Errore nel checkout', 'Errore', 'error');
            }
        });
    }

    // Fine della funzione loadCartPage
    return {
        render: () => pageElement,
        mount
    };
}
