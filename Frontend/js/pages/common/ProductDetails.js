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
                        <div id="slider-main-image" class="mb-3" style="min-height: 20rem; display: flex; align-items: center; justify-content: center;"></div>
                        <div class="d-flex align-items-center gap-3 mb-2">
                            <div id="slider-thumbnails" class="d-flex gap-2"></div>
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

    let images = [];

    async function loadProduct() {
        try {
            const product = await getProduct(productId);
            images = product.images && product.images.length > 0 ? product.images : [];
            renderSlider(0);
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

    function renderSlider(idx) {
        currentIndex = idx;
        const mainImage = document.getElementById('slider-main-image');
        const thumbs = document.getElementById('slider-thumbnails');
        if (!mainImage || !thumbs) return;
        if (images.length > 0) {
            mainImage.innerHTML = `
              <div style="width:100%;height:340px;display:flex;align-items:center;justify-content:center; background:#f8f9fa; border-radius:12px;">
                <img src="http://localhost:3005${images[currentIndex].url}" alt="img" style="max-width:100%; max-height:100%; width:auto; height:auto; object-fit:contain; display:block;" />
              </div>
            `;
            // Wrapping delle anteprime ogni 5 su mobile
            let thumbsHtml = '';
            if (window.innerWidth < 768) {
                for (let i = 0; i < images.length; i += 5) {
                    thumbsHtml += '<div class="d-flex mb-1">' +
                        images.slice(i, i + 5).map((img, j) => `
                            <img src="http://localhost:3005${img.url}" data-idx="${i + j}" class="rounded border thumb-img${i + j === currentIndex ? ' border-primary border-2' : ''}" style="width:44px; height:44px; object-fit:cover; cursor:pointer; margin-right:4px;" alt="thumb" />
                        `).join('') +
                        '</div>';
                }
            } else {
                thumbsHtml = images.map((img, i) => `
                    <img src="http://localhost:3005${img.url}" data-idx="${i}" class="rounded border thumb-img${i === currentIndex ? ' border-primary border-2' : ''}" style="width:56px; height:56px; object-fit:cover; cursor:pointer; margin-right:8px;" alt="thumb" />
                `).join('');
            }
            thumbs.innerHTML = thumbsHtml;
        } else {
            mainImage.innerHTML = `<div style="font-size: 5rem; color: #bbb;">🖼️</div>`;
            thumbs.innerHTML = '';
        }
        // Eventi anteprime
        thumbs.querySelectorAll('.thumb-img').forEach(thumb => {
            thumb.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-idx'));
                renderSlider(idx);
            });
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
    }

    return {
        render: () => pageElement,
        mount
    };
} 