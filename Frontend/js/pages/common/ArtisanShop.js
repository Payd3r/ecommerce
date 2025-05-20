import { getProductsByArtisan } from '../../../api/products.js';
import UsersAPI from '../../../api/users.js';
import { loader } from '../../components/Loader.js';
import { showBootstrapToast } from '../../components/Toast.js';

/**
 * Carica la pagina dello shop di un artigiano
 * @param {Object} params - Parametri della route (deve contenere id)
 */
export async function loadArtisanShopPage(params) {
    const artisanId = params.id;
    const pageElement = document.createElement('div');
    pageElement.className = 'artisan-shop-page';

    // Stato locale
    let state = {
        artisan: null,
        products: [],
        page: 1,
        limit: 12,
        total: 0,
        pagination: null
    };

    // Struttura base
    pageElement.innerHTML = `
        <div class="container py-4 artisan-shop-page">
            <div class="row mb-4">
                <div class="col-12">
                    <div class="artisan-header card border-0 shadow-sm p-0 position-relative overflow-hidden mb-4">
                        <div class="artisan-banner position-relative w-100" id="artisan-banner" style="height: 200px;">
                            <div class="banner-overlay position-absolute top-0 start-0 w-100 h-100" style="background: rgba(255,255,255,0.25);"></div>
                        </div>
                        <div class="artisan-profile-wrapper position-absolute start-50 translate-middle-x" style="top: 140px; z-index:2;">
                            <div id="artisan-img-wrapper" class="artisan-img-placeholder d-flex align-items-center justify-content-center bg-light rounded-circle border border-4 border-white shadow" style="width:120px;height:120px;overflow:hidden;">
                                <span class="display-4 text-primary"><i class="bi bi-person-badge"></i></span>
                            </div>
                        </div>
                        <div class="artisan-info text-center px-3" style="margin-top: 60px;">
                            <h2 class="fw-bold mb-1" id="artisan-name">Artigiano</h2>
                            <div class="artisan-bio text-secondary fst-italic mb-2" id="artisan-bio"></div>
                            <div class="text-muted small" id="artisan-member-date"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <div id="products-list" class="row g-4"></div>
                    <nav class="mt-4 d-flex justify-content-center">
                        <ul class="pagination" id="products-pagination"></ul>
                    </nav>
                </div>
            </div>
        </div>
        <style>
        .artisan-header {
            border-radius: 1.2rem;
            overflow: hidden;
            margin-bottom: 2rem;
            position: relative;
            background: #fff;
        }
        .artisan-banner {
            min-height: 200px;
            background: #f8f9fa;
            object-fit: cover;
            border-top-left-radius: 1.2rem;
            border-top-right-radius: 1.2rem;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        }
        .banner-overlay {
            background: rgba(255,255,255,0.25);
            pointer-events: none;
        }
        .artisan-profile-wrapper {
            left: 50%;
            transform: translateX(-50%);
            top: 140px;
            position: absolute;
            z-index: 2;
        }
        .artisan-img-placeholder {
            border: 4px solid #fff !important;
        }
        .artisan-info {
            margin-top: 60px;
            padding-bottom: 1rem;
        }
        @media (max-width: 767px) {
            .artisan-header { border-radius: 0.8rem; }
            .artisan-banner { min-height: 120px; }
            .artisan-profile-wrapper { top: 90px; }
            .artisan-info { margin-top: 60px; }
        }
        </style>
    `;

    // Renderizza i prodotti
    function renderProducts(products) {
        const list = pageElement.querySelector('#products-list');
        if (!products.length) {
            list.innerHTML = '<div class="col-12 text-center text-muted">Nessun prodotto trovato per questo artigiano.</div>';
            return;
        }
        list.innerHTML = products.map(product => `
            <div class="col-6 col-md-4">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body d-flex flex-column p-0">
                        <div class="w-100 product-img-wrapper" style="height: 140px; background: #f8f9fa; display: flex; align-items: center; justify-content: center; border-top-left-radius: 12px; border-top-right-radius: 12px; overflow: hidden;">
                            ${product.image && product.image.url ?
                                `<img src=\"http://localhost:3015${product.image.url}\" alt=\"${product.name}\" style=\"width:100%; height:100%; object-fit:cover; display:block;\" />` :
                                '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #ccc;">🖼️</div>'
                            }
                        </div>
                        <div class="p-2 d-flex flex-column flex-grow-1">
                            <h5 class="card-title mb-2">${product.name}</h5>
                            <div class="mb-2 text-muted small">Categoria: ${product.category_name || '-'}</div>
                            <div class="mb-2 d-none d-md-block">${product.description ? product.description : ''}</div>
                            <div class="mt-auto d-flex justify-content-between align-items-center">
                                <span class="fw-bold">€ ${Number(product.price).toFixed(2)}</span>
                                <a href="/products/${product.id}" class="btn btn-outline-primary btn-sm ms-2" data-route>Dettagli</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('') + `
        <style>
        @media (max-width: 767.98px) {
            .artisan-shop-page .product-img-wrapper { height: 90px !important; }
            .artisan-shop-page .card-body .p-2 { padding: 0.5rem !important; }
            .artisan-shop-page .card-title { font-size: 1rem; }
        </style>`;
    }

    // Renderizza la paginazione
    function renderPagination(pagination) {
        const paginationEl = pageElement.querySelector('#products-pagination');
        if (!pagination || pagination.totalPages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }
        let html = '';
        for (let i = 1; i <= pagination.totalPages; i++) {
            html += `<li class="page-item${i === pagination.currentPage ? ' active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }
        paginationEl.innerHTML = html;
    }

    // Carica i dati dell'artigiano
    async function loadArtisan() {
        try {
            const data = await UsersAPI.getArtisans({ id: artisanId });
            // Se la risposta è un singolo oggetto (quando passo id)
            const found = data.data && data.data.id ? data.data : null;
            if (found) {
                state.artisan = found;
                pageElement.querySelector('#artisan-name').textContent = found.name;
                pageElement.querySelector('#artisan-bio').textContent = found.bio || '';
                // Data formattata
                if (found.approved_at) {
                    const date = new Date(found.approved_at);
                    const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
                    pageElement.querySelector('#artisan-member-date').textContent =
                        `Membro da: ${date.getDate()} ${mesi[date.getMonth()]} ${date.getFullYear()}`;
                }
                // Banner
                const bannerDiv = pageElement.querySelector('#artisan-banner');
                if (bannerDiv && found.url_banner) {
                    bannerDiv.style.background = `url('http://localhost:3015${found.url_banner}') center/cover no-repeat`;
                }
                // Foto profilo
                const imgWrapper = pageElement.querySelector('#artisan-img-wrapper');
                if (imgWrapper) {
                    if (found.image) {
                        imgWrapper.innerHTML = `<img src=\"http://localhost:3015${found.image}\" alt=\"${found.name}\" style=\"width:120px; height:120px; object-fit:cover; border-radius:50%;\" />`;
                    } else {
                        imgWrapper.innerHTML = '<span class="display-4 text-primary"><i class="bi bi-person-badge"></i></span>';
                    }
                }
            }
        } catch (error) {
            // Se non trovato, lascia i dati di default
        }
    }

    // Carica i prodotti dell'artigiano
    async function loadProducts() {
        loader.show();
        try {
            const data = await getProductsByArtisan(artisanId, { page: state.page, limit: state.limit });
            state.products = data.products || [];
            state.pagination = data.pagination;
            renderProducts(state.products);
            renderPagination(state.pagination);
        } catch (error) {
            showBootstrapToast('Errore nel caricamento dei prodotti', 'Errore', 'error');
        } finally {
            loader.hide();
        }
    }

    // Gestione paginazione
    function mount() {
        const pagination = pageElement.querySelector('#products-pagination');
        pagination.addEventListener('click', e => {
            if (e.target.tagName === 'A') {
                e.preventDefault();
                const newPage = parseInt(e.target.dataset.page);
                if (!isNaN(newPage) && newPage !== state.page) {
                    state.page = newPage;
                    loadProducts();
                }
            }
        });
        // Bottone torna indietro
        const backBtn = pageElement.querySelector('#back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.history.back();
            });
        }
    }

    // Carica dati
    await loadArtisan();
    await loadProducts();

    return {
        render: () => pageElement,
        mount
    };
}
