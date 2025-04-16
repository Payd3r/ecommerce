// Classe per gestire la navbar
export class NavbarManager {
    constructor() {
        this.navbarContainer = document.getElementById('navbarContainer');
    }

    async loadNavbar() {
        try {
            const response = await fetch('/Frontend/html/components/navbar.html');
            const html = await response.text();
            this.navbarContainer.innerHTML = html;
            
            // Aggiungi event listener per il logout dopo che la navbar è stata caricata
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                // Rimuovi eventuali listener precedenti
                logoutBtn.replaceWith(logoutBtn.cloneNode(true));
                const newLogoutBtn = document.getElementById('logoutBtn');
                // Aggiungi il nuovo listener
                newLogoutBtn.addEventListener('click', () => this.handleLogout());
            }
            
            // Aggiorna la UI in base allo stato di autenticazione
            const token = localStorage.getItem('token');
            if (token) {
                this.updateUIForLoggedInUser();
            } else {
                this.updateUIForLoggedOutUser();
            }
        } catch (error) {
            console.error('Errore nel caricamento della navbar:', error);
        }
    }

    updateUIForLoggedInUser() {
        const userRole = localStorage.getItem('role');
        const userName = localStorage.getItem('userName') || 'Utente';

        // Gestione elementi comuni
        const loginNavItem = document.getElementById('loginNavItem');
        const logoutNavItem = document.getElementById('logoutNavItem');
        const userInfo = document.getElementById('userInfo');
        
        if (loginNavItem) loginNavItem.style.display = 'none';
        if (logoutNavItem) logoutNavItem.style.display = 'block';
        if (userInfo) {
            userInfo.style.display = 'block';
            document.getElementById('userName').textContent = userName;
        }

        // Nascondi tutti i menu
        this.hideAllMenus();

        // Mostra il menu appropriato in base al ruolo
        const menuMap = {
            'client': 'clientMenu',
            'artisan': 'artisanMenu',
            'admin': 'adminMenu'
        };

        const menuToShow = document.getElementById(menuMap[userRole]);
        if (menuToShow) menuToShow.style.display = 'flex';
    }

    updateUIForLoggedOutUser() {
        const loginNavItem = document.getElementById('loginNavItem');
        const logoutNavItem = document.getElementById('logoutNavItem');
        const userInfo = document.getElementById('userInfo');
        
        // Nascondi tutti i menu
        this.hideAllMenus();

        // Mostra/nascondi elementi di autenticazione
        if (loginNavItem) loginNavItem.style.display = 'none';
        if (logoutNavItem) logoutNavItem.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
    }

    hideAllMenus() {
        const allMenus = ['clientMenu', 'artisanMenu', 'adminMenu'];
        allMenus.forEach(menuId => {
            const menu = document.getElementById(menuId);
            if (menu) menu.style.display = 'none';
        });
    }

    handleLogout() {
        try {
            // Rimuovi tutti i dati di autenticazione dal localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('userName');

            // Aggiorna la UI per utente non loggato
            this.updateUIForLoggedOutUser();

            // Reindirizza alla pagina di autenticazione usando il router
            window.location.hash = '/auth';
        } catch (error) {
            console.error('Errore durante il logout:', error);
            alert('Errore durante il logout');
        }
    }
} 