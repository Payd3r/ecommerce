// Importo le dipendenze
import { authService } from '../services/authService.js';
import { router } from '../router.js';

/**
 * Componente Navbar che gestisce la barra di navigazione
 */
class Navbar {
    constructor() {
        this.container = document.getElementById('navbar-container');
        
        // Listener per aggiornare i menu quando lo stato di autenticazione cambia
        document.addEventListener('auth:change', this.render.bind(this));
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
                <a class="navbar-brand fw-bold" href="/" data-route>ArtigianatoShop</a>
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
                        ${isAuthenticated && user && user.role === 'client' ? `
                            <a href="/cart" class="btn btn-outline-secondary position-relative me-2" data-route>
                                🛒 <span class="cart-count position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="cart-count">0</span>
                            </a>
                        ` : ''}
                        ${isAuthenticated ? `
                            <div class="dropdown">
                                <button class="btn btn-outline-primary dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                    ${user.name}
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