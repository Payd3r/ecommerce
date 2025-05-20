import { getProducts } from '../../../api/products.js';
import { authService } from '../../services/authService.js';
import CategoriesAPI from '../../../api/categories.js';
import { showAddProductModal } from './modals/addProduct.js';
import { showEditProductModal } from './modals/editProduct.js';
import { showViewProductModal } from './modals/viewProduct.js';

export async function loadManageProductsPage() {
    const pageElement = document.createElement('div');
    pageElement.className = 'container py-4';

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
        categories = await CategoriesAPI.getCategories();
    } catch (e) {
        categories = [];
    }

    // Carica prodotti
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

    // Funzione per renderizzare la tabella
    function renderTable() {
        console.log('renderTable chiamata, prodotti:', filteredProducts);
        const tableBody = document.querySelector('#products-table-body');
        if (!tableBody) {
            console.error('Non trovo #products-table-body nel DOM!');
            return;
        }
        tableBody.innerHTML = filteredProducts.length === 0 ?
            `<tr><td colspan="8" class="text-center">Nessun prodotto trovato</td></tr>` :
            filteredProducts.map(p => `
                <tr data-product-id="${p.id}">
                    <td class="text-center">
                        ${p.image && p.image.url ?
                    `<div class="product-thumb-wrapper" style="position:relative; display:inline-block;">
                                <img src="http://localhost:3015${p.image.url}" alt="img" class="product-thumb-img" style="width:40px; height:40px; object-fit:cover; border-radius:6px; cursor:pointer;" />
                                <div class="product-tooltip-img" style="display:none; position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); z-index:10;">
                                    <img src="http://localhost:3015${p.image.url}" alt="img" style="width:220px; height:220px; object-fit:cover; border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.18); border:2px solid #fff;" />
                                </div>
                            </div>`
                    :
                    '<div style="width:40px; height:40px; background:#f3f3f3; border-radius:6px; display:flex; align-items:center; justify-content:center; color:#bbb; font-size:1.2rem;">🖼️</div>'
                }
                    </td>
                    <td class="text-center d-none d-md-table-cell">${p.name}</td>
                    <td class="text-center d-none d-md-table-cell">${p.category_name || '-'}</td>
                    <td class="text-center">${p.price} €</td>
                    <td class="text-center">${p.stock}</td>
                    <td class="text-center d-none d-md-table-cell">${p.stock > 0 ? 'Disponibile' : 'Non disponibile'}</td>
                    <td class="text-center d-none d-md-table-cell">${p.created_at ? p.created_at.split('T')[0] : '-'}</td>
                    <td class="text-center">
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                Azioni
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item btn-view-product" href="#">Visualizza</a></li>
                                <li><a class="dropdown-item btn-edit-product text-primary" href="#">Modifica</a></li>
                                <li><a class="dropdown-item btn-delete-product text-danger" href="#">Elimina</a></li>
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

    // Funzione per renderizzare la paginazione
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

    // Funzione per azzerare i filtri e refreshare la tabella
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
                <a href="#" id="addProductBtn" class="btn btn-success">Aggiungi prodotto</a>
            </div>
        </div>
        <div class="row d-flex d-md-none">
            <div class="col-12 mobile-btns">
                <button class="btn btn-outline-secondary w-100" id="back-btn-mobile"><i class="bi bi-arrow-left"></i> Torna indietro</button>
                <a href="#" id="addProductBtnMobile" class="btn btn-success w-100">Aggiungi prodotto</a>
                <button class="btn btn-primary w-100" id="toggle-filters-mobile">Filtri</button>
            </div>
        </div>
        <div class="row g-4">
            <div class="col-md-4" id="filters-card">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span>Filtri</span>
                        <button type="button" id="resetFiltersBtn" class="btn btn-sm btn-outline-secondary">Azzera filtri</button>
                    </div>
                    <div class="card-body">
                        <form id="filters-form">
                            <div class="mb-3">
                                <label class="form-label">Cerca</label>
                                <input type="text" class="form-control" id="search" placeholder="Nome prodotto..." />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Categoria</label>
                                <select class="form-select" id="category">
                                    <option value="">Tutte</option>
                                    ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Prezzo (range)</label>
                                <div class="input-group">
                                    <input type="number" min="0" step="0.01" class="form-control" id="minPrice" placeholder="Min" />
                                    <input type="number" min="0" step="0.01" class="form-control" id="maxPrice" placeholder="Max" />
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Applica filtri</button>
                        </form>
                    </div>
                </div>
            </div>
            <div class="col-md-8">
                <div class="card h-100">
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
            </div>
        </div>
    `;

    // Eventi filtri
    const form = pageElement.querySelector('#filters-form');
    form.addEventListener('submit', e => {
        e.preventDefault();
        filter.search = form.search.value;
        filter.category = form.category.value;
        filter.minPrice = form.minPrice.value;
        filter.maxPrice = form.maxPrice.value;
        currentPage = 1;
        fetchProducts();
    });

    // Bottone azzera filtri
    pageElement.querySelector('#resetFiltersBtn').addEventListener('click', () => {
        resetFiltersAndRefresh();
    });

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
    const toggleFiltersMobile = pageElement.querySelector('#toggle-filters-mobile');
    if (toggleFiltersMobile) toggleFiltersMobile.onclick = () => {
        const filtersCard = pageElement.querySelector('#filters-card');
        filtersCard.classList.toggle('mobile-visible');
    };

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
