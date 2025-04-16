import { NavbarManager } from './navbar.js';

export class Router {
    constructor() {
        this.mainContent = document.getElementById('mainContent');
        if (!this.mainContent) {
            console.error('Elemento mainContent non trovato!');
            throw new Error('Elemento mainContent non trovato!');
        }
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    async handleRoute() {
        const hash = window.location.hash || '#/';
        const path = hash.slice(1);
        console.log('Gestione della rotta:', path);
        
        // Controlla se l'utente è autenticato
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('role');
        console.log('Stato autenticazione:', { token: !!token, userRole });

        // Se l'utente non è autenticato e non sta cercando di autenticarsi, reindirizza all'auth
        if (!token && path !== '/auth') {
            console.log('Utente non autenticato, reindirizzamento a /auth');
            window.location.hash = '/auth';
            return;
        }

        // Se l'utente è autenticato e sta cercando di accedere alla pagina di auth
        if (token && path === '/auth') {
            console.log('Utente già autenticato, reindirizzamento alla home del ruolo');
            switch (userRole) {
                case 'Client':
                    window.location.href = '/Frontend/html/Client/index.html';
                    break;
                case 'Artisan':
                    window.location.href = '/Frontend/html/Artisan/index.html';
                    break;
                case 'Admin':
                    window.location.href = '/Frontend/html/Admin/index.html';
                    break;
                default:
                    window.location.hash = '/auth';
            }
            return;
        }

        // Gestisce la route di autenticazione
        if (path === '/auth') {
            await this.loadAuth();
            return;
        }

        // Se siamo qui, qualcosa è andato storto
        this.handle404();
    }

    async loadAuth() {
        try {
            console.log('Caricamento pagina di autenticazione...');
            const response = await fetch('/Frontend/html/components/authenticate.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            this.mainContent.innerHTML = html;

            // Importa e inizializza i form di autenticazione
            const { initializeAuthForms } = await import('./auth.js');
            initializeAuthForms();
            console.log('Pagina di autenticazione caricata con successo');
        } catch (error) {
            console.error('Errore nel caricamento della pagina di autenticazione:', error);
            this.mainContent.innerHTML = `
                <div class="alert alert-danger">
                    <h4>Errore nel caricamento della pagina di autenticazione</h4>
                    <p>${error.message}</p>
                </div>`;
        }
    }

    handle404() {
        this.mainContent.innerHTML = '<h2>404 - Pagina non trovata</h2>';
    }
} 