// Importo i servizi API
import { getProducts, getProduct, getBestSellerProducts } from '../../../api/products.js';
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
        <section class="featured pt-4">
            <div class="container">
                <h2 class="mb-0">Categorie in Evidenza</h2>
                <div class="position-relative px-3"  style="padding-left: 2vw; padding-right: 2vw;">
                    <button id="cat-carousel-left" class="btn btn-light position-absolute top-50 start-0 translate-middle-y"><i class="bi bi-chevron-left"></i></button>
                    <div id="featured-categories" class="d-flex flex-nowrap overflow-auto py-2 px-5" style="scroll-behavior: smooth; gap: 1rem; scrollbar-width: none; -ms-overflow-style: none;"></div>
                    <button id="cat-carousel-right" class="btn btn-light position-absolute top-50 end-0 translate-middle-y"><i class="bi bi-chevron-right"></i></button>
                </div>
            </div>
        </section>
        <section class="latest-arrivals py-4">
            <div class="container">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h2 class="mb-0">Ultimi Arrivi</h2>
                    <a href="/products" class="btn btn-outline-primary btn-sm mt-1 px-4 rounded-pill shadow-sm ms-auto" data-route>Esplora tutti</a>
                </div>
                <div id="latest-arrivals-container" class="row g-4"></div>
            </div>
        </section>
        <section class="featured-products py-4">
            <div class="container">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h2 class="mb-0">Prodotti più acquistati</h2>
                    <a href="/products" class="btn btn-outline-primary btn-sm mt-1 px-4 rounded-pill shadow-sm ms-auto" data-route>Esplora tutti</a>
                </div>
                <div id="featured-products-container" class="row g-4"></div>
            </div>
        </section>
        <section class="artisans-week pt-4">
            <div class="container">
                <h2 class="mb-0">Artigiani</h2>
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

            // Carica i prodotti normali (per ultimi arrivi)
            await loadProducts();

            // Carica i best seller per la sezione "Prodotti più acquistati"
            try {
                const bestSellerRes = await getBestSellerProducts(5);
                const bestSellers = (bestSellerRes.products || []).map(product => ({
                    ...product,
                    price: Number(product.price),
                    artisan: { name: product.artisan_name },
                    imageUrl: '',
                }));
                renderProductSection(bestSellers, 'featured-products-container');
            } catch (e) {
                renderProductSection([], 'featured-products-container');
            }

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
                    <div class="category-carousel-card d-flex flex-shrink-0">
                        <div class="category-card card flex-fill mb-0 shadow border-0 position-relative overflow-hidden">
                            <div class="card-body text-center py-3 px-2 position-relative" style="z-index:2;">
                                <div class="category-profile-img mx-auto mb-2 position-relative d-flex justify-content-center align-items-center">
                                    ${category.image ?
                                        `<img src="${category.image}" alt="${category.name}" />` :
                                        `<span class="category-icon fs-1">${icon}</span>`
                                    }
                                </div>
                                <h6 class="fw-bold mb-1 category-card-title">${category.name}</h6>
                                <p class="text-muted mb-2 small category-card-text">${category.product_count || 0} prodotti</p>
                                <a href="/products?category=${category.id}" class="btn btn-outline-primary btn-sm mt-1 px-4 rounded-pill shadow-sm" data-route>Esplora</a>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        // Unifica la section: titolo + carosello con padding esterno
        const section = categoriesContainer.parentElement;
        section.innerHTML = `
            <div class="position-relative px-2">
                <button id="cat-carousel-left" class="btn btn-light position-absolute top-50 start-0 translate-middle-y z-1"><i class="bi bi-chevron-left"></i></button>
                <div id="featured-categories" class="d-flex flex-nowrap overflow-auto p-4">
                    ${html}
                </div>
                <button id="cat-carousel-right" class="btn btn-light position-absolute top-50 end-0 translate-middle-y z-1"><i class="bi bi-chevron-right"></i></button>
            </div>
        `;
        // JS per lo scroll a pagina
        const container = document.getElementById('featured-categories');
        const leftBtn = document.getElementById('cat-carousel-left');
        const rightBtn = document.getElementById('cat-carousel-right');
        let carouselPage = 0;
        function scrollCarousel(direction) {
            const cards = container.querySelectorAll('.category-carousel-card');
            if (!cards.length) return;
            const cardWidth = cards[0].offsetWidth + 16; // 8px margin su entrambi i lati
            const maxScroll = container.scrollWidth - container.clientWidth;
            if (direction === 'right') {
                container.scrollBy({ left: cardWidth, behavior: 'smooth' });
            } else {
                container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
            }
            // Opzionale: puoi disabilitare le frecce se sei a inizio/fine
        }
        if (leftBtn && rightBtn && container) {
            leftBtn.onclick = () => scrollCarousel('left');
            rightBtn.onclick = () => scrollCarousel('right');
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
                    `<img src="${product.image.url}" alt="${product.name}" style="height: 100px; width: 100%; object-fit: cover; border-radius: 8px;" />` :
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
        container.className = 'row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-3';
        let html = '';
        let toShow;
        if (containerId === 'latest-arrivals-container') {
            // Ordina per data di creazione decrescente e prendi i primi 5
            toShow = products
                .slice() // copia
                .sort((a, b) => {
                    const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
                    const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
                    return dateB - dateA;
                })
                .slice(0, 5);
        } else if (containerId === 'featured-products-container') {
            toShow = shuffleArray(products).slice(0, 10);
        } else {
            toShow = shuffleArray(products);
        }
        for (let i = 0; i < toShow.length; i++) {
            const product = toShow[i];
            // Badge sconto
            let discountBadge = '';
            if (product.discount && product.discount > 0) {
                discountBadge = `<span class="badge bg-danger position-absolute top-0 start-0 m-2" style="z-index:2;">${product.discount}%</span>`;
            }
            // Badge ultimi rimasti
            let stockBadge = '';
            if (typeof product.stock === 'number' && product.stock >= 0 && product.stock <= 2) {
                stockBadge = `<span class="badge bg-warning text-dark position-absolute top-0 end-0 m-2" style="z-index:2;">Ultimi rimasti</span>`;
            }
            // Calcolo prezzo scontato
            let prezzoScontato = product.price;
            if (product.discount && product.discount > 0 && product.discount < 100) {
                prezzoScontato = product.price * (1 - product.discount / 100);
            }
            html += `
                <div class="col d-flex align-items-stretch">
                    <div class="product-card card flex-fill h-100 p-2 position-relative">
                        <div class="product-image-wrapper d-flex align-items-center justify-content-center position-relative">
                            ${discountBadge}
                            ${stockBadge}
                            ${product.image && product.image.url ?
                                `<img src="${product.image.url}" alt="${product.name}" class="product-img-actual" />` :
                                `<div class="product-img-placeholder">
                                    <span class="placeholder-icon">🖼️</span>
                                </div>`
                            }
                        </div>
                        <div class="product-content p-1 mt-2">
                            <h6 class="fw-bold mb-1 product-name-text">${product.name}</h6>
                            <p class="product-artisan text-muted mb-1 small">di ${product.artisan?.name || 'Artigiano'}</p>
                            <div class="product-footer d-flex justify-content-between align-items-center mt-2">
                                <span class="product-price fw-bold small">
                                    ${product.discount && product.discount > 0 && product.discount < 100 ?
                                        `<span class='text-danger'>${prezzoScontato.toFixed(2)} €</span> <span class='text-decoration-line-through text-muted small ms-1'>${product.price.toFixed(2)} €</span>` :
                                        `${product.price?.toFixed(2) || '0.00'} €`
                                    }
                                </span>
                                <a href="/products/${product.id}" class="btn btn-outline-primary btn-sm" data-route>Dettagli</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    }

    // Carosello artigiani della settimana
    function renderArtisansCarousel(artisans) {
        const container = document.getElementById('artisans-carousel');
        if (!container) return;
        let html = '';
        // Simboli diversi per ogni artigiano (ciclo)
        const iconList = ['🧑‍🎨', '👩‍🎨', '🧔', '👨‍🦰', '👩‍🦰', '🧑‍🦱', '👨‍🦳', '👩‍🦳', '🧑‍🦲', '👨‍🦲', '👩‍🦲', '🧑‍🦰', '🧑‍🦳', '🧑‍🦲'];
        artisans.slice(0, 20).forEach((artisan, idx) => {
            // Format approved_at
            let membroDa = '';
            if (artisan.approved_at) {
                const date = new Date(artisan.approved_at);
                const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
                membroDa = `Membro da: ${date.getDate()} ${mesi[date.getMonth()]} ${date.getFullYear()}`;
            }
            html += `
                <div class="category-carousel-card d-flex flex-shrink-0">
                    <div class="artisan-card card flex-fill mb-0 shadow border-0 position-relative overflow-hidden">
                        ${artisan.url_banner ?
                            `<div class='artisan-banner position-absolute top-0 start-0 w-100 h-100' style="background: url('${artisan.url_banner}') center/cover no-repeat; opacity: 0.25; z-index:1;"></div>`
                            : ''}
                        <div class="card-body text-center py-3 px-2 position-relative" style="z-index:2;">
                            <div class="artisan-profile-img mx-auto mb-2 position-relative d-flex justify-content-center align-items-center" style="width: 90px; height: 90px; border-radius: 50%; overflow: hidden; border: 4px solid #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.15); background: #f8f9fa;">
                                ${artisan.image ?
                                    `<img src="${artisan.image}" alt="${artisan.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />` :
                                    `<span class="category-icon fs-1">${iconList[idx % iconList.length]}</span>`
                                }
                            </div>
                            <h6 class="fw-bold mb-1 category-card-title">${artisan.name}</h6>
                            <div class="text-muted small mb-2 artisan-member-date">${membroDa}</div>
                            <a href="/artisan-shop/${artisan.id}" class="btn btn-outline-primary btn-sm mt-1 px-4 rounded-pill shadow-sm" data-route>Scopri</a>
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
            const card = container.querySelector('.category-card, .artisan-card');
            const scrollAmount = card ? card.offsetWidth + 8 : 120;
            leftBtn.onclick = () => container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            rightBtn.onclick = () => container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }

        // Stili specifici per le card artigiani
        const artisanCardStyleId = 'artisan-card-styles-override';
        let styleElement = document.getElementById(artisanCardStyleId);
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = artisanCardStyleId;
            document.head.appendChild(styleElement);
        }
        styleElement.textContent = `
            #artisans-carousel {
                display: flex;
                flex-wrap: nowrap;
                overflow-x: hidden;
                gap: 1rem;
                padding-bottom: 24px !important;
                padding-top: 20px !important;
                overflow-y: visible !important;
                scrollbar-width: thin;
                width: 100%;
                min-width: 0;
            }
        `;
        // Gestione scroll "a pagina" per mobile e desktop
        let carouselPage = 0;
        function scrollCarousel(direction) {
            const container = document.getElementById('artisans-carousel');
            const cards = container.querySelectorAll('.category-carousel-card');
            if (!cards.length) return;
            let cardsPerPage = 3;
            if (window.innerWidth >= 1200) {
                cardsPerPage = 5;
            } else if (window.innerWidth >= 768) {
                cardsPerPage = 5;
            }
            const cardWidth = cards[0].offsetWidth + parseInt(getComputedStyle(container).gap || 16);
            const totalCards = cards.length;
            const maxPage = Math.max(0, Math.ceil(totalCards / cardsPerPage) - 1);
            if (direction === 'right') {
                carouselPage = Math.min(carouselPage + 1, maxPage);
            } else {
                carouselPage = Math.max(carouselPage - 1, 0);
            }
            container.scrollTo({
                left: carouselPage * cardWidth * cardsPerPage,
                behavior: 'smooth'
            });
        }
        if (leftBtn && rightBtn && container) {
            leftBtn.onclick = () => scrollCarousel('left');
            rightBtn.onclick = () => scrollCarousel('right');
        }
    }

    return {
        render: () => pageElement,
        mount,
        unmount
    };
}
