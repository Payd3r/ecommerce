// Importo la funzione getProduct
import { getProduct } from '../../../api/products.js';
import CartAPI from '../../../api/cart.js';
import { authService } from '../../services/authService.js';
import { showBootstrapToast } from '../../components/Toast.js';
import { router } from '../../router.js';

/**
 * Carica la pagina di dettaglio prodotto
 * @param {Object} params - Parametri della route (deve contenere id)
 * @returns {Object}
 */
export async function loadProductDetailsPage(params = {}) {
    const productId = params.id;
    // Array di icone come placeholder immagini
    const icons = ['🖼️', '🎨', '🧵'];
    let currentIndex = 0;
    const pageElement = document.createElement('div');
    pageElement.className = 'product-details-page';
    pageElement.innerHTML = `
        <div class="container py-5">
            <div class="row">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-4" id="back-btn"><i class="bi bi-arrow-left"></i> Torna indietro</button>
                </div>
            </div>
            <div class="row g-5">
                <div class="col-12 col-lg-7">
                    <div class="d-flex flex-column align-items-center">
                        <div id="slider-main-image" class="mb-3" style="font-size: 5rem; min-height: 20rem; display: flex; align-items: center; justify-content: center;">
                            ${icons[0]}
                        </div>
                        <div class="d-flex align-items-center gap-3 mb-2">
                            <button id="slider-prev" class="btn btn-outline-secondary btn-sm"><i class="bi bi-chevron-left"></i></button>
                            <div id="slider-thumbnails" class="d-flex gap-2">
                                ${icons.map((icon, i) => `
                                    <button class="btn btn-light p-2 border rounded thumbnail-btn${i === 0 ? ' active' : ''}" data-index="${i}" style="font-size: 3rem;">${icon}</button>
                                `).join('')}
                            </div>
                            <button id="slider-next" class="btn btn-outline-secondary btn-sm"><i class="bi bi-chevron-right"></i></button>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-lg-5 d-flex flex-column justify-content-center">
                    <div id="product-info" class="card shadow-sm p-4 border-0">
                        <div class="text-center mb-3">
                            <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Caricamento...</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    async function loadProduct() {
        try {
            const product = await getProduct(productId);
            const info = document.getElementById('product-info');
            if (!info) return;
            const isLogged = authService.isAuthenticated();
            info.innerHTML = `
                <h2 class="fw-bold mb-2">${product.name}</h2>
                <p class="text-muted mb-2">Categoria: <span class="fw-semibold">${product.category_name || '-'}</span></p>
                <p class="mb-2">Artigiano: <span class="fw-semibold">${product.artisan_name || '-'}</span></p>
                <p class="mb-3">${product.description || 'Nessuna descrizione disponibile.'}</p>
                <div class="d-flex align-items-center mb-3">
                    <span class="fs-4 fw-bold text-primary">${Number(product.price).toFixed(2)} €</span>
                </div>
                <button class="btn btn-primary w-100" id="add-to-cart-btn" ${!isLogged ? 'disabled' : ''}>Aggiungi al carrello</button>
                ${!isLogged ? '<div class="text-danger text-center mt-2 small">Devi essere loggato per aggiungere al carrello</div>' : ''}
            `;
            if (isLogged) {
                const addBtn = document.getElementById('add-to-cart-btn');
                if (addBtn) {
                    addBtn.addEventListener('click', async () => {
                        try {
                            await CartAPI.addItem(product.id, 1);
                            showBootstrapToast('Prodotto aggiunto al carrello!', 'Successo', 'success');
                            setTimeout(() => {
                                router.navigate('/cart');
                            }, 800);
                        } catch (error) {
                            showBootstrapToast(error.message || 'Errore nell\'aggiunta al carrello', 'Errore', 'error');
                        }
                    });
                }
            }
        } catch (error) {
            const info = document.getElementById('product-info');
            if (info) info.innerHTML = `<div class="alert alert-danger">Errore nel caricamento del prodotto.</div>`;
        }
    }

    function updateSlider(newIndex) {
        currentIndex = newIndex;
        const mainImage = document.getElementById('slider-main-image');
        if (mainImage) mainImage.innerHTML = icons[currentIndex];
        // Aggiorna le anteprime
        document.querySelectorAll('.thumbnail-btn').forEach((btn, i) => {
            if (i === currentIndex) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function mount() {
        loadProduct();
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.history.back();
            });
        }
        // Slider navigation
        const prevBtn = document.getElementById('slider-prev');
        const nextBtn = document.getElementById('slider-next');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const newIndex = (currentIndex - 1 + icons.length) % icons.length;
                updateSlider(newIndex);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const newIndex = (currentIndex + 1) % icons.length;
                updateSlider(newIndex);
            });
        }
        // Anteprime cliccabili
        document.querySelectorAll('.thumbnail-btn').forEach((btn, i) => {
            btn.addEventListener('click', () => {
                updateSlider(i);
            });
        });
    }

    return {
        render: () => pageElement,
        mount
    };
} 