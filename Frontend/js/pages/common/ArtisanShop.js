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
        <div class="container py-4">
            <div class="row mb-2">
                <div class="col-12">
                    <button id="back-btn" class="btn btn-outline-secondary mb-3">
                        <i class="bi bi-arrow-left"></i> Torna indietro
                    </button>
                </div>
            </div>
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card shadow-sm border-0 p-4 d-flex flex-row align-items-center gap-4">
                        <div id="artisan-img-wrapper" class="artisan-img-placeholder d-flex align-items-center justify-content-center bg-light rounded-circle" style="width:80px;height:80px;overflow:hidden;">
                            <span class="display-4 text-primary"><i class="bi bi-person-badge"></i></span>
                        </div>
                        <div>
                            <h2 class="h4 mb-1" id="artisan-name">Artigiano</h2>
                            <div class="text-muted small" id="artisan-id">ID: ${artisanId}</div>
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
    `;

    // Renderizza i prodotti
    function renderProducts(products) {
        const list = pageElement.querySelector('#products-list');
        if (!products.length) {
            list.innerHTML = '<div class="col-12 text-center text-muted">Nessun prodotto trovato per questo artigiano.</div>';
            return;
        }
        list.innerHTML = products.map(product => `
            <div class="col-12 col-sm-6 col-lg-4">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body d-flex flex-column p-0">
                        <div class="w-100" style="height: 260px; background: #f8f9fa; display: flex; align-items: center; justify-content: center; border-top-left-radius: 12px; border-top-right-radius: 12px; overflow: hidden;">
                            ${product.image && product.image.url ?
                                `<img src=\"http://localhost:3005${product.image.url}\" alt=\"${product.name}\" style=\"width:100%; height:100%; object-fit:cover; display:block;\" />` :
                                '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #ccc;">🖼️</div>'
                            }
                        </div>
                        <div class="p-3 d-flex flex-column flex-grow-1">
                            <h5 class="card-title mb-2">${product.name}</h5>
                            <div class="mb-2 text-muted small">Categoria: ${product.category_name || '-'}</div>
                            <div class="mb-2">${product.description ? product.description : ''}</div>
                            <div class="mt-auto">
                                <span class="fw-bold">€ ${Number(product.price).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
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
            console.log("dati artigiano", data);
            // Se la risposta è un singolo oggetto (quando passo id)
            const found = data.data && data.data.id ? data.data : null;
            if (found) {
                state.artisan = found;
                pageElement.querySelector('#artisan-name').textContent = found.name;
                pageElement.querySelector('#artisan-id').textContent = `ID: ${found.id}`;
                // Aggiorna la foto profilo se presente
                const imgWrapper = pageElement.querySelector('#artisan-img-wrapper');
                if (imgWrapper) {
                    if (found.image) {
                        imgWrapper.innerHTML = `<img src=\"http://localhost:3005${found.image}\" alt=\"${found.name}\" style=\"width:80px; height:80px; object-fit:cover; border-radius:50%;\" />`;
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
