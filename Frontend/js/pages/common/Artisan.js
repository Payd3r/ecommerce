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
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h1 class="h4 mb-0">Artigiani</h1>
                    <button id="toggle-filters" class="btn btn-outline-secondary d-md-none ms-2" type="button">
                        <i class="bi bi-funnel"></i> Filtri
                    </button>
                </div>
                <!-- Sidebar -->
                <aside class="col-12 col-md-3 mb-4 mb-md-0" id="filters-container" style="${window.innerWidth < 768 ? 'display:none;' : ''}">
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
                    <div id="artisans-list" class="row g-3"></div>
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
        list.innerHTML = artisans.map(artisan => {
            // Format approved_at
            let membroDa = '';
            if (artisan.approved_at) {
                const date = new Date(artisan.approved_at);
                const mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
                membroDa = `Membro da: ${date.getDate()} ${mesi[date.getMonth()]} ${date.getFullYear()}`;
            }
            return `
            <div class="col-12 col-md-6 col-lg-4 d-flex align-items-stretch">
                <div class="artisan-card card flex-fill shadow border-0 position-relative overflow-hidden my-2">
                    ${artisan.url_banner ?
                        `<div class='artisan-banner position-absolute top-0 start-0 w-100 h-100' style="background: url('http://localhost:3005${artisan.url_banner}') center/cover no-repeat; opacity: 0.22; z-index:1;"></div>`
                        : ''}
                    <div class="card-body text-center py-4 px-2 position-relative" style="z-index:2;">
                        <div class="artisan-profile-img mx-auto mb-2 position-relative d-flex justify-content-center align-items-center" style="width: 90px; height: 90px; border-radius: 50%; overflow: hidden; border: 4px solid #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.15); background: #f8f9fa;">
                            ${artisan.image ?
                                `<img src=\"http://localhost:3005${artisan.image}\" alt=\"${artisan.name}\" style=\"width:100%; height:100%; object-fit:cover; border-radius:50%;\" />` :
                                '<span class="display-3 text-primary"><i class="bi bi-person-badge"></i></span>'
                            }
                        </div>
                        <h5 class="fw-bold mb-1">${artisan.name}</h5>
                        <div class="text-muted small mb-2">${membroDa}</div>
                        ${artisan.bio ? `<div class="artisan-bio small mb-2 text-secondary fst-italic">${artisan.bio}</div>` : ''}
                        <a href="/artisan-shop/${artisan.id}" class="btn btn-outline-primary mt-2 px-4 rounded-pill shadow-sm artisan-shop-btn" data-id="${artisan.id}" data-route>Vai allo shop</a>
                    </div>
                </div>
            </div>
            `;
        }).join('');
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
        // Stili custom per le card artigiano
        let styleElement = document.getElementById('artisan-list-card-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'artisan-list-card-styles';
            document.head.appendChild(styleElement);
        }
        styleElement.textContent = `
            .artisan-card {
                min-height: 340px;
                border-radius: 1.2rem;
                box-shadow: 0 2px 10px rgba(0,0,0,0.10);
                transition: transform 0.2s, box-shadow 0.2s;
                background: #fff;
            }
            .artisan-card:hover {
                transform: translateY(-7px) scale(1.03);
                box-shadow: 0 4px 16px rgba(0,0,0,0.13);
            }
            .artisan-banner {
                border-radius: 1.2rem;
                pointer-events: none;
            }
            .artisan-profile-img {
                box-shadow: 0 2px 10px rgba(0,0,0,0.18);
                background: #fff;
            }
            .artisan-bio {
                min-height: 1.5em;
                max-height: 3em;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }
            /* Stile per la card filtri */
            #filters-container .card {
                border-radius: 1.2rem !important;
                box-shadow: 0 2px 10px rgba(0,0,0,0.10) !important;
                background: #f8f9fa !important;
                padding: 2rem 1.5rem !important;
                border: none !important;
            }
            #filters-container .form-control {
                border-radius: 0.8rem;
                font-size: 1.08rem;
                padding: 0.7rem 1rem;
            }
            #filters-container .btn-primary {
                border-radius: 1.2rem;
                font-weight: 500;
                padding: 0.6rem 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.07);
            }
        `;
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
                // Nascondi i filtri su mobile
                const filtersContainer = document.getElementById('filters-container');
                if (window.innerWidth < 768 && filtersContainer) {
                    filtersContainer.style.display = 'none';
                }
            });
        }
        // Toggle filtri mobile
        const toggleFiltersButton = pageElement.querySelector('#toggle-filters');
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
