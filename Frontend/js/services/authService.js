// Importo il servizio API per l'autenticazione
import { ApiService } from '../../api/auth.js';

// Chiavi per il localStorage
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Service per gestire l'autenticazione dell'utente
 */
class AuthService {
    /**
     * Effettua il login dell'utente
     * @param {string} email - Email dell'utente
     * @param {string} password - Password dell'utente
     * @returns {Promise<Object>} - Dati dell'utente loggato
     */
    async login(email, password) {
        try {
            const response = await ApiService.login(email, password);
            console.log(response);
            // Salvo i dati di autenticazione nel localStorage
            this.saveAuthData(response.token, response.user);
            
            return response.user;
        } catch (error) {
            console.error('Errore durante il login:', error);
            throw error;
        }
    }
    
    /**
     * Registra un nuovo utente
     * @param {string} name - Nome dell'utente
     * @param {string} email - Email dell'utente
     * @param {string} password - Password dell'utente
     * @param {string} role - Ruolo dell'utente (client, artisan)
     * @returns {Promise<Object>} - Dati dell'utente registrato
     */
    async register(name, email, password, role) {
        try {
            const response = await ApiService.register(name, email, password, role);
            
            // Salvo i dati di autenticazione nel localStorage
            this.saveAuthData(response.token, response.user);
            
            return response.user;
        } catch (error) {
            console.error('Errore durante la registrazione:', error);
            throw error;
        }
    }
    
    /**
     * Effettua il logout dell'utente rimuovendo i dati dal localStorage
     */
    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }
    
    /**
     * Recupera il profilo utente dal server
     * @returns {Promise<Object>} - Dati del profilo utente
     */
    async getProfile() {
        try {
            // Se l'utente non è autenticato, lancio un errore
            if (!this.isAuthenticated()) {
                throw new Error('Utente non autenticato');
            }
            
            const userData = await ApiService.getProfile();
            
            // Aggiorno i dati utente nel localStorage
            this.updateUserData(userData);
            
            return userData;
        } catch (error) {
            console.error('Errore durante il recupero del profilo:', error);
            throw error;
        }
    }
    
    /**
     * Verifica se l'utente è autenticato
     * @returns {boolean} - true se l'utente è autenticato, false altrimenti
     */
    isAuthenticated() {
        return !!this.getToken();
    }
    
    /**
     * Recupera il token dal localStorage
     * @returns {string|null} - Token JWT o null se non presente
     */
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }
    
    /**
     * Recupera i dati dell'utente dal localStorage
     * @returns {Object|null} - Dati utente o null se non presente
     */
    getUser() {
        const userData = localStorage.getItem(USER_KEY);
        return userData ? JSON.parse(userData) : null;
    }
    
    /**
     * Verifica se l'utente corrente ha un determinato ruolo
     * @param {string|string[]} role - Ruolo o array di ruoli da verificare
     * @returns {boolean} - true se l'utente ha il ruolo, false altrimenti
     */
    hasRole(role) {
        const user = this.getUser();
        
        if (!user) return false;
        
        if (Array.isArray(role)) {
            return role.includes(user.role);
        }
        
        return user.role === role;
    }
    
    /**
     * Salva i dati di autenticazione nel localStorage
     * @param {string} token - Token JWT
     * @param {Object} user - Dati utente
     * @private
     */
    saveAuthData(token, user) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    
    /**
     * Aggiorna i dati utente nel localStorage
     * @param {Object} userData - Nuovi dati utente
     * @private
     */
    updateUserData(userData) {
        const currentUser = this.getUser();
        const updatedUser = { ...currentUser, ...userData };
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
}

// Esporto un'istanza singola del servizio di autenticazione
export const authService = new AuthService(); 