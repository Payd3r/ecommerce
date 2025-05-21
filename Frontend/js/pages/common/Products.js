// Importo i servizi API
import { getProducts } from '../../../api/products.js';
import CategoriesAPI from '../../../api/categories.js';
import UsersAPI from '../../../api/users.js';
import { showBootstrapToast } from '../../components/Toast.js';


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
        <div class="container py-4 products-page">
            <div class="d-flex align-items-center justify-content-between mb-0 mb-md-2">
                <h1 class="page-title mb-0">Prodotti</h1>
                <button id="toggle-filters" class="btn btn-outline-primary d-md-none ms-2" type="button">
                    <i class="bi bi-funnel"></i> Filtri
                </button>
            </div>
            <div class="page-subtitle mb-4">Scopri la nostra selezione di prodotti artigianali unici, realizzati con passione dai migliori artigiani italiani.</div>
            <div class="row pb-5 pt-2">
                <aside class="col-12 col-md-4 mb-4 mb-md-0" id="filters-container" style="${window.innerWidth < 768 ? 'display:none;' : ''}">
                    <div class="card shadow-sm border-0 p-3 position-relative me-3">
                        <button type="reset" class="btn btn-link text-secondary position-absolute top-0 end-0 mt-4 me-2 p-0" id="reset-filters" style="font-size:1rem;">Reset</button>
                        <h5 class="mb-3">Filtra i risultati</h5>
                        <form id="filters-form" class="filters-form">
                            <div class="mb-3">
                                <label for="search" class="form-label">Ricerca</label>
                                <input type="text" id="search" name="search" class="form-control" placeholder="Cerca prodotti...">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Categoria</label>
                                <div id="category-tree"></div>
                            </div>
                            <div class="mb-3">
                                <label for="artisan" class="form-label">Artigiano</label>
                                <select id="artisan" name="artisan" class="form-select rounded-3">
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
                            <button type="submit" class="btn btn-primary w-100 mt-2">Applica filtri</button>
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
    `;

    // Carica dati iniziali
    async function loadProductsData() {
        try {
            state.loading = true;
            toggleProductsLoader(true);
            // Carica categorie
            const categoriesRes = await CategoriesAPI.getCategoryTree();
            state.categories = categoriesRes || [];
            populateCategoryTree(state.categories);
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
            console.log('[Products.js] Parametri inviati a getProducts:', params);
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

    // Funzione per generare il tree delle categorie con struttura annidata (children)
    function renderCategoryTree(categories, level = 1) {
        const ul = document.createElement('ul');
        ul.className = 'list-unstyled mb-0' + (level === 1 ? ' show' : '');
        categories.forEach(cat => {
            const hasChildren = Array.isArray(cat.children) && cat.children.length > 0;
            const collapseId = `collapse-cat-${cat.id}`;
            const li = document.createElement('li');
            li.className = 'category-li position-relative';
            li.innerHTML = `
                <div class="form-check d-flex align-items-center gap-1" style="margin-bottom: 0.2rem; min-height: 1.8rem;">
                    ${hasChildren
                    ? `<button type=\"button\" class=\"btn btn-sm btn-link p-0 me-1 ms-0 category-collapse-btn d-flex align-items-center\" data-target=\"${collapseId}\" aria-expanded=\"false\" aria-controls=\"${collapseId}\"><i class=\"bi bi-caret-right-fill\"></i></button>`
                    : '<span class=\"category-empty-icon me-1\" style=\"display:inline-block;width:1.5rem;\"></span>'}
                    <input class="form-check-input ms-0" type="checkbox" id="cat-${cat.id}" value="${cat.id}" name="category[]">
                    <label class="form-check-label ms-1" for="cat-${cat.id}">${cat.name}</label>
                </div>
            `;
            if (hasChildren) {
                const childUl = renderCategoryTree(cat.children, level + 1);
                childUl.classList.add('ms-0');
                childUl.id = collapseId;
                li.appendChild(childUl);
            }
            ul.appendChild(li);
        });
        return ul;
    }

    // Popola il filtro categorie con il tree (con collapse e selezione ricorsiva)
    function populateCategoryTree(categories) {
        const treeContainer = document.getElementById('category-tree');
        if (!treeContainer) return;
        treeContainer.innerHTML = '';
        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            treeContainer.innerHTML = '<div class="text-muted">Nessuna categoria disponibile</div>';
            return;
        }
        const tree = renderCategoryTree(categories);
        treeContainer.appendChild(tree);
        // Stile per il bordo sinistro delle sottocategorie, linea sotto la checkbox, caret visibile e padding corretto
        const style = document.createElement('style');
        style.textContent = ``;
        treeContainer.appendChild(style);

        // Gestione collapse/expand icona caret SOLO JS custom
        treeContainer.querySelectorAll('.category-collapse-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = btn.getAttribute('data-target');
                const target = document.getElementById(targetId);
                if (!target) return;
                const isOpen = target.classList.contains('show');
                if (isOpen) {
                    target.classList.remove('show');
                    btn.querySelector('i').className = 'bi bi-caret-right-fill';
                } else {
                    target.classList.add('show');
                    btn.querySelector('i').className = 'bi bi-caret-down-fill';
                }
                btn.setAttribute('aria-expanded', String(!isOpen));
            });
        });

        // Selezione/deselezione ricorsiva figli e selezione padre se tutti i figli sono selezionati
        treeContainer.querySelectorAll('input[type="checkbox"][name="category[]"]').forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                // Seleziona/deseleziona tutti i figli
                const li = checkbox.closest('li');
                if (!li) return;
                const childCheckboxes = li.querySelectorAll('ul input[type="checkbox"][name="category[]"]');
                childCheckboxes.forEach(cb => { cb.checked = checkbox.checked; });
                // Aggiorna i padri
                updateParentCheckbox(li);
            });
        });

        // Funzione per aggiornare la selezione dei padri
        function updateParentCheckbox(li) {
            const parentUl = li.parentElement.closest('ul');
            if (!parentUl) return;
            const parentLi = parentUl.parentElement.closest('li');
            if (!parentLi) return;
            const parentCheckbox = parentLi.querySelector('> .form-check input[type="checkbox"][name="category[]"]');
            if (!parentCheckbox) return;
            const siblingCheckboxes = parentUl.querySelectorAll('> li > .form-check input[type="checkbox"][name="category[]"]');
            const allChecked = Array.from(siblingCheckboxes).every(cb => cb.checked);
            const someChecked = Array.from(siblingCheckboxes).some(cb => cb.checked);
            parentCheckbox.checked = allChecked;
            parentCheckbox.indeterminate = !allChecked && someChecked;
            // Ricorsivo verso l'alto
            updateParentCheckbox(parentLi);
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
            html += `
                <div class="col-6 col-md-4 col-lg-3 mb-0 d-flex align-items-stretch" style="padding-left:4px; padding-right:4px;">
                    <div class="product-card card flex-fill h-100 p-2 position-relative" style="min-width:0;">
                        <div class="product-image-wrapper d-flex align-items-center justify-content-center position-relative" style="height: 110px;">
                            ${discountBadge}
                            ${stockBadge}
                            ${product.image && product.image.url ?
                    `<img src="${product.image.url}" alt="${product.name}" class="product-img-actual" />` :
                    `<div class="product-img-placeholder">
                                    <span class="placeholder-icon">🖼️</span>
                                </div>`
                }
                        </div>
                        <div class="product-content p-1">
                            <h6 class="fw-bold mb-1 small">${product.name}</h6>
                            <p class="product-artisan text-muted mb-1 small">di ${product.artisan?.name || 'Artigiano'}</p>
                            <div class="product-footer d-flex justify-content-between align-items-center">
                                <span class="product-price fw-bold small">${product.price?.toFixed(2) || '0.00'} €</span>
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
        console.log('[Products.js] handleFilterSubmit chiamato');
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        state.filters.search = formData.get('search') || '';
        // Raccogli tutte le categorie selezionate (array)
        const selectedCategories = Array.from(form.querySelectorAll('input[name="category[]"]:checked')).map(cb => cb.value);
        console.log('[Products.js] Categorie selezionate dal tree:', selectedCategories);
        state.filters.category = selectedCategories;
        state.filters.artisan = formData.get('artisan') || '';
        state.filters.minPrice = formData.get('minPrice') || '';
        state.filters.maxPrice = formData.get('maxPrice') || '';
        state.pagination.page = 1;
        loadProducts();
        // Nascondi i filtri su mobile
        const filtersContainer = document.getElementById('filters-container');
        if (window.innerWidth < 768 && filtersContainer) {
            filtersContainer.style.display = 'none';
        }
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
        // Nascondi i filtri su mobile
        const filtersContainer = document.getElementById('filters-container');
        if (window.innerWidth < 768 && filtersContainer) {
            filtersContainer.style.display = 'none';
        }
    }

    function mount() {
        console.log('[Products.js] mount chiamato');
        loadProductsData();
        const filtersForm = document.getElementById('filters-form');
        if (filtersForm) {
            filtersForm.addEventListener('submit', handleFilterSubmit);
            console.log('[Products.js] Event listener submit aggiunto');
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
        // Gestione toggle filtri mobile
        const toggleFiltersButton = document.getElementById('toggle-filters');
        const filtersContainer = document.getElementById('filters-container');
        if (toggleFiltersButton && filtersContainer) {
            toggleFiltersButton.addEventListener('click', () => {
                if (window.innerWidth < 768) {
                    if (filtersContainer.style.display === 'none' || filtersContainer.style.display === '') {
                        filtersContainer.style.display = 'block';
                    } else {
                        filtersContainer.style.display = 'none';
                    }
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
        // Gestione toggle filtri mobile
        const toggleFiltersButton = document.getElementById('toggle-filters');
        const filtersContainer = document.getElementById('filters-container');
        if (toggleFiltersButton && filtersContainer) {
            toggleFiltersButton.removeEventListener('click', () => {
                if (window.innerWidth < 768) {
                    if (filtersContainer.style.display === 'none' || filtersContainer.style.display === '') {
                        filtersContainer.style.display = 'block';
                    } else {
                        filtersContainer.style.display = 'none';
                    }
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