// Importo le dipendenze
import { authService } from '../services/authService.js';
import { router } from '../router.js';

/**
 * Componente Navbar che gestisce la barra di navigazione
 */
class Navbar {
    constructor() {
        this.container = document.getElementById('navbar-container');
    }
    
    /**
     * Renderizza la navbar nell'elemento container
     */
    render() {
        // Verifica se l'utente è autenticato
        const isAuthenticated = authService.isAuthenticated();
        const user = authService.getUser();
        
        // Crea la struttura base della navbar con Bootstrap
        const navbar = document.createElement('nav');
        navbar.className = 'navbar navbar-expand-lg navbar-light bg-white shadow-sm';
        
        navbar.innerHTML = `
            <div class="container">
                <div class="d-flex align-items-center gap-2">
                    <a class="navbar-brand fw-bold mb-0" href="/" data-route>ArtigianatoShop</a>
                </div>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar" aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="mainNavbar">
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                        <li class="nav-item"><a class="nav-link" href="/" data-route>Home</a></li>
                        <li class="nav-item"><a class="nav-link" href="/products" data-route>Prodotti</a></li>
                        <li class="nav-item"><a class="nav-link" href="/categories" data-route>Categorie</a></li>
                        <li class="nav-item"><a class="nav-link" href="/artisans" data-route>Artigiani</a></li>
                        ${isAuthenticated && user && user.role === 'admin' ? `<li class="nav-item"><a class="nav-link" href="/admin/dashboard" data-route>Dashboard</a></li>` : ''}
                        ${isAuthenticated && user && user.role === 'artisan' ? `<li class="nav-item"><a class="nav-link" href="/artisan/dashboard" data-route>Dashboard</a></li>` : ''}
                    </ul>
                    <div class="d-flex align-items-center gap-2">
                        <a href="/cart" class="btn position-relative me-2 p-0 d-flex align-items-center justify-content-center" id="navbar-cart-btn" style="width:44px;height:44px; margin-top:8px; background:transparent; box-shadow:none; border:none;" data-route>
                            <span style="font-size:1.6rem;">🛒</span>
                        </a>                    
                        ${isAuthenticated ? `
                            <div class="dropdown">
                                <button class="btn btn-outline-primary d-flex align-items-center justify-content-center p-0 border-0 bg-transparent shadow-none" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false" style="height:48px;width:48px;margin-top:8px;outline:none;box-shadow:none;">
                                    ${user.image ? `
                                        <img src="http://localhost:3005${user.image}" alt="Foto profilo" style="width:48px; height:48px; object-fit:cover; border-radius:12px; border:1.5px solid #e0e0e0;" />
                                    ` : `
                                        <span class="d-flex align-items-center justify-content-center bg-light" style="width:48px; height:48px; border-radius:12px; border:1.5px solid #e0e0e0;"><i class="bi bi-person-circle fs-2 text-secondary"></i></span>
                                    `}
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                                    <li><a class="dropdown-item" href="/profile" data-route>Profilo</a></li>
                                    <li><a class="dropdown-item" href="#" id="logout-btn">Esci</a></li>
                                </ul>
                            </div>
                        ` : `
                            <a href="/login" class="btn btn-outline-primary" data-route>Accedi</a>
                            <a href="/register" class="btn btn-primary" data-route>Registrati</a>
                        `}
                    </div>
                </div>
            </div>
        `;
        
        // Pulisce e aggiunge la navbar al container
        this.container.innerHTML = '';
        this.container.appendChild(navbar);
        
        // Aggiunge i listener per il logout
        if (isAuthenticated) {
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', this.handleLogout.bind(this));
            }
        }
    }

    /**
     * Gestisce il logout dell'utente
     * @param {Event} event - Evento click
     */
    handleLogout(event) {
        event.preventDefault();
        
        // Esegue il logout
        authService.logout();
        
        // Dispatch evento di cambio autenticazione
        document.dispatchEvent(new CustomEvent('auth:change'));
        
        // Reindirizza alla home
        router.navigateToHome();
    }
}

// Esporto un'istanza singola del componente Navbar
export const navbar = new Navbar();