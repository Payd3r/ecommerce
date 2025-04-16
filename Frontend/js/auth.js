document.addEventListener('DOMContentLoaded', () => {
    // Gestione del form di login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await ApiService.login(email, password);
                if (response.token) {
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('role', response.user.role);
                    
                    // Reindirizzamento in base al tipo di utente
                    if (response.user.role === 'admin') {
                        window.location.href = 'index.html?page=admin';
                    } else if (response.user.role === 'client') {
                        window.location.href = 'index.html?page=products';
                    } else if (response.user.role === 'artisan') {
                        window.location.href = 'index.html?page=dashboard';
                    }
                } else {
                    alert('Credenziali non valide');
                }
            } catch (error) {
                alert('Errore durante il login');
            }
        });
    }

    // Gestione del form di registrazione
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const role = document.getElementById('registerType').value;

            try {
                const response = await ApiService.register(name, email, password, role);
                if (response.token) {
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('role', response.user.role);
                    
                    // Reindirizzamento in base al tipo di utente
                    if (response.user.role === 'admin') {
                        window.location.href = 'index.html?page=admin';
                    } else if (response.user.role === 'client') {
                        window.location.href = 'index.html?page=products';
                    } else if (response.user.role === 'artisan') {
                        window.location.href = 'index.html?page=dashboard';
                    }
                } else {
                    alert('Errore durante la registrazione');
                }
            } catch (error) {
                alert('Errore durante la registrazione');
            }
        });
    }

    // Gestione del logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            window.location.href = 'autenticate.html';
        });
    }

    // Gestione della visualizzazione degli elementi in base all'autenticazione
    const token = localStorage.getItem('token');
    const loginNavItem = document.getElementById('loginNavItem');
    const logoutNavItem = document.getElementById('logoutNavItem');
    const welcomeMessage = document.getElementById('welcomeMessage');

    if (token) {
        // Utente autenticato
        if (loginNavItem) loginNavItem.style.display = 'none';
        if (logoutNavItem) logoutNavItem.style.display = 'block';
        if (welcomeMessage) {
            ApiService.getProfile()
                .then(profile => {
                    welcomeMessage.textContent = `Benvenuto ${profile.name}!`;
                })
                .catch(() => {
                    welcomeMessage.textContent = 'Benvenuto!';
                });
        }
    } else {
        // Utente non autenticato
        if (loginNavItem) loginNavItem.style.display = 'block';
        if (logoutNavItem) logoutNavItem.style.display = 'none';
        if (welcomeMessage) {
            welcomeMessage.textContent = 'Per accedere ai servizi, effettua il login o registrati.';
        }
    }

    // Caricamento della pagina corretta in base al tipo di utente
    const userType = localStorage.getItem('role');
    const mainContent = document.getElementById('mainContent');
    console.log('userType', userType);
    if (token && mainContent) {
        // Carica la pagina corretta in base al tipo di utente
        if (userType === 'admin') {
            loadPage('html/Admin/admin.html');
        } else if (userType === 'client') {
            loadPage('html/Client/products.html');
        } else if (userType === 'artisan') {
            loadPage('html/Artigiano/dashboard.html');
        }
    }

    // Funzione per caricare dinamicamente le pagine
    async function loadPage(pageName) {
        try {
            const response = await fetch(pageName);
            const html = await response.text();
            mainContent.innerHTML = html;
        } catch (error) {
            console.error('Errore nel caricamento della pagina:', error);
            mainContent.innerHTML = '<div class="alert alert-danger">Errore nel caricamento della pagina</div>';
        }
    }

    // Verifica se l'utente è autenticato
    if (token) {
        // Se siamo nella pagina di autenticazione e l'utente è già loggato, reindirizziamo alla home
        if (window.location.pathname.includes('autenticate.html')) {
            if (userType === 'client') {
                window.location.href = 'index.html?page=products';
            } else if (userType === 'artisan') {
                window.location.href = 'index.html?page=dashboard';
            }
        }
    } else {
        // Se non siamo nella pagina di autenticazione e l'utente non è loggato, reindirizziamo al login
        if (!window.location.pathname.includes('autenticate.html') && !window.location.pathname.includes('index.html')) {
            window.location.href = 'autenticate.html';
        }
    }
});
