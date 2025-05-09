import { authService } from './authService.js';
import { showBootstrapToast } from '../components/Toast.js';
import { router } from '../router.js';

export async function fetchWithAuth(url, options = {}) {
    const response = await fetch(url, options);
    if (response.status === 401) {
        authService.logout();
        showBootstrapToast('Sessione scaduta, effettua di nuovo il login', 'Attenzione', 'warning');
        router.navigateToLogin(window.location.pathname);
        throw new Error('Non autorizzato. Effettua di nuovo il login.');
    }
    return response;
} 