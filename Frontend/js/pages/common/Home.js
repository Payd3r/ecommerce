// Importo i servizi API
import { getProducts, getProduct } from '../../../api/products.js';
import CategoriesAPI from '../../../api/categories.js';
import UsersAPI from '../../../api/users.js';

// Importo i componenti
import { showBootstrapToast } from '../../components/Toast.js';

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
                <div class="position-relative px-3"  style="padding-left: 2vw; padding-right: 2vw;">
                    <button id="cat-carousel-left" class="btn btn-light position-absolute top-50 start-0 translate-middle-y z-1"><i class="bi bi-chevron-left"></i></button>
                    <div id="featured-categories" class="d-flex flex-nowrap overflow-auto py-2 px-5" style="scroll-behavior: smooth; gap: 1rem; scrollbar-width: none; -ms-overflow-style: none;"></div>
                    <button id="cat-carousel-right" class="btn btn-light position-absolute top-50 end-0 translate-middle-y z-1"><i class="bi bi-chevron-right"></i></button>
                </div>
            </div>
        </section>
        <section class="latest-arrivals py-4">
            <div class="container">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h2 class="mb-0">Ultimi Arrivi</h2>
                    <a href="/products" class="btn btn-link ms-auto" data-route>visualizza altro..</a>
                </div>
                <div id="latest-arrivals-container" class="row g-4"></div>
            </div>
        </section>
        <section class="featured-products py-4">
            <div class="container">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h2 class="mb-0">Prodotti in Evidenza</h2>
                    <a href="/products" class="btn btn-link ms-auto" data-route>visualizza altro..</a>
                </div>
                <div id="featured-products-container" class="row g-4"></div>
            </div>
        </section>
        <section class="artisans-week py-4">
            <div class="container">
                <h2 class="mb-4">Artigiani della Settimana</h2>
                <div class="position-relative px-3" style="padding-left: 2vw; padding-right: 2vw;">
                    <button id="artisan-carousel-left" class="btn btn-light position-absolute top-50 start-0 translate-middle-y z-1"><i class="bi bi-chevron-left"></i></button>
                    <div id="artisans-carousel" class="d-flex flex-nowrap overflow-auto py-2 px-5" style="scroll-behavior: smooth; gap: 1rem; scrollbar-width: none; -ms-overflow-style: none;"></div>
                    <button id="artisan-carousel-right" class="btn btn-light position-absolute top-50 end-0 translate-middle-y z-1"><i class="bi bi-chevron-right"></i></button>
                </div>
            </div>
        </section>
        <section class="cta-section py-5 bg-light">
            <div class="container">
                <div class="cta-content text-center">
                    <h2>Sei un Artigiano?</h2>
                    <p>Unisciti alla nostra piattaforma e porta i tuoi prodotti artigianali a un pubblico più ampio.</p>
                    <a href="/became-artisan" class="btn btn-secondary" data-route>Inizia a Vendere</a>
                </div>
            </div>
        </section>
    `;

    /**
     * Carica i dati per la home page
     */
    async function loadHomeData() {
        try {
            state.loading = true;
            toggleProductsLoader(true);

            // Carica le categorie
            const categoriesRes = await CategoriesAPI.getCategories();
            state.categories = categoriesRes || [];

            // Renderizza le categorie in evidenza
            renderFeaturedCategories(state.categories.slice(0, 20));

            // Carica artigiani
            const artisansRes = await UsersAPI.getArtisans();
            console.log("artisan", artisansRes);
            state.artisans = artisansRes.data || [];


            renderArtisansCarousel(state.artisans);

            // Carica i prodotti
            await loadProducts();

        } catch (error) {
            console.error('Errore nel caricamento dei dati:', error);
            showBootstrapToast('Errore nel caricamento dei dati. Riprova più tardi.', 'Errore', 'error');
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

            // Renderizza le due sezioni con prodotti random
            renderProductSection(state.products, 'latest-arrivals-container');
            renderProductSection(state.products, 'featured-products-container');


        } catch (error) {
            console.error('Errore nel caricamento dei prodotti:', error);
            showBootstrapToast('Errore nel caricamento dei prodotti. Riprova più tardi.', 'Errore', 'error');
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
     * Visualizza le categorie in evidenza
     * @param {Array} categories - Lista delle categorie da visualizzare
     */
    function renderFeaturedCategories(categories) {
        const categoriesContainer = document.getElementById('featured-categories');
        if (!categoriesContainer) return;

        console.log("categories", categories);
        let html = '';
        if (categories.length === 0) {
            html = '<div class="empty-state">Nessuna categoria disponibile</div>';
        } else {
            // Escludi duplicati per nome categoria
            const uniqueCategories = [];
            const seenNames = new Set();
            categories.forEach(cat => {
                if (!seenNames.has(cat.name.toLowerCase())) {
                    uniqueCategories.push(cat);
                    seenNames.add(cat.name.toLowerCase());
                }
            });
            // Simboli diversi per ogni card (ciclo se più categorie)
            const iconList = ['🏺', '🪵', '🧵', '🥃', '⚙️', '💍', '🧶', '🪡', '🪚', '🪓', '🪙', '🧲', '🧰', '🪞', '🧴', '🧿', '🪔', '🧺', '🪆', '🧸', '🪁'];
            uniqueCategories.forEach((category, idx) => {
                const icon = iconList[idx % iconList.length];
                html += `
                    <div class="col-8 col-sm-6 col-md-4 col-lg-3 d-flex flex-shrink-0" style="min-width: 180px; max-width: 210px;">
                        <div class="category-card card flex-fill mb-0 shadow-sm border-0">
                            <div class="card-body text-center py-4">
                                <div class="category-image mb-2 d-flex justify-content-center align-items-center" style="background-color: var(--secondary-color); width: 100px; height: 100px; margin: 0 auto; border-radius: 50%; overflow: hidden;">
                                    ${category.image ?
                                        `<img src=\"http://localhost:3005${category.image}\" alt=\"${category.name}\" style=\"width:100px; height:100px; object-fit:cover; border-radius:50%;\" />` :
                                        `<span class=\"category-icon fs-2\">${icon}</span>`
                                    }
                                </div>
                                <h5 class="fw-bold mb-1">${category.name}</h5>
                                <p class="text-muted mb-2 small">${category.productCount || 0} prodotti</p>
                                <a href="/products?category=${category.id}" class="btn btn-outline-primary btn-sm mt-2" data-route>Esplora</a>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        // Unifica la section: titolo + carosello con padding esterno
        const section = categoriesContainer.parentElement;
        section.innerHTML = `
            <div class="position-relative px-3"  style="padding-left: 2vw; padding-right: 2vw;">
                <button id="cat-carousel-left" class="btn btn-light position-absolute top-50 start-0 translate-middle-y z-1"><i class="bi bi-chevron-left"></i></button>
                <div id="featured-categories" class="d-flex flex-nowrap overflow-auto py-2 px-5" style="scroll-behavior: smooth; gap: 1rem; scrollbar-width: none; -ms-overflow-style: none;">
                    ${html}
                </div>
                <button id="cat-carousel-right" class="btn btn-light position-absolute top-50 end-0 translate-middle-y z-1"><i class="bi bi-chevron-right"></i></button>
            </div>
            <style>
                #featured-categories::-webkit-scrollbar { display: none; }
            </style>
        `;
        // JS per lo scroll di una sola card
        const container = document.getElementById('featured-categories');
        const leftBtn = document.getElementById('cat-carousel-left');
        const rightBtn = document.getElementById('cat-carousel-right');
        if (leftBtn && rightBtn && container) {
            const card = container.querySelector('.category-card');
            const scrollAmount = card ? card.offsetWidth + 16 : 240; // 16px gap
            leftBtn.onclick = () => container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            rightBtn.onclick = () => container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
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
            // Mostra immagine se presente, altrimenti icona
            html += `
                <div class="product-card card">
                    <div class="product-image" style="background-color: var(--light-bg); display: flex; align-items: center; justify-content: center; height: 120px;">
                        ${product.image && product.image.url ?
                    `<img src="http://localhost:3005${product.image.url}" alt="${product.name}" style="height: 100px; width: 100%; object-fit: cover; border-radius: 8px;" />` :
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

    // Funzione di utilità per mischiare un array
    function shuffleArray(array) {
        const arr = array.slice();
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // Renderizza una sezione prodotti (max 10, 2 righe da 5)
    function renderProductSection(products, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        let html = '';
        let toShow = shuffleArray(products);
        if (containerId === 'latest-arrivals-container') {
            toShow = toShow.slice(0, 5);
        } else {
            toShow = toShow.slice(0, 10);
        }
        // Calcola la larghezza delle card in base al numero di prodotti
        const colClass = (containerId === 'latest-arrivals-container' && toShow.length === 5)
            ? 'd-flex align-items-stretch custom-col-5'
            : (toShow.length <= 5 ? 'col-12 col-md-6 col-lg-3 col-xl-2 d-flex align-items-stretch' : 'col-12 col-sm-6 col-lg-2 d-flex align-items-stretch');
        for (let i = 0; i < toShow.length; i++) {
            const product = toShow[i];
            html += `
                <div class="${colClass} mb-3">
                    <div class="product-card card flex-fill h-100">
                        <div class="product-image d-flex align-items-center justify-content-center" style="background-color: var(--light-bg); height: 220px;">
                            ${product.image && product.image.url ?
                    `<img src="http://localhost:3005${product.image.url}" alt="${product.name}" style="height: 200px; width: 100%; object-fit: cover; border-radius: 8px; padding-inline: 10px;" />` :
                    `<div style="width: 120px; height: 120px; background: #fff; border: 1px solid #eee; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
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
        }
        container.innerHTML = html;
        // Applica stile custom per 5 card
        if (containerId === 'latest-arrivals-container' && toShow.length === 5) {
            const styleId = 'custom-col-5-style';
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.innerHTML = `
                    #${containerId} > .custom-col-5 {
                        width: 20% !important;
                        min-width: 220px;
                        max-width: 1fr;
                    }
                    @media (max-width: 991px) {
                        #${containerId} > .custom-col-5 { width: 50% !important; }
                    }
                    @media (max-width: 600px) {
                        #${containerId} > .custom-col-5 { width: 100% !important; }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }

    // Carosello artigiani della settimana
    function renderArtisansCarousel(artisans) {
        const container = document.getElementById('artisans-carousel');
        if (!container) return;
        let html = '';
        // Simboli diversi per ogni artigiano (ciclo)
        const iconList = ['🧑‍🎨', '👩‍🎨', '🧔', '👨‍🦰', '👩‍🦰', '🧑‍🦱', '👨‍🦳', '👩‍🦳', '🧑‍🦲', '👨‍🦲', '👩‍🦲', '🧑‍🦰', '🧑‍🦳', '🧑‍🦲'];
        artisans.slice(0, 20).forEach((artisan, idx) => {
            html += `
                <div class="col-8 col-sm-6 col-md-4 col-lg-3 d-flex flex-shrink-0" style="min-width: 220px; max-width: 260px;">
                    <div class="category-card card flex-fill mb-0 shadow-sm border-0">
                        <div class="card-body text-center py-4">
                            <div class="category-image mb-2 d-flex justify-content-center align-items-center" style="background-color: var(--secondary-color); width: 100px; height: 100px; margin: 0 auto; border-radius: 50%; overflow: hidden;">
                                ${artisan.image ?
                                    `<img src="http://localhost:3005${artisan.image}" alt="${artisan.name}" style="width:100px; height:100px; object-fit:cover;" />` :
                                    `<span class="category-icon fs-2">${iconList[idx % iconList.length]}</span>`
                                }
                            </div>
                            <h5 class="fw-bold mb-1">${artisan.name}</h5>
                            <a href="/artisan-shop/${artisan.id}" class="btn btn-outline-primary btn-sm mt-2" data-route>Scopri</a>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
        // Carosello scroll
        const leftBtn = document.getElementById('artisan-carousel-left');
        const rightBtn = document.getElementById('artisan-carousel-right');
        if (leftBtn && rightBtn && container) {
            const card = container.querySelector('.category-card');
            const scrollAmount = card ? card.offsetWidth + 16 : 240;
            leftBtn.onclick = () => container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            rightBtn.onclick = () => container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    }

    return {
        render: () => pageElement,
        mount,
        unmount
    };
} 