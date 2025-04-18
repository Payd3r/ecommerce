// Importo i componenti principali
import { router } from './router.js';
import { navbar } from './components/Navbar.js';
import { footer } from './components/Footer.js';
import { authService } from './services/authService.js';
import { toast } from './components/Toast.js';

// Importo le pagine
import { loadHomePage } from './pages/Home.js';
import { loadLoginPage } from './pages/Login.js';
import { loadRegisterPage } from './pages/Register.js';
import { loadProfilePage } from './pages/Profile.js';
import { loadNotFoundPage } from './pages/NotFound.js';

// Importo le pagine dell'artigiano
import { loadArtisanDashboardPage } from './pages/artisan/Dashboard.js';

// Importo le pagine dell'admin
import { loadAdminDashboardPage } from './pages/admin/Dashboard.js';

import { loadProductsPage } from './pages/Products.js';

// Classe principale dell'applicazione
class App {
    constructor() {
        // Verifica lo stato di autenticazione all'avvio
        this.checkAuthState();

        // Inizializza i componenti fissi
        this.initComponents();

        // Configura le route
        this.setupRoutes();

        // Inizializza il router
        router.init();
    }

    /**
     * Inizializza i componenti fissi (navbar, footer)
     */
    initComponents() {
        navbar.render();
        footer.render();

        // Gestisce l'evento di cambio di autenticazione
        document.addEventListener('auth:change', () => {
            navbar.render();
        });
    }

    /**
     * Verifica lo stato di autenticazione all'avvio e aggiorna il profilo
     */
    async checkAuthState() {
        if (authService.isAuthenticated()) {
            try {
                // Aggiorna i dati del profilo
                await authService.getProfile();

                // Notifica il cambio di autenticazione
                document.dispatchEvent(new CustomEvent('auth:change'));
            } catch (error) {
                // Se il token non è più valido, esegue il logout
                if (error.message.includes('autenticato') || error.message.includes('token')) {
                    authService.logout();
                    document.dispatchEvent(new CustomEvent('auth:change'));
                    toast.warning('La tua sessione è scaduta, effettua di nuovo il login');
                }
            }
        }
    }

    /**
     * Configura le route dell'applicazione
     */
    setupRoutes() {
        // Route pubbliche
        router.register('/', loadHomePage, { title: 'ArtigianatoShop - Home' });
        router.register('/login', loadLoginPage, { title: 'Accedi - ArtigianatoShop' });
        router.register('/register', loadRegisterPage, { title: 'Registrati - ArtigianatoShop' });
        router.register('/products', loadProductsPage, { title: 'Tutti i Prodotti - ArtigianatoShop' });

        // Route protette per utenti autenticati
        router.register('/profile', loadProfilePage, {
            requireAuth: true,
            title: 'Profilo - ArtigianatoShop'
        });

        // Route protette per artigiani
        router.register('/artisan/dashboard', loadArtisanDashboardPage, {
            requireAuth: true,
            roles: ['artisan'],
            title: 'Dashboard Artigiano - ArtigianatoShop'
        });

        // Route protette per admin
        router.register('/admin/dashboard', loadAdminDashboardPage, {
            requireAuth: true,
            roles: ['admin'],
            title: 'Dashboard Admin - ArtigianatoShop'
        });

        // Route 404 (non trovata)
        router.register('404', loadNotFoundPage, { title: 'Pagina non trovata - ArtigianatoShop' });
    }
}

// Avvia l'applicazione quando il DOM è completamente caricato
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
}); 