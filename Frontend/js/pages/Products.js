// Importo i servizi API
import { getProducts } from '../../api/products.js';
import CategoriesAPI from '../../api/categories.js';
import UsersAPI from '../../api/users.js';
import { loader } from '../components/Loader.js';
import { toast } from '../components/Toast.js';
import { authService } from '../services/authService.js';

/**
 * Carica la pagina Prodotti
 * @returns {Object} - Oggetto con i metodi del componente
 */
export async function loadProductsPage() {
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

    // Crea l'elemento principale della pagina
    const pageElement = document.createElement('div');
    pageElement.className = 'products-page';

    // Costruisce il contenuto della pagina
    pageElement.innerHTML = `
        <section class="products-section">
            <div class="container">
                <div class="section-header">
                    <h2>Tutti i Prodotti</h2>
                </div>
                <div class="products-layout">
                    <aside class="filters-sidebar">
                        <form id="filters-form" class="filters-form">
                            <div class="filters-row">
                                <div class="filter-group">
                                    <label for="search">Ricerca</label>
                                    <input type="text" id="search" name="search" placeholder="Cerca prodotti...">
                                </div>
                            </div>
                            <div class="filters-row">
                                <div class="filter-group">
                                    <label for="category">Categoria</label>
                                    <select id="category" name="category">
                                        <option value="">Tutte le categorie</option>
                                    </select>
                                </div>
                            </div>
                            <div class="filters-row">
                                <div class="filter-group">
                                    <label for="artisan">Artigiano</label>
                                    <select id="artisan" name="artisan">
                                        <option value="">Tutti gli artigiani</option>
                                    </select>
                                </div>
                            </div>
                            <div class="filters-row">
                                <div class="filter-group">
                                    <label for="min-price">Prezzo minimo (€)</label>
                                    <input type="number" id="min-price" name="minPrice" min="0" step="1" placeholder="Min">
                                </div>
                                <div class="filter-group">
                                    <label for="max-price">Prezzo massimo (€)</label>
                                    <input type="number" id="max-price" name="maxPrice" min="0" step="1" placeholder="Max">
                                </div>
                            </div>
                            <div class="filter-buttons">
                                <button type="submit" class="btn btn-primary">Applica filtri</button>
                                <button type="reset" class="btn btn-secondary" id="reset-filters">Reset</button>
                            </div>
                        </form>
                    </aside>
                    <main class="products-main">
                        <div id="products-container" class="grid grid-4">
                            <div class="skeleton-card"></div>
                            <div class="skeleton-card"></div>
                            <div class="skeleton-card"></div>
                            <div class="skeleton-card"></div>
                            <div class="skeleton-card"></div>
                            <div class="skeleton-card"></div>
                            <div class="skeleton-card"></div>
                            <div class="skeleton-card"></div>
                        </div>
                        <div id="pagination" class="pagination">
                            <button id="prev-page" class="btn btn-sm" disabled>&laquo; Precedente</button>
                            <div id="page-numbers" class="page-numbers"></div>
                            <button id="next-page" class="btn btn-sm" disabled>Successiva &raquo;</button>
                        </div>
                        <div id="no-results" class="no-results hidden">
                            <p>Nessun prodotto trovato con i criteri di ricerca specificati.</p>
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
            try {
                if (authService.isAuthenticated()) {
                    const artisansRes = await UsersAPI.getArtisans();
                    state.artisans = artisansRes.data || [];
                    populateArtisanFilter(state.artisans);
                } else {
                    const artisanSelect = document.getElementById('artisan');
                    if (artisanSelect) {
                        artisanSelect.innerHTML = '<option value="">Accedi per vedere gli artigiani</option>';
                        artisanSelect.disabled = true;
                    }
                }
            } catch (error) {
                const artisanSelect = document.getElementById('artisan');
                if (artisanSelect) {
                    artisanSelect.innerHTML = '<option value="">Impossibile caricare gli artigiani</option>';
                    artisanSelect.disabled = true;
                }
            }
            // Carica prodotti
            await loadProducts();
        } catch (error) {
            toast.error('Errore nel caricamento dei dati. Riprova più tardi.');
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
            toast.error('Errore nel caricamento dei prodotti. Riprova più tardi.');
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
                skeletonHtml += '<div class="skeleton-card"></div>';
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
                <div class="product-card card">
                    <div class="product-image" style="background-color: var(--light-bg); display: flex; align-items: center; justify-content: center; height: 120px;">
                        ${product.imageUrl ? 
                            `<img src="${product.imageUrl}" alt="${product.name}">` : 
                            `<div style="width: 80px; height: 80px; background: #fff; border: 1px solid #eee; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                <span class="placeholder-icon">🖼️</span>
                            </div>`
                        }
                    </div>
                    <div class="product-content">
                        <h3>${product.name}</h3>
                        <p class="product-artisan">di ${product.artisan?.name || 'Artigiano'}</p>
                        <div class="product-footer">
                            <span class="product-price">${product.price?.toFixed(2) || '0.00'} €</span>
                            <a href="/products/${product.id}" class="btn btn-sm" data-route>Dettagli</a>
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
            paginationElement.classList.add('hidden');
            return;
        } else {
            paginationElement.classList.remove('hidden');
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
        if (startPage > 1) {
            pageNumbersHtml += `<button class="page-number" data-page="1">1</button>`;
            if (startPage > 2) {
                pageNumbersHtml += `<span class="page-ellipsis">...</span>`;
            }
        }
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === pagination.page ? 'active' : '';
            pageNumbersHtml += `<button class="page-number ${activeClass}" data-page="${i}">${i}</button>`;
        }
        if (endPage < pagination.totalPages) {
            if (endPage < pagination.totalPages - 1) {
                pageNumbersHtml += `<span class="page-ellipsis">...</span>`;
            }
            pageNumbersHtml += `<button class="page-number" data-page="${pagination.totalPages}">${pagination.totalPages}</button>`;
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