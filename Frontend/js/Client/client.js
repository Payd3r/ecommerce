import { NavbarManager } from '../navbar.js';
import { ProductsManager } from './products.js';

class ClientRouter {
    constructor() {
        this.mainContent = document.getElementById('mainContent');
        if (!this.mainContent) {
            throw new Error('Elemento mainContent non trovato!');
        }
        this.routes = {
            '/': () => this.loadProducts(), // Default route
            '/products': () => this.loadProducts(),
            '/cart': () => this.loadCart(),
            '/orders': () => this.loadOrders()
        };
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    async handleRoute() {
        const hash = window.location.hash || '#/';
        const path = hash.slice(1);
        console.log('Client route:', path);

        const handler = this.routes[path] || this.routes['/'];
        await handler();
    }

    async loadComponent(path) {
        try {
            const response = await fetch(`/Frontend/html/Client/pages/${path}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            this.mainContent.innerHTML = html;
        } catch (error) {
            console.error('Errore nel caricamento del componente:', error);
            this.mainContent.innerHTML = `
                <div class="alert alert-danger">
                    <h4>Errore nel caricamento del contenuto</h4>
                    <p>${error.message}</p>
                </div>`;
        }
    }

    async loadProducts() {
        try {
            await this.loadComponent('products.html');
            // Inizializza il gestore dei prodotti
            const productsManager = new ProductsManager('mainContent');
            await productsManager.init();
            console.log('ProductsManager inizializzato con successo');
        } catch (error) {
            console.error('Errore durante il caricamento dei prodotti:', error);
        }
    }

    async loadCart() {
        await this.loadComponent('cart.html');
    }

    async loadOrders() {
        await this.loadComponent('orders.html');
    }
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', async () => {
    // Verifica autenticazione
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token || userRole !== 'client') {
        window.location.href = '/Frontend/index.html#/auth';
        return;
    }

    // Inizializza navbar
    const navbarManager = new NavbarManager();
    await navbarManager.loadNavbar();

    // Inizializza router
    const router = new ClientRouter();
    router.init();
}); 