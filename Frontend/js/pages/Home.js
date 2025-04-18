// Importo i servizi API
import { getProducts, getProduct } from '../../api/products.js';
import CategoriesAPI from '../../api/categories.js';
import UsersAPI from '../../api/users.js';

// Importo i componenti
import { loader } from '../components/Loader.js';
import { toast } from '../components/Toast.js';
import { authService } from '../services/authService.js';

/**
 * Carica la pagina Home
 * @returns {Object} - Oggetto con i metodi del componente
 */
export async function loadHomePage() {
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
            limit: 8,
            totalPages: 1,
            totalItems: 0
        },
        loading: false
    };
    
    // Crea l'elemento principale della pagina
    const pageElement = document.createElement('div');
    pageElement.className = 'home-page';
    
    // Costruisce il contenuto della pagina
    pageElement.innerHTML = `
        <section class="hero py-5 bg-light">
            <div class="container text-center">
                <h1 class="display-4 mb-2">Scopri l'Artigianato Italiano</h1>
                <p class="lead mb-4">Prodotti unici realizzati con passione e tradizione</p>
                <a href="/products" class="btn btn-primary btn-lg" data-route>Esplora i Prodotti</a>
            </div>
        </section>
        <section class="featured py-4">
            <div class="container">
                <h2 class="mb-4">Categorie in Evidenza</h2>
                <div class="row g-4" id="featured-categories">
                    <div class="col-12 col-md-4"><div class="skeleton-card card"></div></div>
                    <div class="col-12 col-md-4"><div class="skeleton-card card"></div></div>
                    <div class="col-12 col-md-4"><div class="skeleton-card card"></div></div>
                </div>
            </div>
        </section>
        <section class="products-section py-4">
            <div class="container">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h2 class="mb-0">Prodotti Artigianali</h2>
                    <button id="toggle-filters" class="btn btn-outline-secondary btn-sm d-md-none">
                        <span>Filtri</span>
                        <span class="icon">▼</span>
                    </button>
                </div>
                <div class="row">
                    <aside class="col-12 col-md-4 mb-4 mb-md-0" id="filters-container">
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
                        <div id="pagination" class="pagination mt-4">
                            <button id="prev-page" class="btn btn-outline-secondary btn-sm me-2" disabled>&laquo; Precedente</button>
                            <div id="page-numbers" class="page-numbers d-inline-block"></div>
                            <button id="next-page" class="btn btn-outline-secondary btn-sm ms-2" disabled>Successiva &raquo;</button>
                        </div>
                        <div id="no-results" class="no-results alert alert-warning mt-4 d-none">
                            <p class="mb-2">Nessun prodotto trovato con i criteri di ricerca specificati.</p>
                            <button id="clear-filters" class="btn btn-primary">Cancella filtri</button>
                        </div>
                    </main>
                </div>
            </div>
        </section>
        <section class="cta-section py-5 bg-light mb-5">
            <div class="container">
                <div class="cta-content text-center">
                    <h2>Sei un Artigiano?</h2>
                    <p>Unisciti alla nostra piattaforma e porta i tuoi prodotti artigianali a un pubblico più ampio.</p>
                    <a href="/register" class="btn btn-secondary" data-route>Inizia a Vendere</a>
                </div>
            </div>
        </section>
    `;
    
    /**
     * Carica i dati per la home page
     */
    async function loadHomeData() {
        try {
            // Mostra il loader
            state.loading = true;
            toggleProductsLoader(true);
            
            // Carica le categorie
            const categoriesRes = await CategoriesAPI.getCategories();
            state.categories = categoriesRes || [];
            
            // Popola il filtro delle categorie
            populateCategoryFilter(state.categories);
            
            // Renderizza le categorie in evidenza (mostriamo le prime 3)
            renderFeaturedCategories(state.categories.slice(0, 3));
            
            // Tenta di caricare gli artisani solo se l'utente è autenticato
            try {
                if (authService.isAuthenticated()) {
                    const artisansRes = await UsersAPI.getArtisans();
                    console.log("artisan", artisansRes);
                    state.artisans = artisansRes.data || [];
                    // Popola il filtro degli artisani
                    populateArtisanFilter(state.artisans);
                } else {
                    // Se l'utente non è autenticato, disabilita il filtro artisani
                    const artisanSelect = document.getElementById('artisan');
                    if (artisanSelect) {
                        artisanSelect.innerHTML = '<option value="">Accedi per vedere gli artisani</option>';
                        artisanSelect.disabled = true;
                    }
                }
            } catch (error) {
                console.error('Errore nel caricamento degli artisani:', error);
                // Disabilita il filtro artisani in caso di errore
                const artisanSelect = document.getElementById('artisan');
                if (artisanSelect) {
                    artisanSelect.innerHTML = '<option value="">Impossibile caricare gli artisani</option>';
                    artisanSelect.disabled = true;
                }
            }
            
            // Carica i prodotti
            await loadProducts();
            
        } catch (error) {
            console.error('Errore nel caricamento dei dati:', error);
            toast.error('Errore nel caricamento dei dati. Riprova più tardi.');
        } finally {
            state.loading = false;
            toggleProductsLoader(false);
        }
    }
    
    /**
     * Carica i prodotti con i filtri e la paginazione corrente
     */
    async function loadProducts() {
        try {
            state.loading = true;
            toggleProductsLoader(true);
            
            // Prepara i parametri di query
            const params = {
                page: state.pagination.page,
                limit: state.pagination.limit,
                ...state.filters
            };
            
            // Rimuovi parametri vuoti
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });
            
            const response = await getProducts(params);
            console.log("prodotti", response);
            // Adatto i prodotti alla struttura attesa dal rendering
            state.products = (response.products || []).map(product => ({
                ...product,
                price: Number(product.price),
                artisan: { name: product.artisan_name },
                imageUrl: '', // Nessuna immagine per ora
            }));
            // Adatto la paginazione alla struttura fornita
            state.pagination.totalPages = response.pagination?.totalPages || 1;
            state.pagination.totalItems = response.pagination?.total || 0;
            state.pagination.page = response.pagination?.currentPage || 1;
            
            // Renderizza i prodotti e la paginazione
            renderProducts(state.products);
            renderPagination(state.pagination);
            
            // Mostra/nascondi il messaggio "nessun risultato"
            const noResultsElement = document.getElementById('no-results');
            if (state.products.length === 0) {
                noResultsElement.classList.remove('hidden');
            } else {
                noResultsElement.classList.add('hidden');
            }
            
        } catch (error) {
            console.error('Errore nel caricamento dei prodotti:', error);
            toast.error('Errore nel caricamento dei prodotti. Riprova più tardi.');
        } finally {
            state.loading = false;
            toggleProductsLoader(false);
        }
    }
    
    /**
     * Mostra/nasconde il loader per i prodotti
     * @param {boolean} show - Se true, mostra il loader, altrimenti lo nasconde
     */
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
    
    /**
     * Popola il select delle categorie
     * @param {Array} categories - Lista delle categorie
     */
    function populateCategoryFilter(categories) {
        const categorySelect = document.getElementById('category');
        if (!categorySelect) return;
        
        let optionsHtml = '<option value="">Tutte le categorie</option>';
        
        categories.forEach(category => {
            optionsHtml += `<option value="${category.id}">${category.name}</option>`;
        });
        
        categorySelect.innerHTML = optionsHtml;
    }
    
    /**
     * Popola il select degli artigiani
     * @param {Array} artisans - Lista degli artigiani
     */
    function populateArtisanFilter(artisans) {
        const artisanSelect = document.getElementById('artisan');
        if (!artisanSelect) return;
        
        let optionsHtml = '<option value="">Tutti gli artigiani</option>';
        
        artisans.forEach(artisan => {
            optionsHtml += `<option value="${artisan.id}">${artisan.name}</option>`;
        });
        
        artisanSelect.innerHTML = optionsHtml;
    }
    
    /**
     * Visualizza le categorie in evidenza
     * @param {Array} categories - Lista delle categorie da visualizzare
     */
    function renderFeaturedCategories(categories) {
        const categoriesContainer = document.getElementById('featured-categories');
        if (!categoriesContainer) return;
        
        let html = '';
        
        if (categories.length === 0) {
            // Se non ci sono categorie, mostra un messaggio
            html = '<div class="empty-state">Nessuna categoria disponibile</div>';
        } else {
            categories.forEach(category => {
                // Usa un'icona predefinita in base al nome della categoria o un'icona generica
                const iconMap = {
                    'ceramica': '🏺',
                    'legno': '🪵',
                    'tessuti': '🧵',
                    'vetro': '🥃',
                    'metallo': '⚙️',
                    'gioielli': '💍'
                };
                
                const icon = iconMap[category.name.toLowerCase()] || '🛠️';
                
                html += `
                    <div class="category-card card">
                        <div class="category-image" style="background-color: var(--secondary-color);">
                            <span class="category-icon">${icon}</span>
                        </div>
                        <div class="category-content">
                            <h3>${category.name}</h3>
                            <p>${category.productCount || 0} prodotti</p>
                            <a href="/products?category=${category.id}" class="btn-link" data-route>Esplora</a>
                        </div>
                    </div>
                `;
            });
        }
        
        categoriesContainer.innerHTML = html;
    }
    
    /**
     * Visualizza i prodotti
     * @param {Array} products - Lista dei prodotti da visualizzare
     */
    function renderProducts(products) {
        const productsContainer = document.getElementById('products-container');
        if (!productsContainer) return;
        
        let html = '';
        
        if (products.length === 0) {
            // Prodotti vuoti vengono gestiti dal div "no-results"
            productsContainer.innerHTML = '';
            return;
        }
        
        products.forEach(product => {
            // Mostra un quadrato bianco se manca l'immagine
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
    
    /**
     * Renderizza la paginazione
     * @param {Object} pagination - Stato della paginazione
     */
    function renderPagination(pagination) {
        const paginationElement = document.getElementById('pagination');
        const pageNumbersElement = document.getElementById('page-numbers');
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        
        if (!paginationElement || !pageNumbersElement || !prevButton || !nextButton) return;
        
        // Nascondi la paginazione se c'è solo una pagina
        if (pagination.totalPages <= 1) {
            paginationElement.classList.add('hidden');
            return;
        } else {
            paginationElement.classList.remove('hidden');
        }
        
        // Abilita/disabilita i pulsanti prev/next
        prevButton.disabled = pagination.page <= 1;
        nextButton.disabled = pagination.page >= pagination.totalPages;
        
        // Renderizza i numeri di pagina
        let pageNumbersHtml = '';
        const maxPageButtons = 5; // Numero massimo di bottoni da mostrare
        
        // Calcola l'intervallo di pagine da mostrare
        let startPage = Math.max(1, pagination.page - Math.floor(maxPageButtons / 2));
        let endPage = Math.min(pagination.totalPages, startPage + maxPageButtons - 1);
        
        // Aggiusta i limiti se necessario
        if (endPage - startPage + 1 < maxPageButtons && startPage > 1) {
            startPage = Math.max(1, endPage - maxPageButtons + 1);
        }
        
        // Prima pagina se non è già inclusa
        if (startPage > 1) {
            pageNumbersHtml += `<button class="page-number" data-page="1">1</button>`;
            if (startPage > 2) {
                pageNumbersHtml += `<span class="page-ellipsis">...</span>`;
            }
        }
        
        // Pagine nell'intervallo
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === pagination.page ? 'active' : '';
            pageNumbersHtml += `<button class="page-number ${activeClass}" data-page="${i}">${i}</button>`;
        }
        
        // Ultima pagina se non è già inclusa
        if (endPage < pagination.totalPages) {
            if (endPage < pagination.totalPages - 1) {
                pageNumbersHtml += `<span class="page-ellipsis">...</span>`;
            }
            pageNumbersHtml += `<button class="page-number" data-page="${pagination.totalPages}">${pagination.totalPages}</button>`;
        }
        
        pageNumbersElement.innerHTML = pageNumbersHtml;
    }
    
    /**
     * Gestisce il cambio di pagina
     * @param {number} page - Numero di pagina
     */
    function handlePageChange(page) {
        if (page < 1 || page > state.pagination.totalPages || page === state.pagination.page) {
            return;
        }
        
        state.pagination.page = page;
        loadProducts();
        
        // Scorre verso l'alto alla sezione dei prodotti
        const productsSection = document.querySelector('.products-section');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    /**
     * Gestisce l'invio del form dei filtri
     * @param {Event} event - Evento submit
     */
    function handleFilterSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        // Aggiorna i filtri
        state.filters.search = formData.get('search') || '';
        state.filters.category = formData.get('category') || '';
        state.filters.artisan = formData.get('artisan') || '';
        state.filters.minPrice = formData.get('minPrice') || '';
        state.filters.maxPrice = formData.get('maxPrice') || '';
        
        // Resetta la pagina
        state.pagination.page = 1;
        
        // Carica i prodotti con i nuovi filtri
        loadProducts();
    }
    
    /**
     * Gestisce il reset dei filtri
     */
    function handleFilterReset() {
        // Resetta i filtri
        state.filters = {
            search: '',
            category: '',
            artisan: '',
            minPrice: '',
            maxPrice: ''
        };
        
        // Resetta la pagina
        state.pagination.page = 1;
        
        // Aggiorna il form
        const form = document.getElementById('filters-form');
        if (form) {
            form.reset();
        }
        
        // Carica i prodotti senza filtri
        loadProducts();
    }
    
    /**
     * Gestisce il toggle dei filtri
     */
    function handleToggleFilters() {
        const filtersContainer = document.getElementById('filters-container');
        const toggleButton = document.getElementById('toggle-filters');
        
        if (!filtersContainer || !toggleButton) return;
        
        filtersContainer.classList.toggle('hidden');
        
        // Aggiorna l'icona
        const icon = toggleButton.querySelector('.icon');
        if (icon) {
            icon.textContent = filtersContainer.classList.contains('hidden') ? '▼' : '▲';
        }
    }
    
    /**
     * Inizializza gli event listener
     */
    function mount() {
        // Carica i dati iniziali
        loadHomeData();
        
        // Event listener per i filtri
        const filtersForm = document.getElementById('filters-form');
        if (filtersForm) {
            filtersForm.addEventListener('submit', handleFilterSubmit);
        }
        
        // Event listener per il reset dei filtri
        const resetFiltersButton = document.getElementById('reset-filters');
        if (resetFiltersButton) {
            resetFiltersButton.addEventListener('click', handleFilterReset);
        }
        
        // Event listener per il pulsante "Cancella filtri"
        const clearFiltersButton = document.getElementById('clear-filters');
        if (clearFiltersButton) {
            clearFiltersButton.addEventListener('click', handleFilterReset);
        }
        
        // Event listener per il toggle dei filtri
        const toggleFiltersButton = document.getElementById('toggle-filters');
        if (toggleFiltersButton) {
            toggleFiltersButton.addEventListener('click', handleToggleFilters);
        }
        
        // Event listener per la paginazione
        const prevButton = document.getElementById('prev-page');
        if (prevButton) {
            prevButton.addEventListener('click', () => handlePageChange(state.pagination.page - 1));
        }
        
        const nextButton = document.getElementById('next-page');
        if (nextButton) {
            nextButton.addEventListener('click', () => handlePageChange(state.pagination.page + 1));
        }
        
        // Event delegation per i numeri di pagina
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
    
    /**
     * Rimuove gli event listener
     */
    function unmount() {
        // Rimuovi event listener per i filtri
        const filtersForm = document.getElementById('filters-form');
        if (filtersForm) {
            filtersForm.removeEventListener('submit', handleFilterSubmit);
        }
        
        // Rimuovi event listener per il reset dei filtri
        const resetFiltersButton = document.getElementById('reset-filters');
        if (resetFiltersButton) {
            resetFiltersButton.removeEventListener('click', handleFilterReset);
        }
        
        // Rimuovi event listener per il pulsante "Cancella filtri"
        const clearFiltersButton = document.getElementById('clear-filters');
        if (clearFiltersButton) {
            clearFiltersButton.removeEventListener('click', handleFilterReset);
        }
        
        // Rimuovi event listener per il toggle dei filtri
        const toggleFiltersButton = document.getElementById('toggle-filters');
        if (toggleFiltersButton) {
            toggleFiltersButton.removeEventListener('click', handleToggleFilters);
        }
        
        // Rimuovi event listener per la paginazione
        const prevButton = document.getElementById('prev-page');
        if (prevButton) {
            prevButton.removeEventListener('click', () => handlePageChange(state.pagination.page - 1));
        }
        
        const nextButton = document.getElementById('next-page');
        if (nextButton) {
            nextButton.removeEventListener('click', () => handlePageChange(state.pagination.page + 1));
        }
        
        // Rimuovi event delegation per i numeri di pagina
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