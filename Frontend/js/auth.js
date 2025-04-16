import { Router } from './router.js';
import { NavbarManager } from './navbar.js';
import { ApiService } from '../api/auth.js';

const router = new Router();
const navbarManager = new NavbarManager();

// Funzione per caricare la navbar
async function loadNavbar() {
    try {
        const response = await fetch('/Frontend/html/components/navbar.html');
        const html = await response.text();
        document.getElementById('navbarContainer').innerHTML = html;
        
        // Aggiungi event listener per il logout dopo che la navbar è stata caricata
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Aggiorna la UI in base allo stato di autenticazione
        const token = localStorage.getItem('token');
        if (token) {
            updateUIForLoggedInUser();
        } else {
            updateUIForLoggedOutUser();
        }
    } catch (error) {
        console.error('Errore nel caricamento della navbar:', error);
    }
}

// Funzione per inizializzare i form di autenticazione
export function initializeAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Funzione per gestire il login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await ApiService.login(email, password);
        if (response && response.token) {
            console.log('Login effettuato con successo:', response);
            await handleAuthenticationSuccess(response);
        } else {
            alert('Credenziali non valide');
        }
    } catch (error) {
        console.error('Errore durante il login:', error);
        alert(error.message || 'Errore durante il login');
    }
}

// Funzione per gestire la registrazione
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerType').value;
    
    try {
        const response = await ApiService.register(name, email, password, role);
        if (response && response.token) {
            await handleAuthenticationSuccess(response);
        } else {
            alert('Errore durante la registrazione');
        }
    } catch (error) {
        console.error('Errore durante la registrazione:', error);
        alert(error.message || 'Errore durante la registrazione');
    }
}

// Funzione per gestire il logout
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    updateUIForLoggedOutUser();
    window.location.replace('/Frontend/index.html#/auth');
}

// Funzione per gestire il successo dell'autenticazione
async function handleAuthenticationSuccess(response) {
    console.log('Gestione autenticazione:', response);
    console.log('Ruolo utente:', response.user.role, typeof response.user.role);
    const role = response.user.role;
    localStorage.setItem('token', response.token);
    localStorage.setItem('role', role);
    localStorage.setItem('userName', response.user.name);
    
    // Reindirizza in base al ruolo
    let redirectPath;
    switch (role) {
        case 'client':
        case 'Client':
            redirectPath = '/Frontend/html/Client/index.html';
            break;
        case 'artisan':
        case 'Artisan':
            redirectPath = '/Frontend/html/Artisan/index.html';
            break;
        case 'admin':
        case 'Admin':
            redirectPath = '/Frontend/html/Admin/index.html';
            break;
        default:
            console.error('Ruolo non riconosciuto:', role);
            redirectPath = '/Frontend/index.html#/auth';
    }
    
    console.log('Reindirizzamento a:', redirectPath);
    window.location.replace(redirectPath);
}

// Funzione per inizializzare l'applicazione
async function initializeApp() {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    
    if (token) {
        // Utente autenticato
        navbarManager.updateUIForLoggedInUser();
        
        // Inizializza il router solo per i clienti
        if (userRole === 'client') {
            router.init();
        }
        // Reindirizza gli altri ruoli alle loro pagine specifiche
        else if (window.location.pathname === '/index.html') {
            window.location.href = `${userRole}.html`;
        }
    } else {
        // Utente non autenticato
        navbarManager.updateUIForLoggedOutUser();
        
        // Reindirizza al login se non è già nella pagina di autenticazione
        if (!window.location.pathname.includes('autenticate.html')) {
            window.location.href = 'autenticate.html';
        }
    }
}

// Funzione per aggiornare l'UI per utente loggato
function updateUIForLoggedInUser() {
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
    const allMenus = ['clientMenu', 'artisanMenu', 'adminMenu'];
    allMenus.forEach(menuId => {
        const menu = document.getElementById(menuId);
        if (menu) menu.style.display = 'none';
    });

    // Mostra il menu appropriato in base al ruolo
    switch (userRole) {
        case 'client':
            const clientMenu = document.getElementById('clientMenu');
            if (clientMenu) clientMenu.style.display = 'flex';
            break;
        case 'artisan':
            const artisanMenu = document.getElementById('artisanMenu');
            if (artisanMenu) artisanMenu.style.display = 'flex';
            break;
        case 'admin':
            const adminMenu = document.getElementById('adminMenu');
            if (adminMenu) adminMenu.style.display = 'flex';
            break;
    }
}

// Funzione per aggiornare l'UI per utente non loggato
function updateUIForLoggedOutUser() {
    const loginNavItem = document.getElementById('loginNavItem');
    const logoutNavItem = document.getElementById('logoutNavItem');
    const userInfo = document.getElementById('userInfo');
    
    // Nascondi tutti i menu
    const allMenus = ['clientMenu', 'artisanMenu', 'adminMenu'];
    allMenus.forEach(menuId => {
        const menu = document.getElementById(menuId);
        if (menu) menu.style.display = 'none';
    });

    // Mostra/nascondi elementi di autenticazione
    if (loginNavItem) {
        // Nascondi il pulsante login/registrazione se siamo nella pagina di autenticazione
        loginNavItem.style.display = window.location.pathname.includes('autenticate.html') ? 'none' : 'block';
    }
    if (logoutNavItem) logoutNavItem.style.display = 'none';
    if (userInfo) userInfo.style.display = 'none';
}

// Funzione per mostrare errori
function showError(message) {
    // Implementa la logica per mostrare gli errori (es. usando un alert o un toast)
    alert(message);
}

// Inizializzazione al caricamento della pagina
document.addEventListener('DOMContentLoaded', async () => {
    // Carica la navbar
    await navbarManager.loadNavbar();
    
    // Inizializza il router
    router.init();
});
