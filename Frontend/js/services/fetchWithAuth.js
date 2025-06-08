import { authService } from './authService.js';
import { showBootstrapToast } from '../components/Toast.js';
import { router } from '../router.js';

/**
 * Effettua una richiesta fetch e gestisce automaticamente la scadenza della sessione (401)
 * @param {string} url URL della richiesta
 * @param {Object} [options={}] Opzioni fetch
 * @returns {Promise<Response>} Oggetto Response della fetch
 * @throws {Error} Se la sessione è scaduta o non autorizzata
 */
export async function fetchWithAuth(url, options = {}) {
    const response = await fetch(url, options);
    if (response.status === 401) {
        // Se la sessione è scaduta, effettua il logout e mostra un messaggio
        authService.logout();
        showBootstrapToast('Sessione scaduta, effettua di nuovo il login', 'Attenzione', 'warning');
        router.navigateToLogin(window.location.pathname);
        throw new Error('Non autorizzato. Effettua di nuovo il login.');
    }
    return response;
} 