import UsersAPI from '../../../api/users.js';
import { loader } from '../../components/Loader.js';
import { showBootstrapToast } from '../../components/Toast.js';
import { router } from '../../router.js';

/**
 * Carica la pagina degli artigiani con sidebar filtri
 */
export async function loadArtisanPage() {
    const pageElement = document.createElement('div');
    pageElement.className = 'artisan-page';

    // Stato locale
    let state = {
        artisans: [],
        page: 1,
        limit: 12,
        total: 0,
        search: ''
    };

    // HTML struttura
    pageElement.innerHTML = `
        <div class="container py-4">
            <div class="row">
                <!-- Sidebar -->
                <aside class="col-12 col-md-3 mb-4 mb-md-0">
                    <div class="card shadow-sm border-0 p-3">
                        <h2 class="h5 mb-3">Filtra Artigiani</h2>
                        <form id="artisan-filter-form">
                            <div class="mb-3">
                                <label for="search-artisan" class="form-label">Cerca per nome</label>
                                <input type="text" id="search-artisan" name="search" class="form-control" placeholder="Nome artigiano...">
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Cerca</button>
                        </form>
                    </div>
                </aside>
                <!-- Lista Artigiani -->
                <section class="col-12 col-md-9">
                    <div id="artisans-list" class="row g-4"></div>
                    <nav class="mt-4 d-flex justify-content-center">
                        <ul class="pagination" id="artisans-pagination"></ul>
                    </nav>
                </section>
            </div>
        </div>
    `;

    // Funzione per renderizzare le card degli artigiani
    function renderArtisans(artisans) {
        const list = pageElement.querySelector('#artisans-list');
        if (!artisans.length) {
            list.innerHTML = '<div class="col-12 text-center text-muted">Nessun artigiano trovato.</div>';
            return;
        }
        list.innerHTML = artisans.map(artisan => `
            <div class="col-12 col-sm-6 col-lg-4">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-body d-flex flex-column align-items-center justify-content-center">
                        <div class="mb-3">
                            <div class="d-flex justify-content-center align-items-center" style="background-color: var(--secondary-color); width: 100px; height: 100px; border-radius: 50%; overflow: hidden;">
                                ${artisan.image ?
                                    `<img src=\"http://localhost:3005${artisan.image}\" alt=\"${artisan.name}\" style=\"width:100px; height:100px; object-fit:cover;\" />` :
                                    '<span class="display-3 text-primary"><i class="bi bi-person-badge"></i></span>'
                                }
                            </div>
                        </div>
                        <h5 class="card-title mb-1">${artisan.name}</h5>
                        <p class="card-text mb-1 small text-muted">ID: ${artisan.id}</p>
                        <span class="badge bg-secondary">Artigiano</span>
                        <button class="btn btn-outline-primary w-100 mt-3 artisan-shop-btn" data-id="${artisan.id}">Vai allo shop</button>
                    </div>
                </div>
            </div>
        `).join('');
        // Aggiungi spazio extra se ci sono pochi artigiani
        if (artisans.length < 4) {
            list.innerHTML += '<div class="col-12" style="height: 25vh;"></div>';
        }
        // Aggiungi event listener ai bottoni
        list.querySelectorAll('.artisan-shop-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                router.navigate(`/artisan-shop/${id}`);
            });
        });
    }

    // Funzione per renderizzare la paginazione
    function renderPagination(pagination) {
        const paginationEl = pageElement.querySelector('#artisans-pagination');
        if (!pagination || pagination.totalPages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }
        let html = '';
        for (let i = 1; i <= pagination.totalPages; i++) {
            html += `<li class="page-item${i === pagination.currentPage ? ' active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }
        paginationEl.innerHTML = html;
    }

    // Carica gli artigiani dal server
    async function loadArtisans() {
        loader.show();
        try {
            const params = { page: state.page, limit: state.limit };
            if (state.search) params.search = state.search;
            const data = await UsersAPI.getArtisans(params);
            // console.log("dati artigiani", data);
            state.artisans = data.data || [];
            state.total = data.pagination ? data.pagination.total : state.artisans.length;
            state.page = data.pagination ? data.pagination.currentPage : 1;
            state.limit = data.pagination ? data.pagination.limit : 12;
            renderArtisans(state.artisans);
            renderPagination(data.pagination);
        } catch (error) {
            showBootstrapToast('Errore nel caricamento degli artigiani', 'Errore', 'error');
        } finally {
            loader.hide();
        }
    }

    // Gestione filtri
    function mount() {
        const filterForm = pageElement.querySelector('#artisan-filter-form');
        const searchInput = pageElement.querySelector('#search-artisan');
        if (filterForm) {
            filterForm.addEventListener('submit', e => {
                e.preventDefault();
                state.search = searchInput.value.trim();
                state.page = 1;
                loadArtisans();
            });
        }
        // Paginazione
        const pagination = pageElement.querySelector('#artisans-pagination');
        pagination.addEventListener('click', e => {
            if (e.target.tagName === 'A') {
                e.preventDefault();
                const newPage = parseInt(e.target.dataset.page);
                if (!isNaN(newPage) && newPage !== state.page) {
                    state.page = newPage;
                    loadArtisans();
                }
            }
        });
    }

    // Carica la prima pagina
    await loadArtisans();

    return {
        render: () => pageElement,
        mount
    };
}
