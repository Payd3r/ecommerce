// Importo le dipendenze
import { authService } from './services/authService.js';
import { showBootstrapToast } from './components/Toast.js';
import { loader } from './components/Loader.js';
// Importo la pagina prodotti

/**
 * Router dell'applicazione con gestione delle route protette
 */
class Router {
    constructor() {
        // Container principale per il contenuto
        this.container = document.getElementById('app-container');
        
        // Memorizza le rotte registrate
        this.routes = {};
        
        // Rotta corrente
        this.currentRoute = null;
        
        // Gestisce il comportamento di back/forward del browser
        window.addEventListener('popstate', this.handlePopState.bind(this));
    }
    
    /**
     * Inizializza il router
     */
    init() {
        // Gestisce la rotta iniziale basata sull'URL
        this.navigate(window.location.pathname, false);
        
        // Intercetta i click sui link per gestirli con il router
        document.addEventListener('click', this.handleLinkClick.bind(this));
    }
    
    /**
     * Registra una nuova rotta
     * @param {string} path - Percorso della rotta
     * @param {Function} component - Funzione che renderizza il componente
     * @param {Object} options - Opzioni della rotta
     */
    register(path, component, options = {}) {
        const defaultOptions = {
            requireAuth: false,
            roles: [],
            title: 'ArtigianatoShop'
        };
        
        this.routes[path] = {
            component,
            options: { ...defaultOptions, ...options }
        };
    }
    
    /**
     * Gestisce la navigazione
     * @param {string} path - Percorso della nuova rotta
     * @param {boolean} pushState - Se true, aggiunge la rotta alla history
     */
    async navigate(path, pushState = true) {
        path = path || '/';
        if (path !== '/' && path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        // Separa path e query string
        let routePath = path;
        let queryString = '';
        if (path.includes('?')) {
            [routePath, queryString] = path.split('?');
        }

        // Cerca la rotta registrata (anche dinamica)
        let route = this.routes[routePath];
        let params = {};
        if (!route) {
            // Cerca una route dinamica che combaci
            for (const routePathPattern in this.routes) {
                if (routePathPattern.includes(':')) {
                    const paramNames = [];
                    const regexPath = routePathPattern.replace(/:([^/]+)/g, (_, key) => {
                        paramNames.push(key);
                        return '([^/]+)';
                    });
                    const match = routePath.match(new RegExp('^' + regexPath + '$'));
                    if (match) {
                        route = this.routes[routePathPattern];
                        paramNames.forEach((name, i) => {
                            params[name] = match[i + 1];
                        });
                        break;
                    }
                }
            }
        }
        if (!route) route = this.routes['404'];

        // Aggiungi i parametri della query string a params
        if (queryString) {
            const searchParams = new URLSearchParams(queryString);
            for (const [key, value] of searchParams.entries()) {
                params[key] = value;
            }
        }

        // Se la rotta richiede autenticazione e l'utente non è autenticato, redirige al login
        if (route.options.requireAuth && !authService.isAuthenticated()) {
            showBootstrapToast('Devi effettuare l\'accesso per visualizzare questa pagina', 'Attenzione', 'warning');
            this.navigateToLogin(path);
            return;
        }
        
        // Se la rotta ha restrizioni di ruolo, verifica che l'utente abbia il ruolo necessario
        if (route.options.roles.length > 0 && !authService.hasRole(route.options.roles)) {
            showBootstrapToast('Non hai i permessi per accedere a questa pagina', 'Errore', 'error');
            this.navigateToHome();
            return;
        }
        
        // Se una rotta era già attiva, ne chiama il metodo di smontaggio
        if (this.currentRoute && typeof this.currentRoute.unmount === 'function') {
            this.currentRoute.unmount();
        }
        
        try {
            // Mostra il loader durante il caricamento
            loader.show();
            
            // Istanzia il componente della rotta
            const component = route.component;
            this.currentRoute = await component(params);
            
            // Aggiorna il titolo della pagina
            document.title = route.options.title;
            
            // Aggiorna l'URL nel browser
            if (pushState) {
                window.history.pushState({ path }, '', path);
            }
            
            // Pulisce il container e renderizza il nuovo componente
            this.container.innerHTML = '';
            this.container.appendChild(this.currentRoute.render());
            
            // Chiama il metodo mount del componente dopo il rendering
            if (typeof this.currentRoute.mount === 'function') {
                this.currentRoute.mount();
            }
            
            // Scorre in alto nella pagina
            window.scrollTo(0, 0);
        } catch (error) {
            console.error('Errore durante la navigazione:', error);
            showBootstrapToast('Si è verificato un errore durante il caricamento della pagina', 'Errore', 'error');
        } finally {
            // Nasconde il loader
            loader.hide();
        }
    }
    
    /**
     * Gestisce il click su un link
     * @param {Event} event - Evento click
     */
    handleLinkClick(event) {
        const link = event.target.closest('a');
        
        if (link && link.getAttribute('href') && !link.getAttribute('target') && 
            link.origin === window.location.origin) {
            event.preventDefault();
            this.navigate(link.pathname);
        }
    }
    
    /**
     * Gestisce lo stato di navigazione del browser (back/forward)
     * @param {Event} event - Evento popstate
     */
    handlePopState(event) {
        const path = event.state?.path || window.location.pathname;
        this.navigate(path, false);
    }
    
    /**
     * Reindirizza alla home page
     */
    navigateToHome() {
        this.navigate('/');
    }
    
    /**
     * Reindirizza alla pagina di login
     * @param {string} redirectTo - Pagina a cui redirigere dopo il login
     */
    navigateToLogin(redirectTo = '') {
        const loginPath = '/login' + (redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : '');
        this.navigate(loginPath);
    }
    
    /**
     * Reindirizza alla dashboard appropriata in base al ruolo dell'utente
     */
    navigateToDashboard() {
        const user = authService.getUser();
        
        if (!user) {
            this.navigateToHome();
            return;
        }
        
        switch (user.role) {
            case 'admin':
                this.navigate('/admin/dashboard');
                break;
            case 'artisan':
                this.navigate('/artisan/dashboard');
                break;
            case 'client':
                this.navigate('/');
                break;
            default:
                this.navigateToHome();
        }
    }
}

// Esporto un'istanza singola del router
export const router = new Router();