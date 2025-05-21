// Importo le dipendenze
import { authService } from '../services/authService.js';
import { router } from '../router.js';
import { searchProducts } from '../../api/products.js'; // Importa la nuova funzione

/**
 * Componente Navbar che gestisce la barra di navigazione
 */
class Navbar {
    constructor() {
        this.container = document.getElementById('navbar-container');
        this.searchTimeout = null; // Per il debounce della ricerca
        this.currentSearchTerm = ''; // Per tenere traccia del termine di ricerca attuale
    }

    /**
     * Renderizza la navbar nell'elemento container
     */
    render() {
        const isAuthenticated = authService.isAuthenticated();
        const user = authService.getUser();

        // Elemento NAV per la barra di navigazione effettiva
        const navbarEl = document.createElement('nav');
        navbarEl.className = 'navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3';
        navbarEl.innerHTML = `
            <div class="container">
                <!-- Riga Superiore Principale -->
                <div class="d-flex align-items-center w-100">
                    <!-- Brand (Titolo) -->
                    <a class="navbar-brand fw-bold mb-0" href="/" data-route>ArtigianatoShop</a>

                    <!-- Link Pagine (solo Desktop, allineati a sinistra dopo il brand) -->
                    <ul class="navbar-nav d-none d-lg-flex flex-row me-auto ms-lg-4">
                        <li class="nav-item"><a class="nav-link px-2" href="/" data-route>Home</a></li>
                        <li class="nav-item"><a class="nav-link px-2" href="/products" data-route>Prodotti</a></li>
                        <li class="nav-item"><a class="nav-link px-2" href="/categories" data-route>Categorie</a></li>
                        <li class="nav-item"><a class="nav-link px-2" href="/artisans" data-route>Artigiani</a></li>
                        <li class="nav-item"><a class="nav-link px-2" href="/issue/new" data-route>Aiuto</a></li>
                        ${isAuthenticated && user && user.role === 'admin' ? `<li class="nav-item"><a class="nav-link px-2" href="/admin/dashboard" data-route>Dashboard</a></li>` : ''}
                        ${isAuthenticated && user && user.role === 'artisan' ? `<li class="nav-item"><a class="nav-link px-2" href="/artisan/dashboard" data-route>Dashboard</a></li>` : ''}
                    </ul>

                    <!-- Azioni a Destra (Lente, Carrello Desktop, Profilo/Login Desktop, Azioni Mobile, Toggler) -->
                    <div class="d-flex align-items-center gap-2 ms-auto">
                        <!-- Icona di ricerca -->
                        <button class="btn p-0 d-flex align-items-center justify-content-center" id="navbar-search-icon" style="width:40px;height:40px; border-radius:8px;">
                            <span style="font-size:1.2rem;">🔍</span>
                        </button>

                        <!-- Carrello (solo Desktop, e solo se autenticato) -->
                        ${isAuthenticated ? `
                        <a href="/cart" class="btn position-relative p-0 d-none d-lg-flex align-items-center justify-content-center" id="navbar-cart-btn-desktop" style="width:40px;height:40px;" data-route>
                            <span style="font-size:1.6rem;">🛒</span>
                        </a>
                        ` : ''}

                        <!-- Profilo/Login (solo Desktop) -->
                        <div class="d-none d-lg-flex align-items-center" id="navbar-desktop-auth-actions">
                            ${isAuthenticated ? `
                                <div class="dropdown">
                                    <button class="btn btn-outline-primary d-flex align-items-center justify-content-center p-0 border-0 bg-transparent shadow-none" type="button" id="userDropdownDesktop" data-bs-toggle="dropdown" aria-expanded="false" style="height:44px;width:44px;outline:none;box-shadow:none;">
                                        ${user.image ? `
                                            <img src="${user.image}" alt="Foto profilo" style="width:44px; height:44px; object-fit:cover; border-radius:12px; border:1.5px solid #e0e0e0;" />
                                        ` : `
                                            <span class="d-flex align-items-center justify-content-center bg-light" style="width:44px; height:44px; border-radius:12px; border:1.5px solid #e0e0e0;"><i class="bi bi-person-circle fs-2 text-secondary"></i></span>
                                        `}
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdownDesktop">
                                        <li><a class="dropdown-item" href="/profile" data-route>Profilo</a></li>
                                        <li><a class="dropdown-item" href="/myorders" data-route>I miei ordini</a></li>
                                        <li><a class="dropdown-item" href="#" id="logout-btn-desktop">Esci</a></li>
                                    </ul>
                                </div>
                            ` : `
                                <a href="/login" class="btn btn-outline-primary me-2" data-route>Accedi</a>
                                <a href="/register" class="btn btn-primary" data-route>Registrati</a>
                            `}
                        </div>

                        <!-- Bottoni Login/Registrati solo icona su mobile -->
                        ${!isAuthenticated ? `
                        <div class="d-flex d-lg-none align-items-center gap-1 ms-1">
                            <a href="/login" class="btn btn-outline-primary d-flex align-items-center justify-content-center p-0" style="width:40px;height:40px;" data-route title="Accedi">
                                <i class="bi bi-person-circle fs-4"></i>
                            </a>
                            <a href="/register" class="btn btn-primary d-flex align-items-center justify-content-center p-0" style="width:40px;height:40px;" data-route title="Registrati">
                                <i class="bi bi-person-plus fs-4"></i>
                            </a>
                        </div>
                        ` : ''}

                        <!-- Carrello (solo Mobile, solo se autenticato) -->
                        ${isAuthenticated ? `
                        <a href="/cart" class="btn position-relative p-0 d-flex align-items-center justify-content-center d-lg-none" id="navbar-cart-btn-mobile" style="width:40px;height:40px;" data-route>
                            <span style="font-size:1.6rem;">🛒</span>
                        </a>
                        ` : ''}

                        <!-- Profilo (solo Mobile, se autenticato) -->
                        ${isAuthenticated ? `
                        <div class="d-lg-none position-relative" id="navbar-mobile-auth-actions">
                            <button class="btn btn-outline-primary d-flex align-items-center justify-content-center p-0 border-0 bg-transparent shadow-none" type="button" id="userDropdownMobile" aria-expanded="false" style="height:40px;width:40px;outline:none;box-shadow:none;">
                                ${user.image ? `
                                    <img src="${user.image}" alt="Foto profilo" style="width:40px; height:40px; object-fit:cover; border-radius:10px; border:1.5px solid #e0e0e0;" />
                                ` : `
                                    <span class="d-flex align-items-center justify-content-center bg-light" style="width:40px; height:40px; border-radius:10px; border:1.5px solid #e0e0e0;"><i class="bi bi-person-circle fs-2 text-secondary"></i></span>
                                `}
                            </button>
                            <div id="mobile-user-menu-overlay" style="display:none; position:fixed; top:50vh; left:0; width:100vw; height:50vh; background:rgba(0,0,0,0.25); z-index:1040;"></div>
                            <div id="mobile-user-menu" style="display:none; position:fixed; top:56px; left:0; width:100vw; background:#fff; z-index:1050; border-bottom-left-radius: 18px; border-bottom-right-radius: 18px;">
                                <div class="px-3 pt-3 pb-1">
                                    <a class="dropdown-item d-flex align-items-center gap-2" href="/" data-route><i class="bi bi-house-door"></i>Home</a>
                                    <a class="dropdown-item d-flex align-items-center gap-2" href="/products" data-route><i class="bi bi-box-seam"></i>Prodotti</a>
                                    <a class="dropdown-item d-flex align-items-center gap-2" href="/categories" data-route><i class="bi bi-tags"></i>Categorie</a>
                                    <a class="dropdown-item d-flex align-items-center gap-2" href="/artisans" data-route><i class="bi bi-people"></i>Artigiani</a>
                                    <a class="dropdown-item d-flex align-items-center gap-2" href="/issue/new" data-route><i class="bi bi-question-circle"></i>Aiuto</a>
                                    ${user.role === 'admin' ? `<a class="dropdown-item d-flex align-items-center gap-2" href="/admin/dashboard" data-route><i class='bi bi-speedometer2'></i>Dashboard</a>` : ''}
                                    ${user.role === 'artisan' ? `<a class="dropdown-item d-flex align-items-center gap-2" href="/artisan/dashboard" data-route><i class='bi bi-speedometer2'></i>Dashboard</a>` : ''}
                                </div>
                                <hr class="my-1">
                                <div class="px-3 pb-3 pt-1">
                                    <a class="dropdown-item d-flex align-items-center gap-2" href="/profile" data-route><i class="bi bi-person"></i>Profilo</a>
                                    <a class="dropdown-item d-flex align-items-center gap-2" href="/myorders" data-route><i class="bi bi-bag"></i>I miei ordini</a>
                                    <a class="dropdown-item d-flex align-items-center gap-2" href="#" id="logout-btn-mobile"><i class="bi bi-box-arrow-right"></i>Esci</a>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Contenuto Collassabile Mobile (Link pagine e Login/Register se non autenticato) -->
                ${!isAuthenticated ? `
                <div class="collapse navbar-collapse d-lg-none" id="mainNavbarMobileCollapse">
                    <ul class="navbar-nav mt-3 mb-lg-0 d-lg-none">
                        <li class="nav-item"><a class="nav-link" href="/" data-route>Home</a></li>
                        <li class="nav-item"><a class="nav-link" href="/products" data-route>Prodotti</a></li>
                        <li class="nav-item"><a class="nav-link" href="/categories" data-route>Categorie</a></li>
                        <li class="nav-item"><a class="nav-link" href="/artisans" data-route>Artigiani</a></li>
                        <li class="nav-item"><a class="nav-link" href="/issue/new" data-route>Aiuto</a></li>
                    </ul>
                    <!-- Login/Register buttons for mobile if not authenticated -->
                    <div class="mt-3 d-grid gap-2 d-lg-none">
                        <a href="/login" class="btn btn-outline-primary" data-route>Accedi</a>
                        <a href="/register" class="btn btn-primary" data-route>Registrati</a>
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        // Area di ricerca separata, sotto la navbar
        const searchAreaEl = document.createElement('div');
        searchAreaEl.id = 'search-area-below-navbar';
        searchAreaEl.className = 'container py-3'; // Container per centrare e dare padding
        searchAreaEl.style.display = 'none'; // Nascosta inizialmente
        searchAreaEl.innerHTML = `
            <div id="search-input-container" class="w-100 w-lg-75 mx-auto position-relative"> <!-- w-100 per mobile, w-lg-75 per desktop+, mx-auto per centrare -->
                <input type="text" class="form-control form-control-lg" id="navbar-search-input" placeholder="Cerca prodotti..."> <!-- form-control-lg per input più grande -->
                <div class="dropdown-menu w-100" id="search-results-dropdown" style="display:none; max-height: 250px; overflow-y: auto; position:absolute; top:100%; left:0; z-index:1055; border-top-left-radius: 0; border-top-right-radius: 0;"> <!-- Aumentato z-index a 1055 -->
                    <!-- I risultati verranno inseriti qui -->
                </div>
            </div>
        `;

        this.container.innerHTML = ''; // Pulisce il contenitore principale
        this.container.appendChild(navbarEl); // Aggiunge la navbar
        this.container.appendChild(searchAreaEl); // Aggiunge l'area di ricerca sotto la navbar

        // Ottieni riferimenti agli elementi DOPO che sono stati aggiunti al DOM
        const searchIcon = document.getElementById('navbar-search-icon'); // Nell'navbarEl
        const searchAreaContainer = document.getElementById('search-area-below-navbar'); // L'elemento che mostriamo/nascondiamo
        const searchInput = document.getElementById('navbar-search-input'); // Nell'searchAreaEl
        const searchResultsDropdown = document.getElementById('search-results-dropdown'); // Nell'searchAreaEl

        const closeSearch = () => {
            if (searchAreaContainer) searchAreaContainer.style.display = 'none';
            if (searchInput) searchInput.value = '';
            if (searchResultsDropdown) {
                searchResultsDropdown.style.display = 'none';
                searchResultsDropdown.innerHTML = '';
            }
        };

        if (searchIcon && searchAreaContainer && searchInput && searchResultsDropdown) {
            searchIcon.addEventListener('click', () => {
                const isSearchVisible = searchAreaContainer.style.display === 'block';
                if (isSearchVisible) {
                    closeSearch();
                } else {
                    searchAreaContainer.style.display = 'block';
                    searchInput.focus();
                }
            });

            searchInput.addEventListener('input', (event) => {
                const searchTerm = event.target.value.trim();
                clearTimeout(this.searchTimeout);
                if (searchTerm.length === 0) {
                    searchResultsDropdown.style.display = 'none';
                    searchResultsDropdown.innerHTML = '';
                    this.currentSearchTerm = '';
                    return;
                }
                if (searchTerm !== this.currentSearchTerm) {
                    this.searchTimeout = setTimeout(async () => {
                        this.currentSearchTerm = searchTerm;
                        await this.fetchAndShowSearchResults(searchTerm, closeSearch);
                    }, 1000);
                }
            });
        }
        
        if (isAuthenticated) {
            const logoutBtnDesktop = document.getElementById('logout-btn-desktop');
            if (logoutBtnDesktop) {
                logoutBtnDesktop.addEventListener('click', (e) => this.handleLogout(e, closeSearch));
            }
            const logoutBtnMobile = document.getElementById('logout-btn-mobile');
            if (logoutBtnMobile) {
                logoutBtnMobile.addEventListener('click', (e) => this.handleLogout(e, closeSearch));
            }
        }

        const allNavLinks = navbarEl.querySelectorAll('.nav-link[data-route], .dropdown-item[data-route]');
        allNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeSearch();
            });
        });

        // --- Mobile user menu full width logic ---
        if (isAuthenticated) {
            const userDropdownMobileBtn = document.getElementById('userDropdownMobile');
            const mobileUserMenu = document.getElementById('mobile-user-menu');
            const mobileUserMenuOverlay = document.getElementById('mobile-user-menu-overlay');
            const navbarEl = document.querySelector('.navbar');
            // Aggiungo il CSS per la navbar bianca e menu mobile senza ombra se non già presente
            if (!document.getElementById('navbar-mobile-menu-style')) {
                const style = document.createElement('style');
                style.id = 'navbar-mobile-menu-style';
                style.textContent = `
                    .navbar.navbar-mobile-menu-open {
                        background: #fff !important;
                        box-shadow: none !important;
                        border-bottom: 1px solid #e5e5e5 !important;
                    }
                    #mobile-user-menu {
                        box-shadow: none !important;
                        background: #fff !important;
                        border-top: 1px solid #e5e5e5 !important;
                    }
                    #mobile-user-menu .dropdown-item {
                        padding-top: 0.65rem !important;
                        padding-bottom: 0.65rem !important;
                        font-size: 1.08rem !important;
                        background: #fff !important;
                        color: #222 !important;
                    }
                    #mobile-user-menu .dropdown-item:active, #mobile-user-menu .dropdown-item:focus, #mobile-user-menu .dropdown-item:hover {
                        background: #f5f5f5 !important;
                        color: #111 !important;
                    }
                    body.menu-mobile-open {
                        background: #fff !important;
                    }
                `;
                document.head.appendChild(style);
            }
            let mobileMenuOpen = false;
            function closeMobileMenu() {
                if (mobileUserMenu) mobileUserMenu.style.display = 'none';
                if (mobileUserMenuOverlay) {
                    mobileUserMenuOverlay.style.display = 'none';
                    mobileUserMenuOverlay.style.top = '50vh';
                    mobileUserMenuOverlay.style.height = '50vh';
                    mobileUserMenuOverlay.style.background = 'rgba(0,0,0,0.25)';
                }
                if (navbarEl) navbarEl.classList.remove('navbar-mobile-menu-open');
                document.body.classList.remove('menu-mobile-open');
                mobileMenuOpen = false;
            }
            function openMobileMenu() {
                if (mobileUserMenu) mobileUserMenu.style.display = 'block';
                if (mobileUserMenuOverlay) {
                    mobileUserMenuOverlay.style.display = 'block';
                    mobileUserMenuOverlay.style.top = '50vh';
                    mobileUserMenuOverlay.style.height = '50vh';
                    mobileUserMenuOverlay.style.background = 'rgba(0,0,0,0.25)';
                }
                if (navbarEl) navbarEl.classList.add('navbar-mobile-menu-open');
                document.body.classList.add('menu-mobile-open');
                mobileMenuOpen = true;
            }
            if (userDropdownMobileBtn && mobileUserMenu && mobileUserMenuOverlay) {
                userDropdownMobileBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (mobileMenuOpen) {
                        closeMobileMenu();
                    } else {
                        openMobileMenu();
                    }
                });
                mobileUserMenuOverlay.addEventListener('click', closeMobileMenu);
                // Chiudi menu su resize desktop
                window.addEventListener('resize', () => {
                    if (window.innerWidth >= 992) closeMobileMenu();
                });
                // Chiudi menu su click su una voce
                mobileUserMenu.querySelectorAll('a[data-route], a[href="#"]').forEach(link => {
                    link.addEventListener('click', () => {
                        closeMobileMenu();
                    });
                });
            }
        }
    }

    /**
     * Gestisce il logout dell'utente
     * @param {Event} event - Evento click
     * @param {Function} closeSearchCallback - Callback per chiudere la ricerca
     */
    handleLogout(event, closeSearchCallback) {
        event.preventDefault();
        if (closeSearchCallback) closeSearchCallback();
        authService.logout();
        document.dispatchEvent(new CustomEvent('auth:change'));
        router.navigateToHome();
    }

    /**
     * Recupera i risultati della ricerca e li mostra nel dropdown
     * @param {string} searchTerm - Il termine da cercare
     * @param {Function} closeSearchCallback - Callback da chiamare quando un item viene cliccato
     */
    async fetchAndShowSearchResults(searchTerm, closeSearchCallback) {
        const searchResultsDropdown = document.getElementById('search-results-dropdown');
        if (!searchResultsDropdown) return;
        searchResultsDropdown.innerHTML = '<a class="dropdown-item text-muted" href="#">Caricamento...</a>';
        searchResultsDropdown.style.display = 'block';
        try {
            const { products } = await searchProducts(searchTerm, 5);
            if (products && products.length > 0) {
                searchResultsDropdown.innerHTML = '';
                products.forEach(product => {
                    const item = document.createElement('a');
                    item.className = 'dropdown-item d-flex align-items-center gap-2 p-2';
                    item.href = `/products/${product.id}`;
                    item.dataset.route = '';
                    const img = document.createElement('img');
                    img.src = product.image && product.image.url ? `${product.image.url}` : 'https://via.placeholder.com/40';
                    img.alt = product.name;
                    img.style.width = '40px';
                    img.style.height = '40px';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '4px';
                    const text = document.createElement('span');
                    text.textContent = product.name;
                    text.style.whiteSpace = 'normal';
                    item.appendChild(img);
                    item.appendChild(text);
                    item.addEventListener('click', (e) => {
                        if (closeSearchCallback) {
                            closeSearchCallback();
                        }
                    });
                    searchResultsDropdown.appendChild(item);
                });
            } else {
                searchResultsDropdown.innerHTML = '<a class="dropdown-item text-muted" href="#">Nessun prodotto trovato.</a>';
            }
        } catch (error) {
            console.error('Errore durante la ricerca dei prodotti:', error);
            searchResultsDropdown.innerHTML = '<a class="dropdown-item text-danger" href="#">Errore nella ricerca.</a>';
            searchResultsDropdown.style.display = 'block';
        }
    }
}

// Esporto un'istanza singola del componente Navbar
export const navbar = new Navbar();