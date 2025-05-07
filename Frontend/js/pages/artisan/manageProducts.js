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
            renderPagination(res.pagination);
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
        // Prendi SEMPRE il riferimento attuale dal DOM
        const tableBody = document.querySelector('#products-table-body');
        if (!tableBody) {
            console.error('Non trovo #products-table-body nel DOM!');
            return;
        }
        tableBody.innerHTML = filteredProducts.length === 0 ?
            `<tr><td colspan="7" class="text-center">Nessun prodotto trovato</td></tr>` :
            filteredProducts.map(p => `
                <tr data-product-id="${p.id}">
                    <td class="text-center">
                        ${p.image && p.image.url ?
                    `<div class="product-thumb-wrapper" style="position:relative; display:inline-block;">
                                <img src="http://localhost:3005${p.image.url}" alt="img" class="product-thumb-img" style="width:40px; height:40px; object-fit:cover; border-radius:6px; cursor:pointer;" />
                                <div class="product-tooltip-img" style="display:none; position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); z-index:10;">
                                    <img src="http://localhost:3005${p.image.url}" alt="img" style="width:220px; height:220px; object-fit:cover; border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.18); border:2px solid #fff;" />
                                </div>
                            </div>`
                    :
                    '<div style="width:40px; height:40px; background:#f3f3f3; border-radius:6px; display:flex; align-items:center; justify-content:center; color:#bbb; font-size:1.2rem;">🖼️</div>'
                }
                    </td>
                    <td class="text-center">${p.name}</td>
                    <td class="text-center">${p.category_name || '-'}</td>
                    <td class="text-center">${p.price} €</td>
                    <td class="text-center">${p.stock > 0 ? 'Disponibile' : 'Non disponibile'}</td>
                    <td class="text-center">${p.created_at ? p.created_at.split('T')[0] : '-'}</td>
                    <td class="text-center">
                        <div class="d-flex justify-content-center gap-2">
                            <button class="btn btn-link btn-view-product p-0" title="Visualizza"><i class="bi bi-eye fs-5"></i></button>
                            <button class="btn btn-link btn-edit-product p-0" title="Modifica"><i class="bi bi-pencil fs-5 text-primary"></i></button>
                            <button class="btn btn-link btn-delete-product p-0 text-danger" title="Elimina"><i class="bi bi-trash fs-5"></i></button>
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
    }

    // Funzione per renderizzare la paginazione
    function renderPagination(pagination) {
        const totalPages = pagination.totalPages || 1;
        const current = pagination.currentPage || 1;
        const paginationEl = pageElement.querySelector('#products-pagination');
        paginationEl.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            paginationEl.innerHTML += `<li class="page-item${i === current ? ' active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }
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
        <div class="row mb-4 align-items-center">
            <div class="col-6 d-flex align-items-center">
                <button class="btn btn-outline-secondary" id="back-btn"><i class="bi bi-arrow-left"></i> Torna indietro</button>
            </div>
            <div class="col-6 d-flex justify-content-end">
                <a href="#" id="addProductBtn" class="btn btn-success">Aggiungi prodotto</a>
            </div>
        </div>
        <div class="row g-4">
            <div class="col-md-4">
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
                                    <th class="text-center">Img</th>
                                    <th class="text-center">Nome</th>
                                    <th class="text-center">Categoria</th>
                                    <th class="text-center">Prezzo</th>
                                    <th class="text-center">Stato</th>
                                    <th class="text-center">Creato il</th>
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
