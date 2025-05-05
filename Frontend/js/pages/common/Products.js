// Importo i servizi API
import { getProducts } from '../../../api/products.js';
import CategoriesAPI from '../../../api/categories.js';
import UsersAPI from '../../../api/users.js';
import { loader } from '../../components/Loader.js';
import { showBootstrapToast } from '../../components/Toast.js';
import { authService } from '../../services/authService.js';

/**
 * Carica la pagina Prodotti
 * @returns {Object} - Oggetto con i metodi del componente
 */
export async function loadProductsPage(params = {}) {
    // Stato della pagina
    const state = {
        products: [],
        categories: [],
        artisans: [],
        filters: {
            search: '',
            category: '',
            artisan: '',
            minPrice: '',
            maxPrice: ''
        },
        pagination: {
            page: 1,
            limit: 12,
            totalPages: 1,
            totalItems: 0
        },
        loading: false
    };

    // Se il router passa params.category, imposta il filtro categoria
    if (params.category) {
        state.filters.category = params.category;
    }

    // Leggi il parametro category dalla query string (es: #/products?category=5)
    function getCategoryFromQuery() {
        const hash = window.location.hash;
        const query = hash.split('?')[1];
        if (!query) return '';
        const params = new URLSearchParams(query);
        return params.get('category') || '';
    }
    // Imposta il filtro categoria se presente nella query string
    const categoryFromQuery = getCategoryFromQuery();
    if (categoryFromQuery) {
        state.filters.category = categoryFromQuery;
    }

    // Crea l'elemento principale della pagina
    const pageElement = document.createElement('div');
    pageElement.className = 'products-page';

    // Costruisce il contenuto della pagina
    pageElement.innerHTML = `
        <section class="products-section">
            <div class="container">
                <div class="section-header mt-3">
                    <h2>Tutti i Prodotti</h2>
                </div>
                <div class="row pb-5 pt-2">
                    <aside class="col-12 col-md-4 mb-4 mb-md-0">
                        <div class="card shadow-sm border-0 p-3">
                            <h5 class="mb-3">Filtra i risultati</h5>
                            <form id="filters-form" class="filters-form">
                                <div class="mb-3">
                                    <label for="search" class="form-label">Ricerca</label>
                                    <input type="text" id="search" name="search" class="form-control" placeholder="Cerca prodotti...">
                                </div>
                                <div class="mb-3">
                                    <label for="category" class="form-label">Categoria</label>
                                    <select id="category" name="category" class="form-select">
                                        <option value="">Tutte le categorie</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="artisan" class="form-label">Artigiano</label>
                                    <select id="artisan" name="artisan" class="form-select">
                                        <option value="">Tutti gli artigiani</option>
                                    </select>
                                </div>
                                <div class="row mb-3">
                                    <div class="col">
                                        <label for="min-price" class="form-label">Prezzo minimo (€)</label>
                                        <input type="number" id="min-price" name="minPrice" min="0" step="1" class="form-control" placeholder="Min">
                                    </div>
                                    <div class="col">
                                        <label for="max-price" class="form-label">Prezzo massimo (€)</label>
                                        <input type="number" id="max-price" name="maxPrice" min="0" step="1" class="form-control" placeholder="Max">
                                    </div>
                                </div>
                                <div class="d-flex gap-2">
                                    <button type="submit" class="btn btn-primary">Applica filtri</button>
                                    <button type="reset" class="btn btn-secondary" id="reset-filters">Reset</button>
                                </div>
                            </form>
                        </div>
                    </aside>
                    <main class="col-12 col-md-8">
                        <div id="products-container" class="row g-4">
                            <div class="col-12 col-sm-6 col-lg-4"><div class="skeleton-card card"></div></div>
                            <div class="col-12 col-sm-6 col-lg-4"><div class="skeleton-card card"></div></div>
                            <div class="col-12 col-sm-6 col-lg-4"><div class="skeleton-card card"></div></div>
                            <div class="col-12 col-sm-6 col-lg-4"><div class="skeleton-card card"></div></div>
                            <div class="col-12 col-sm-6 col-lg-4"><div class="skeleton-card card"></div></div>
                            <div class="col-12 col-sm-6 col-lg-4"><div class="skeleton-card card"></div></div>
                            <div class="col-12 col-sm-6 col-lg-4"><div class="skeleton-card card"></div></div>
                            <div class="col-12 col-sm-6 col-lg-4"><div class="skeleton-card card"></div></div>
                        </div>
                        <nav aria-label="Paginazione prodotti">
                            <ul id="pagination" class="pagination justify-content-center mt-4 mb-0">
                                <li class="page-item"><button id="prev-page" class="page-link" disabled>&laquo; Precedente</button></li>
                                <span id="page-numbers" class="d-flex align-items-center"></span>
                                <li class="page-item"><button id="next-page" class="page-link" disabled>Successiva &raquo;</button></li>
                            </ul>
                        </nav>
                        <div id="no-results" class="no-results alert alert-warning mt-4 d-none">
                            <p class="mb-2">Nessun prodotto trovato con i criteri di ricerca specificati.</p>
                            <button id="clear-filters" class="btn btn-primary">Cancella filtri</button>
                        </div>
                    </main>
                </div>
            </div>
        </section>
    `;

    // Carica dati iniziali
    async function loadProductsData() {
        try {
            state.loading = true;
            toggleProductsLoader(true);
            // Carica categorie
            const categoriesRes = await CategoriesAPI.getCategories();
            state.categories = categoriesRes || [];
            populateCategoryFilter(state.categories);
            // Carica artigiani se autenticato
            const artisansRes = await UsersAPI.getArtisans();
            state.artisans = artisansRes.data || [];
            populateArtisanFilter(state.artisans);

            // Carica prodotti
            await loadProducts();
        } catch (error) {
            showBootstrapToast('Errore nel caricamento dei dati. Riprova più tardi.', 'Errore', 'error');
        } finally {
            state.loading = false;
            toggleProductsLoader(false);
        }
    }

    async function loadProducts() {
        try {
            state.loading = true;
            toggleProductsLoader(true);
            const params = {
                page: state.pagination.page,
                limit: state.pagination.limit,
                ...state.filters
            };
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });
            const response = await getProducts(params);
            state.products = (response.products || []).map(product => ({
                ...product,
                price: Number(product.price),
                artisan: { name: product.artisan_name },
                imageUrl: '',
            }));
            state.pagination.totalPages = response.pagination?.totalPages || 1;
            state.pagination.totalItems = response.pagination?.total || 0;
            state.pagination.page = response.pagination?.currentPage || 1;
            renderProducts(state.products);
            renderPagination(state.pagination);
            const noResultsElement = document.getElementById('no-results');
            if (state.products.length === 0) {
                noResultsElement.classList.remove('hidden');
            } else {
                noResultsElement.classList.add('hidden');
            }
        } catch (error) {
            showBootstrapToast('Errore nel caricamento dei prodotti. Riprova più tardi.', 'Errore', 'error');
        } finally {
            state.loading = false;
            toggleProductsLoader(false);
        }
    }

    function toggleProductsLoader(show) {
        const productsContainer = document.getElementById('products-container');
        if (!productsContainer) return;
        if (show) {
            let skeletonHtml = '';
            for (let i = 0; i < state.pagination.limit; i++) {
                skeletonHtml += '<div class="skeleton-card card"></div>';
            }
            productsContainer.innerHTML = skeletonHtml;
        }
    }

    function populateCategoryFilter(categories) {
        const categorySelect = document.getElementById('category');
        if (!categorySelect) return;
        let optionsHtml = '<option value="">Tutte le categorie</option>';
        categories.forEach(category => {
            optionsHtml += `<option value="${category.id}">${category.name}</option>`;
        });
        categorySelect.innerHTML = optionsHtml;
        // Se il filtro categoria è già impostato, seleziona l'opzione corretta
        if (state.filters.category) {
            categorySelect.value = state.filters.category;
        }
    }

    function populateArtisanFilter(artisans) {
        const artisanSelect = document.getElementById('artisan');
        if (!artisanSelect) return;
        let optionsHtml = '<option value="">Tutti gli artigiani</option>';
        artisans.forEach(artisan => {
            optionsHtml += `<option value="${artisan.id}">${artisan.name}</option>`;
        });
        artisanSelect.innerHTML = optionsHtml;
    }

    function renderProducts(products) {
        const productsContainer = document.getElementById('products-container');
        if (!productsContainer) return;
        let html = '';
        if (products.length === 0) {
            productsContainer.innerHTML = '';
            return;
        }
        products.forEach(product => {
            html += `
                <div class="col-12 col-sm-6 col-lg-4 mb-3 d-flex align-items-stretch">
                    <div class="product-card card flex-fill h-100">
                        <div class="product-image d-flex align-items-center justify-content-center" style="background-color: var(--light-bg); height: 220px;">
                            ${product.image && product.image.url ?
                    `<img src="http://localhost:3005${product.image.url}" alt="${product.name}" style="height: 200px; width: 100%; object-fit: cover; border-radius: 8px; padding-inline: 10px;" />` :
                    `<div style="width: 120px; height: 120px; background: #fff; border: 1px solid #eee; border-radius: 8px; display: flex; align-items: center; justify-content: center; ">
                                    <span class="placeholder-icon">🖼️</span>
                                </div>`
                }
                        </div>
                        <div class="product-content p-2">
                            <h6 class="fw-bold mb-1">${product.name}</h6>
                            <p class="product-artisan text-muted mb-1 small">di ${product.artisan?.name || 'Artigiano'}</p>
                            <div class="product-footer d-flex justify-content-between align-items-center">
                                <span class="product-price fw-bold">${product.price?.toFixed(2) || '0.00'} €</span>
                                <a href="/products/${product.id}" class="btn btn-outline-primary btn-sm" data-route>Dettagli</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        productsContainer.innerHTML = html;
    }

    function renderPagination(pagination) {
        const paginationElement = document.getElementById('pagination');
        const pageNumbersElement = document.getElementById('page-numbers');
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        if (!paginationElement || !pageNumbersElement || !prevButton || !nextButton) return;
        if (pagination.totalPages <= 1) {
            paginationElement.classList.add('d-none');
            return;
        } else {
            paginationElement.classList.remove('d-none');
        }
        prevButton.disabled = pagination.page <= 1;
        nextButton.disabled = pagination.page >= pagination.totalPages;
        let pageNumbersHtml = '';
        const maxPageButtons = 5;
        let startPage = Math.max(1, pagination.page - Math.floor(maxPageButtons / 2));
        let endPage = Math.min(pagination.totalPages, startPage + maxPageButtons - 1);
        if (endPage - startPage + 1 < maxPageButtons && startPage > 1) {
            startPage = Math.max(1, endPage - maxPageButtons + 1);
        }
        // Prima pagina
        if (startPage > 1) {
            pageNumbersHtml += `<li class="page-item"><button class="page-link" data-page="1">1</button></li>`;
            if (startPage > 2) {
                pageNumbersHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }
        // Pagine centrali
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === pagination.page ? 'active' : '';
            pageNumbersHtml += `<li class="page-item ${activeClass}"><button class="page-link" data-page="${i}">${i}</button></li>`;
        }
        // Ultima pagina
        if (endPage < pagination.totalPages) {
            if (endPage < pagination.totalPages - 1) {
                pageNumbersHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            pageNumbersHtml += `<li class="page-item"><button class="page-link" data-page="${pagination.totalPages}">${pagination.totalPages}</button></li>`;
        }
        pageNumbersElement.innerHTML = pageNumbersHtml;
    }

    function handlePageChange(page) {
        if (page < 1 || page > state.pagination.totalPages || page === state.pagination.page) {
            return;
        }
        state.pagination.page = page;
        loadProducts();
        const productsSection = document.querySelector('.products-section');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function handleFilterSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        state.filters.search = formData.get('search') || '';
        state.filters.category = formData.get('category') || '';
        state.filters.artisan = formData.get('artisan') || '';
        state.filters.minPrice = formData.get('minPrice') || '';
        state.filters.maxPrice = formData.get('maxPrice') || '';
        state.pagination.page = 1;
        loadProducts();
    }

    function handleFilterReset() {
        state.filters = {
            search: '',
            category: '',
            artisan: '',
            minPrice: '',
            maxPrice: ''
        };
        state.pagination.page = 1;
        const form = document.getElementById('filters-form');
        if (form) {
            form.reset();
        }
        loadProducts();
    }

    function mount() {
        loadProductsData();
        const filtersForm = document.getElementById('filters-form');
        if (filtersForm) {
            filtersForm.addEventListener('submit', handleFilterSubmit);
        }
        const resetFiltersButton = document.getElementById('reset-filters');
        if (resetFiltersButton) {
            resetFiltersButton.addEventListener('click', handleFilterReset);
        }
        const clearFiltersButton = document.getElementById('clear-filters');
        if (clearFiltersButton) {
            clearFiltersButton.addEventListener('click', handleFilterReset);
        }
        const prevButton = document.getElementById('prev-page');
        if (prevButton) {
            prevButton.addEventListener('click', () => handlePageChange(state.pagination.page - 1));
        }
        const nextButton = document.getElementById('next-page');
        if (nextButton) {
            nextButton.addEventListener('click', () => handlePageChange(state.pagination.page + 1));
        }
        const pageNumbersElement = document.getElementById('page-numbers');
        if (pageNumbersElement) {
            pageNumbersElement.addEventListener('click', (event) => {
                const pageButton = event.target.closest('.page-number');
                if (pageButton) {
                    const page = parseInt(pageButton.dataset.page, 10);
                    handlePageChange(page);
                }
            });
        }
    }

    function unmount() {
        const filtersForm = document.getElementById('filters-form');
        if (filtersForm) {
            filtersForm.removeEventListener('submit', handleFilterSubmit);
        }
        const resetFiltersButton = document.getElementById('reset-filters');
        if (resetFiltersButton) {
            resetFiltersButton.removeEventListener('click', handleFilterReset);
        }
        const clearFiltersButton = document.getElementById('clear-filters');
        if (clearFiltersButton) {
            clearFiltersButton.removeEventListener('click', handleFilterReset);
        }
        const prevButton = document.getElementById('prev-page');
        if (prevButton) {
            prevButton.removeEventListener('click', () => handlePageChange(state.pagination.page - 1));
        }
        const nextButton = document.getElementById('next-page');
        if (nextButton) {
            nextButton.removeEventListener('click', () => handlePageChange(state.pagination.page + 1));
        }
        const pageNumbersElement = document.getElementById('page-numbers');
        if (pageNumbersElement) {
            pageNumbersElement.removeEventListener('click', (event) => {
                const pageButton = event.target.closest('.page-number');
                if (pageButton) {
                    const page = parseInt(pageButton.dataset.page, 10);
                    handlePageChange(page);
                }
            });
        }
    }

    return {
        render: () => pageElement,
        mount,
        unmount
    };
} 