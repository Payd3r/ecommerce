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
        
        // Crea la struttura base della navbar
        const navbar = document.createElement('div');
        navbar.className = 'navbar container';
        
        // Logo
        const logoDiv = document.createElement('div');
        logoDiv.className = 'navbar-logo';
        logoDiv.innerHTML = `
            <a href="/">ArtigianatoShop</a>
        `;
        
        // Menu principale
        const menu = document.createElement('nav');
        menu.className = 'navbar-menu';
        
        const menuItems = document.createElement('ul');
        menuItems.id = 'main-menu';
        
        // Menu sempre visibile
        menuItems.innerHTML = `
            <li><a href="/" data-route>Home</a></li>
            <li><a href="/products" data-route>Prodotti</a></li>
            <li><a href="/categories" data-route>Categorie</a></li>
            <li><a href="/artisans" data-route>Artigiani</a></li>
        `;
        
        // Aggiunge voci di menu specifiche per i diversi ruoli
        if (isAuthenticated && user) {
            if (user.role === 'admin') {
                menuItems.innerHTML += `
                    <li><a href="/admin/dashboard" data-route>Dashboard</a></li>
                `;
            } else if (user.role === 'artisan') {
                menuItems.innerHTML += `
                    <li><a href="/artisan/dashboard" data-route>Dashboard</a></li>
                `;
            }
        }
        
        menu.appendChild(menuItems);
        
        // Menu hamburger per mobile
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger-menu';
        hamburger.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        hamburger.addEventListener('click', this.toggleMobileMenu);
        menu.appendChild(hamburger);
        
        // Menu utente (login/register o profilo/logout)
        const userMenu = document.createElement('div');
        userMenu.className = 'user-menu';
        
        if (isAuthenticated) {
            // Carrello (solo per i clienti)
            if (user.role === 'client') {
                userMenu.innerHTML = `
                    <a href="/cart" class="cart-icon" data-route>
                        🛒 <span class="cart-count" id="cart-count">0</span>
                    </a>
                `;
            }
            
            // Dropdown menu utente
            userMenu.innerHTML += `
                <div class="dropdown">
                    <button class="btn dropdown-toggle">
                        ${user.name} <span class="arrow-down">▼</span>
                    </button>
                    <div class="dropdown-menu">
                        <a href="/profile" data-route>Profilo</a>
                        <a href="#" id="logout-btn">Esci</a>
                    </div>
                </div>
            `;
        } else {
            userMenu.innerHTML = `
                <a href="/login" class="btn" data-route>Accedi</a>
                <a href="/register" class="btn" data-route>Registrati</a>
            `;
        }
        
        // Assembla la navbar
        navbar.appendChild(logoDiv);
        navbar.appendChild(menu);
        navbar.appendChild(userMenu);
        
        // Pulisce e aggiunge la navbar al container
        this.container.innerHTML = '';
        this.container.appendChild(navbar);
        
        // Aggiunge i listener per il logout
        if (isAuthenticated) {
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', this.handleLogout.bind(this));
            }
            
            // Aggiunge i listener per il menu dropdown
            const dropdownToggle = document.querySelector('.dropdown-toggle');
            if (dropdownToggle) {
                dropdownToggle.addEventListener('click', this.toggleDropdown);
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
    
    /**
     * Mostra/nasconde il menu mobile
     */
    toggleMobileMenu() {
        const menu = document.getElementById('main-menu');
        const hamburger = document.querySelector('.hamburger-menu');
        
        menu.classList.toggle('show');
        hamburger.classList.toggle('active');
    }
    
    /**
     * Mostra/nasconde il menu dropdown
     * @param {Event} event - Evento click
     */
    toggleDropdown(event) {
        event.preventDefault();
        
        const dropdown = event.currentTarget.nextElementSibling;
        dropdown.classList.toggle('show');
        
        // Chiude il dropdown quando si clicca fuori
        const closeDropdown = (e) => {
            if (!e.target.matches('.dropdown-toggle') && 
                !e.target.closest('.dropdown-menu')) {
                dropdown.classList.remove('show');
                document.removeEventListener('click', closeDropdown);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeDropdown);
        }, 0);
    }
}

// Esporto un'istanza singola del componente Navbar
export const navbar = new Navbar(); 