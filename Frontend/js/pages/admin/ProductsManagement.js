import { getProducts } from '../../../api/products.js';
import { authService } from '../../services/authService.js';
import CategoriesAPI from '../../../api/categories.js';
import UsersAPI from '../../../api/users.js';
import { showAddProductModal } from '../artisan/modals/addProduct.js';
import { showEditProductModal } from '../artisan/modals/editProduct.js';
import { router } from '../../router.js';

export async function loadProductsManagementPage() {
    const pageElement = document.createElement('div');
    pageElement.className = 'container py-4';

    const user = authService.getUser();
    let products = [];
    let categories = [];
    let artisans = [];
    let filteredProducts = [];
    // Stato filtri e paginazione
    let currentFilters = {
        search: '',
        category: '',
        minPrice: '',
        maxPrice: '',
        artisan: '',
        page: 1,
        limit: 12
    };

    // Carica categorie
    try {
        categories = await CategoriesAPI.getCategoryTree();
    } catch (e) {
        categories = [];
    }

    // Carica artigiani
    try {
        const res = await UsersAPI.getArtisans({ limit: 100 });
        artisans = res.artisans || res.data || [];
    } catch (e) {
        artisans = [];
    }

    // Carica prodotti
    async function fetchProducts(params = {}) {
        currentFilters = { ...currentFilters, ...params };
        try {
            const res = await getProducts(currentFilters);
            products = res.products || [];
            filteredProducts = products;
            renderTable();
            renderPagination(res.pagination);
        } catch (e) {
            console.error('Errore nel caricamento dei prodotti:', e);
        }
    }

    // Funzione di utilità per formattare la data
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

    // Funzione per renderizzare la tabella
    function renderTable() {
        console.log('renderTable chiamata, prodotti:', filteredProducts);
        // Prendi SEMPRE il riferimento attuale dal DOM
        const tableBody = pageElement.querySelector('#products-table-body');
        if (!tableBody) {
            console.error('Non trovo #products-table-body nel DOM!');
            return;
        }
        tableBody.innerHTML = filteredProducts.length === 0 ?
            `<tr><td colspan="8" class="text-center">Nessun prodotto trovato</td></tr>` :
            filteredProducts.map(p => `
                <tr data-product-id="${p.id}">
                    <td class="text-center">${p.name}</td>
                    <td class="text-center d-none d-md-table-cell">${p.category_name || '-'}</td>
                    <td class="text-center d-none d-md-table-cell">
                        ${p.discount && p.discount > 0 && p.discount < 100 ?
                            `<span class='text-danger fw-bold'>${(p.price * (1 - p.discount / 100)).toFixed(2)} €</span> <span class='text-decoration-line-through text-muted small ms-1'>${p.price.toFixed(2)} €</span>` :
                            `${p.price} €`
                        }
                    </td>
                    <td class="text-center d-none d-md-table-cell">${p.stock > 0 ? 'Disponibile' : 'Non disponibile'}</td>
                    <td class="text-center d-none d-md-table-cell">${formatDateIT(p.created_at)}</td>
                    <td class="text-center d-none d-md-table-cell">${p.artisan_name || p.artisan_email || '-'}</td>
                    <td class="text-center">
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center justify-content-center" type="button" data-bs-toggle="dropdown">
                                <i class="bi bi-three-dots"></i>
                            </button>
                            <ul class="dropdown-menu text-center">
                                <li><a class="dropdown-item d-flex align-items-center justify-content-center gap-2 btn-edit-product" href="#"><i class="bi bi-pencil"></i> Modifica</a></li>
                                <li><a class="dropdown-item text-danger d-flex align-items-center justify-content-center gap-2" href="#"><i class="bi bi-trash"></i> Elimina</a></li>
                            </ul>
                        </div>
                    </td>
                </tr>
            `).join('');

        // Aggiungi event listener per Modifica
        tableBody.querySelectorAll('.btn-edit-product').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const tr = btn.closest('tr');
                const productId = tr.getAttribute('data-product-id');
                console.log('Click su Modifica, productId:', productId);
                showEditProductModal(productId, flattenCategories(categories), () => {
                    console.log('Callback dopo editProduct');
                    resetFiltersAndRefresh();
                });
            });
        });

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
                tooltip.addEventListener('mouseenter', () => {
                    tooltip.style.display = 'block';
                });
                tooltip.addEventListener('mouseleave', () => {
                    tooltip.style.display = 'none';
                });
            }
        });
    }

    // Funzione per renderizzare la paginazione
    function renderPagination(pagination) {
        const totalPages = pagination.totalPages || 1;
        const current = pagination.currentPage || 1;
        const paginationEl = pageElement.querySelector('#products-pagination');
        paginationEl.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Container per i bottoni
        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-group';
        
        // Bottone Precedente
        if (current > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.type = 'button';
            prevBtn.className = 'btn btn-sm btn-outline-primary';
            prevBtn.textContent = 'Precedente';
            prevBtn.onclick = function() {
                fetchProducts({ page: current - 1 });
            };
            btnGroup.appendChild(prevBtn);
        }
        
        // Bottoni pagina (massimo 5)
        const maxButtons = 5;
        const startPage = Math.max(1, current - Math.floor(maxButtons / 2));
        const endPage = Math.min(totalPages, startPage + maxButtons - 1);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.type = 'button';
            pageBtn.className = `btn btn-sm ${i === current ? 'btn-primary' : 'btn-outline-primary'}`;
            pageBtn.textContent = i;
            
            // Solo per le pagine diverse da quella corrente
            if (i !== current) {
                pageBtn.onclick = function() {
                    fetchProducts({ page: i });
                };
            }
            
            btnGroup.appendChild(pageBtn);
        }
        
        // Bottone Successivo
        if (current < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.type = 'button';
            nextBtn.className = 'btn btn-sm btn-outline-primary';
            nextBtn.textContent = 'Successivo';
            nextBtn.onclick = function() {
                fetchProducts({ page: current + 1 });
            };
            btnGroup.appendChild(nextBtn);
        }
        
        // Aggiungiamo i bottoni al container
        paginationEl.appendChild(btnGroup);
    }

    // Funzione per azzerare i filtri e refreshare la tabella
    async function resetFiltersAndRefresh() {
        console.log('resetFiltersAndRefresh');
        currentFilters = {
            search: '',
            category: '',
            minPrice: '',
            maxPrice: '',
            artisan: '',
            page: 1,
            limit: 12
        };
        const form = pageElement.querySelector('#filters-form');
        if (form) form.reset();
        await fetchProducts();
    }

    // HTML FILTRI AVANZATI (come Products.js)
    pageElement.innerHTML = `
        <div class="row align-items-center">
            <div class="col-12 text-center">
                <h1 class="display-5 fw-bold ">Gestione Prodotti</h1>
            </div>
        </div>
        <div class="row mb-4 align-items-center d-none d-md-flex">
            <div class="col-6 d-flex align-items-center">
                <button class="btn btn-outline-secondary" id="back-btn"><i class="bi bi-arrow-left"></i> Torna indietro</button>
            </div>
            <div class="col-6 d-flex justify-content-end">
                <button id="refreshProductsBtn" class="btn btn-outline-primary d-flex align-items-center gap-2">
                    <span id="refresh-spinner" class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                    <i class="bi bi-arrow-clockwise"></i> Aggiorna tabella
                </button>
            </div>
        </div>
        <div class="row mb-3 d-flex d-md-none">
            <div class="col-12 d-flex flex-column gap-2">
                <button class="btn btn-outline-secondary w-100" id="back-btn-mobile"><i class="bi bi-arrow-left"></i> Torna indietro</button>
                <button id="refreshProductsBtnMobile" class="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2">
                    <span id="refresh-spinner-mobile" class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                    <i class="bi bi-arrow-clockwise"></i> Aggiorna tabella
                </button>
            </div>
        </div>
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
                                ${artisans.map(a => `<option value="${a.id}">${a.name || a.email}</option>`).join('')}
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
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span>Prodotti</span>
                    </div>
                    <div class="card-body p-0" id="products-table-wrapper">
                        <table class="table table-bordered align-middle mb-0">
                            <thead>
                                <tr>
                                    <th class="text-center">Nome</th>
                                    <th class="text-center d-none d-md-table-cell">Categoria</th>
                                    <th class="text-center d-none d-md-table-cell">Prezzo</th>
                                    <th class="text-center d-none d-md-table-cell">Stato</th>
                                    <th class="text-center d-none d-md-table-cell">Creato il</th>
                                    <th class="text-center d-none d-md-table-cell">Artigiano</th>
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
        <style>
        @media (max-width: 767.98px) {
            #filters-container { margin-bottom: 1.5rem !important; }
            #products-table-wrapper { overflow-x: auto; }
            .table th, .table td { white-space: nowrap; }
        }
        </style>
    `;

    // Event listener per il bottone back-btn (subito dopo aver settato l'HTML)
    const backBtn = pageElement.querySelector('#back-btn');
    if (backBtn) backBtn.addEventListener('click', () => {
        router.navigate('/admin/dashboard');
    });

    // TREE CATEGORIE (come Products.js)
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
        // CSS per minimizzazione/espansione e rotazione caret
        const style = document.createElement('style');
        style.textContent = `
        .category-li ul {
            display: none;
            margin-left: 1.5rem;
            padding-left: 0.5rem;
            border-left: 1px solid #eee;
        }
        .category-li ul.show {
            display: block;
        }
        .category-collapse-btn i {
            transition: transform 0.2s;
        }
        .category-collapse-btn[aria-expanded="true"] i {
            transform: rotate(90deg);
        }
        `;
        treeContainer.appendChild(style);
        // Collapse/expand caret
        treeContainer.querySelectorAll('.category-collapse-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = btn.getAttribute('data-target');
                const target = pageElement.querySelector(`#${targetId}`);
                if (!target) return;
                const isOpen = target.classList.contains('show');
                if (isOpen) {
                    target.classList.remove('show');
                    btn.setAttribute('aria-expanded', 'false');
                } else {
                    target.classList.add('show');
                    btn.setAttribute('aria-expanded', 'true');
                }
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
    populateCategoryTree(categories);

    // Popola filtro artigiano
    function populateArtisanFilter(artisans) {
        const artisanSelect = pageElement.querySelector('#artisan');
        if (!artisanSelect) return;
        let optionsHtml = '<option value="">Tutti gli artigiani</option>';
        artisans.forEach(artisan => {
            optionsHtml += `<option value="${artisan.id}">${artisan.name || artisan.email}</option>`;
        });
        artisanSelect.innerHTML = optionsHtml;
    }
    populateArtisanFilter(artisans);

    // Funzione ricorsiva per ottenere tutti gli ID delle categorie selezionate e dei loro figli
    function getAllCategoryIds(selectedIds, categories) {
        let allIds = new Set();
        function traverse(nodes) {
            for (const cat of nodes) {
                if (selectedIds.includes(String(cat.id))) {
                    collectIds(cat);
                } else if (cat.children && cat.children.length) {
                    traverse(cat.children);
                }
            }
        }
        function collectIds(cat) {
            allIds.add(String(cat.id));
            if (cat.children && cat.children.length) {
                cat.children.forEach(collectIds);
            }
        }
        traverse(categories);
        return Array.from(allIds);
    }

    // Gestione submit filtri avanzata
    const filtersForm = pageElement.querySelector('#filters-form');
    filtersForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const formData = new FormData(filtersForm);
        currentFilters.search = formData.get('search') || '';
        // Categorie: array di tutte le selezionate
        const selectedCategories = Array.from(filtersForm.querySelectorAll('input[name="category[]"]:checked')).map(cb => cb.value);
        const allCategoryIds = getAllCategoryIds(selectedCategories, categories);
        currentFilters.category = allCategoryIds;
        currentFilters.artisan = formData.get('artisan') || '';
        currentFilters.minPrice = formData.get('minPrice') || '';
        currentFilters.maxPrice = formData.get('maxPrice') || '';
        currentFilters.page = 1;
        fetchProducts(currentFilters);
        // Nascondi i filtri su mobile
        const filtersContainer = pageElement.querySelector('#filters-container');
        if (window.innerWidth < 768 && filtersContainer) {
            filtersContainer.style.display = 'none';
        }
    });
    // Reset filtri
    pageElement.querySelector('#reset-filters').addEventListener('click', function () {
        currentFilters = {
            search: '',
            category: '',
            minPrice: '',
            maxPrice: '',
            artisan: '',
            page: 1,
            limit: 12
        };
        filtersForm.reset();
        fetchProducts(currentFilters);
        // Nascondi i filtri su mobile
        const filtersContainer = pageElement.querySelector('#filters-container');
        if (window.innerWidth < 768 && filtersContainer) {
            filtersContainer.style.display = 'none';
        }
    });
    // Toggle filtri mobile
    const toggleFiltersButton = pageElement.querySelector('#toggle-filters');
    const filtersContainer = pageElement.querySelector('#filters-container');
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
    // Bottoni mobile
    const backBtnMobile = pageElement.querySelector('#back-btn-mobile');
    if (backBtnMobile) backBtnMobile.addEventListener('click', () => {
        router.navigate('/admin/dashboard');
    });
    // Bottone refresh mobile
    const refreshBtnMobile = pageElement.querySelector('#refreshProductsBtnMobile');
    const refreshSpinnerMobile = pageElement.querySelector('#refresh-spinner-mobile');
    if (refreshBtnMobile) {
        refreshBtnMobile.addEventListener('click', async () => {
            refreshBtnMobile.setAttribute('disabled', 'disabled');
            refreshSpinnerMobile.classList.remove('d-none');
            await fetchProducts(currentFilters);
            refreshSpinnerMobile.classList.add('d-none');
            refreshBtnMobile.removeAttribute('disabled');
        });
    }
    // Bottone refresh desktop
    const refreshBtn = pageElement.querySelector('#refreshProductsBtn');
    const refreshSpinner = pageElement.querySelector('#refresh-spinner');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.setAttribute('disabled', 'disabled');
            refreshSpinner.classList.remove('d-none');
            await fetchProducts(currentFilters);
            refreshSpinner.classList.add('d-none');
            refreshBtn.removeAttribute('disabled');
        });
    }

    // Prima renderizzazione
    fetchProducts(currentFilters);

    // Funzione per appiattire l'albero delle categorie
    function flattenCategories(categories) {
        let result = [];
        for (const cat of categories) {
            result.push({ id: cat.id, name: cat.name });
            if (cat.children && cat.children.length > 0) {
                result = result.concat(flattenCategories(cat.children));
            }
        }
        return result;
    }

    return {
        render: () => pageElement,
        mount: () => { /* vuoto, non serve più qui */ },
        unmount: () => { }
    };
}
