import { getProducts } from '../../../api/products.js';
import { authService } from '../../services/authService.js';
import CategoriesAPI from '../../../api/categories.js';
import { showAddProductModal } from './modals/addProduct.js';
import { showEditProductModal } from './modals/editProduct.js';
import { showViewProductModal } from './modals/viewProduct.js';

/**
 * Carica la pagina di gestione prodotti per l'artigiano.
 * Inizializza la UI, gestisce filtri, categorie, tabella prodotti, paginazione e azioni.
 * @returns {Object} - Oggetto con i metodi del componente (render, mount, unmount)
 */
export async function loadManageProductsPage() {
    // Crea l'elemento principale della pagina
    const pageElement = document.createElement('div');
    pageElement.className = 'container py-4 products-page';

    const user = authService.getUser();
    let products = [];
    let categories = [];
    let filteredProducts = [];
    let currentPage = 1;
    const pageSize = 12;

    // Stato filtri
    let filter = {
        search: '',
        category: '',
        minPrice: '',
        maxPrice: '',
    };

    // Carica categorie
    try {
        categories = await CategoriesAPI.getCategoryTree();
    } catch (e) {
        categories = [];
    }

    /**
     * Carica i prodotti dal server e aggiorna la tabella e la paginazione.
     */
    async function fetchProducts() {
        console.log('fetchProducts chiamata');
        const params = {
            artisan: user.id,
            search: filter.search,
            category: filter.category,
            minPrice: filter.minPrice,
            maxPrice: filter.maxPrice,
            page: currentPage,
            limit: pageSize
        };
        console.log('fetchProducts params:', params);
        try {
            const res = await getProducts(params);
            console.log('Risposta getProducts:', res);
            products = res.products || [];
            filteredProducts = products;
            renderTable();
            renderPagination();
        } catch (e) {
            console.error('Errore fetchProducts:', e);
            filteredProducts = [];
            renderTable();
            renderPagination({ totalPages: 1, currentPage: 1 });
        }
    }

    /**
     * Renderizza la tabella dei prodotti filtrati.
     * Aggiunge i listener per visualizza, modifica, elimina e tooltip immagini.
     */
    function renderTable() {
        console.log('renderTable chiamata, prodotti:', filteredProducts);
        const tableBody = document.querySelector('#products-table-body');
        if (!tableBody) {
            console.error('Non trovo #products-table-body nel DOM!');
            return;
        }
        // Funzione per formattare la data
        function formatDateIT(dateStr) {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            if (isNaN(date)) return '-';
            const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
            const giorno = String(date.getDate()).padStart(2, '0');
            const mese = mesi[date.getMonth()];
            const anno = date.getFullYear();
            return `${giorno} ${mese} ${anno}`;
        }
        tableBody.innerHTML = filteredProducts.length === 0 ?
            `<tr><td colspan="8" class="text-center">Nessun prodotto trovato</td></tr>` :
            filteredProducts.map(p => `
                <tr data-product-id="${p.id}">
                    <td class="text-center">
                        ${p.image && p.image.url ?
                    `<div class="product-thumb-wrapper" style="position:relative; display:inline-block;">
                                <img src="${p.image.url}" alt="img" class="product-thumb-img" style="width:40px; height:40px; object-fit:cover; border-radius:6px; cursor:pointer;" />
                                <div class="product-tooltip-img" style="display:none; position:absolute; left:50%; bottom:110%; transform:translateX(-50%); z-index:10; min-width:220px;">
                                    <img src="${p.image.url}" alt="img" style="width:220px; height:220px; object-fit:cover; border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.18); border:2px solid #fff;" />
                                    <div style='position:absolute; left:50%; top:100%; transform:translateX(-50%); width:0; height:0; border-left:12px solid transparent; border-right:12px solid transparent; border-top:12px solid #fff;'></div>
                                </div>
                            </div>`
                    :
                    '<div style="width:40px; height:40px; background:#f3f3f3; border-radius:6px; display:flex; align-items:center; justify-content:center; color:#bbb; font-size:1.2rem;">🖼️</div>'
                }
                    </td>
                    <td class="text-center d-none d-md-table-cell">${p.name}</td>
                    <td class="text-center d-none d-md-table-cell">${p.category_name || '-'}</td>
                    <td class="text-center">
                        ${p.discount && p.discount > 0 && p.discount < 100 ?
                            `<span class='text-danger fw-bold'>${(p.price * (1 - p.discount / 100)).toFixed(2)} €</span> <span class='text-decoration-line-through text-muted small ms-1'>${p.price.toFixed(2)} €</span>` :
                            `${p.price} €`
                        }
                    </td>
                    <td class="text-center">${p.stock === 0 ? `<span class='text-danger fw-bold'>0</span>` : p.stock}</td>
                    <td class="text-center d-none d-md-table-cell">
                        ${p.stock > 0
                            ? `<span class='badge bg-success'>Disponibile</span>`
                            : `<span class='badge bg-danger'>Non disponibile</span>`
                        }
                    </td>
                    <td class="text-center d-none d-md-table-cell">${formatDateIT(p.created_at)}</td>
                    <td class="text-center">
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item btn-view-product" href="#"><i class="bi bi-eye me-2"></i>Visualizza</a></li>
                                <li><a class="dropdown-item btn-edit-product text-primary" href="#"><i class="bi bi-pencil-square me-2"></i>Modifica</a></li>
                                <li><a class="dropdown-item btn-delete-product text-danger" href="#"><i class="bi bi-trash me-2"></i>Elimina</a></li>
                            </ul>
                        </div>
                    </td>
                </tr>
            `).join('');

        // Tooltip immagine prodotto
        tableBody.querySelectorAll('.product-thumb-wrapper').forEach(wrapper => {
            const thumb = wrapper.querySelector('.product-thumb-img');
            const tooltip = wrapper.querySelector('.product-tooltip-img');
            if (thumb && tooltip) {
                thumb.addEventListener('mouseenter', () => {
                    tooltip.style.display = 'block';
                });
                thumb.addEventListener('mouseleave', () => {
                    tooltip.style.display = 'none';
                });
                // Per evitare flicker se si passa dal thumb al tooltip
                tooltip.addEventListener('mouseenter', () => {
                    tooltip.style.display = 'block';
                });
                tooltip.addEventListener('mouseleave', () => {
                    tooltip.style.display = 'none';
                });
            }
        });

        // Aggiungi event listener per Visualizza
        tableBody.querySelectorAll('.btn-view-product').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const tr = btn.closest('tr');
                const productId = tr.getAttribute('data-product-id');
                showViewProductModal(productId, categories);
            });
        });

        // Aggiungi event listener per Modifica
        tableBody.querySelectorAll('.btn-edit-product').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const tr = btn.closest('tr');
                const productId = tr.getAttribute('data-product-id');
                console.log('Click su Modifica, productId:', productId);
                showEditProductModal(productId, categories, () => {
                    console.log('Callback dopo editProduct');
                    resetFiltersAndRefresh();
                });
            });
        });

        // Aggiungi event listener per Elimina
        tableBody.querySelectorAll('.btn-delete-product').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const tr = btn.closest('tr');
                const productId = tr.getAttribute('data-product-id');
                // Qui puoi aggiungere la logica di eliminazione
            });
        });
    }

    /**
     * Renderizza la paginazione in base al numero totale di pagine e alla pagina corrente.
     * Gestisce i bottoni di navigazione e il cambio pagina.
     */
    function renderPagination() {
        const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
        const paginationEl = pageElement.querySelector('#products-pagination');
        if (!paginationEl) return;
        
        paginationEl.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Container per i bottoni
        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-group';
        
        // Bottone Precedente
        if (currentPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.type = 'button';
            prevBtn.className = 'btn btn-sm btn-outline-primary';
            prevBtn.textContent = 'Precedente';
            prevBtn.onclick = function() {
                currentPage--;
                renderTable();
                renderPagination();
            };
            btnGroup.appendChild(prevBtn);
        }
        
        // Bottoni pagina (massimo 5)
        const maxButtons = 5;
        const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        const endPage = Math.min(totalPages, startPage + maxButtons - 1);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.type = 'button';
            pageBtn.className = `btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'}`;
            pageBtn.textContent = i;
            
            // Solo per le pagine diverse da quella corrente
            if (i !== currentPage) {
                pageBtn.onclick = function() {
                    currentPage = i;
                    renderTable();
                    renderPagination();
                };
            }
            
            btnGroup.appendChild(pageBtn);
        }
        
        // Bottone Successivo
        if (currentPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.type = 'button';
            nextBtn.className = 'btn btn-sm btn-outline-primary';
            nextBtn.textContent = 'Successivo';
            nextBtn.onclick = function() {
                currentPage++;
                renderTable();
                renderPagination();
            };
            btnGroup.appendChild(nextBtn);
        }
        
        // Aggiungiamo i bottoni al container
        paginationEl.appendChild(btnGroup);
    }

    /**
     * Azzeramento filtri e refresh tabella prodotti.
     */
    async function resetFiltersAndRefresh() {
        console.log('resetFiltersAndRefresh');
        filter = { search: '', category: '', minPrice: '', maxPrice: '' };
        currentPage = 1;
        const form = pageElement.querySelector('#filters-form');
        if (form) form.reset();
        await fetchProducts();
    }

    // HTML
    pageElement.innerHTML = `
        <div class="container pt-2 pb-5 products-page">
            <div class="row align-items-center mb-0 mb-md-2">
                <div class="col-12 mb-2">
                    <button class="btn btn-outline-secondary" id="back-btn"><i class="bi bi-arrow-left"></i> Torna indietro</button>
                </div>
                <!-- Desktop: titolo e aggiungi prodotto sulla stessa riga -->
                <div class="col-12 d-none d-md-flex align-items-center justify-content-between">
                    <h1 class="page-title mb-0">Gestione Prodotti</h1>
                    <a href="#" id="addProductBtn" class="btn btn-success">Aggiungi prodotto</a>
                </div>
                <!-- Mobile: titolo su una riga, bottoni su riga sotto -->
                <div class="col-12 d-flex d-md-none flex-column gap-2">
                    <h1 class="page-title mb-2">Gestione Prodotti</h1>
                    <div class="d-flex gap-2">
                        <button id="toggle-filters" class="btn btn-outline-primary flex-fill" type="button">
                            <i class="bi bi-funnel"></i> Filtri
                        </button>
                        <a href="#" id="addProductBtnMobile" class="btn btn-success flex-fill "><i class="bi bi-plus-circle me-2"></i>Aggiungi</a>
                    </div>
                </div>
            </div>
            <div class="page-subtitle mb-4">Gestisci i tuoi prodotti artigianali, aggiungi nuovi articoli o modifica quelli esistenti.</div>
            <div class="row pb-5 pt-2">
                <aside class="col-12 col-md-4 mb-4 mb-md-0 filters-container" style="${window.innerWidth < 768 ? 'display:none;' : ''}">
                    <div class="card shadow-sm border-0 p-3 position-relative me-0 me-md-3">
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
                            <div class="row mb-3">
                                <div class="col-6">
                                    <label for="min-price" class="form-label">Minimo (€)</label>
                                    <input type="number" id="min-price" name="minPrice" min="0" step="1" class="form-control" placeholder="Min">
                                </div>
                                <div class="col-6">
                                    <label for="max-price" class="form-label">Massimo (€)</label>
                                    <input type="number" id="max-price" name="maxPrice" min="0" step="1" class="form-control" placeholder="Max">
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary w-100 mt-2">Applica filtri</button>
                        </form>
                    </div>
                </aside>
                <main class="col-12 col-md-8">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-body p-0">
                            <table class="table table-bordered align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th class="text-center">Logo</th>
                                        <th class="text-center d-none d-md-table-cell">Nome</th>
                                        <th class="text-center d-none d-md-table-cell">Categoria</th>
                                        <th class="text-center">Prezzo</th>
                                        <th class="text-center">Stock</th>
                                        <th class="text-center d-none d-md-table-cell">Stato</th>
                                        <th class="text-center d-none d-md-table-cell">Creato il</th>
                                        <th class="text-center">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody id="products-table-body"></tbody>
                            </table>
                        </div>
                        <div class="card-footer">
                            <nav>
                                <ul class="pagination justify-content-center mb-0" id="products-pagination"></ul>
                            </nav>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    `;

    // Eventi filtri
    const form = pageElement.querySelector('#filters-form');
    form.addEventListener('submit', e => {
        e.preventDefault();
        filter.search = form.search.value;
        // Raccogli tutte le categorie selezionate (array)
        const selectedCategories = Array.from(form.querySelectorAll('input[name="category[]"]:checked')).map(cb => cb.value);
        filter.category = selectedCategories;
        filter.minPrice = form.minPrice.value;
        filter.maxPrice = form.maxPrice.value;
        currentPage = 1;
        fetchProducts();
    });

    // Evento reset filtri
    const resetBtn = pageElement.querySelector('#reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            form.reset();
            // Deseleziona tutte le checkbox categoria
            form.querySelectorAll('input[name="category[]"]').forEach(cb => { cb.checked = false; cb.indeterminate = false; });
            filter = { search: '', category: '', minPrice: '', maxPrice: '' };
            currentPage = 1;
            fetchProducts();
        });
    }

    // Eventi paginazione
    pageElement.querySelector('#products-pagination').addEventListener('click', e => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            currentPage = parseInt(e.target.dataset.page);
            fetchProducts();
        }
    });

    // Bottone aggiungi prodotto
    pageElement.querySelector('#addProductBtn').addEventListener('click', e => {
        e.preventDefault();
        showAddProductModal(categories, () => {
            console.log('Callback dopo addProduct');
            resetFiltersAndRefresh();
        });
    });

    // Prima renderizzazione
    fetchProducts();

    // CSS responsive mobile
    if (!document.getElementById('artisan-products-mobile-style')) {
        const style = document.createElement('style');
        style.id = 'artisan-products-mobile-style';
        style.innerHTML = `
        @media (max-width: 767.98px) {
          .mobile-btns {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 1rem;
          }
          .mobile-btns button, .mobile-btns a {
            width: 100%;
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
          #filters-card { display: none; }
          #filters-card.mobile-visible { display: block; margin-bottom: 1rem; }
          .table th.d-none, .table td.d-none {
            display: none !important;
          }
          .table th, .table td {
            padding: 0.75rem 0.5rem;
          }
          #products-pagination {
            justify-content: center !important;
            margin-top: 1rem;
          }
          #products-pagination li {
            width: 48%;
            margin: 0 1%;
            font-size: 1.1rem;
          }
        }
        `;
        document.head.appendChild(style);
    }

    // Gestione bottoni mobile nel mount
    const backBtnMobile = pageElement.querySelector('#back-btn-mobile');
    if (backBtnMobile) backBtnMobile.onclick = () => window.history.back();
    const addProductBtnMobile = pageElement.querySelector('#addProductBtnMobile');
    if (addProductBtnMobile) addProductBtnMobile.onclick = e => {
        e.preventDefault();
        showAddProductModal(categories, () => {
            resetFiltersAndRefresh();
        });
    };
    // Bottone filtri mobile: mostra/nasconde i filtri
    const toggleFiltersBtn = pageElement.querySelector('#toggle-filters');
    const filtersContainer = pageElement.querySelector('.filters-container');
    if (toggleFiltersBtn && filtersContainer) {
        toggleFiltersBtn.onclick = () => {
            if (filtersContainer.style.display === 'none' || filtersContainer.style.display === '') {
                filtersContainer.style.display = 'block';
            } else {
                filtersContainer.style.display = 'none';
            }
        };
    }

    /**
     * Renderizza l'albero delle categorie per il filtro.
     * Gestisce la selezione/deselezione ricorsiva e la UI di espansione/collapse.
     * @param {Array} categories - Albero categorie
     * @param {number} level - Livello profondità (default 1)
     * @returns {HTMLElement} - Ul HTML
     */
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

    /**
     * Popola il filtro categorie con l'albero.
     * @param {Array} categories - Albero categorie
     */
    function populateCategoryTree(categories) {
        const treeContainer = pageElement.querySelector('#category-tree');
        if (!treeContainer) return;
        treeContainer.innerHTML = '';
        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            treeContainer.innerHTML = '<div class="text-muted">Nessuna categoria disponibile</div>';
            return;
        }
        const tree = renderCategoryTree(categories);
        treeContainer.appendChild(tree);
        // Collapse/expand caret
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
            updateParentCheckbox(parentLi);
        }
    }

    // Dopo aver creato l'HTML, popola l'albero categorie
    populateCategoryTree(categories);

    // Ritorna i metodi principali del componente
    return {
        render: () => pageElement,
        mount: () => {
            const backBtn = document.getElementById('back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    window.history.back();
                });
            }
        },
        unmount: () => { }
    };
}
