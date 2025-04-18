// Utilizziamo l'URL di base delle API dell'applicazione
const API_BASE_URL = 'http://localhost:3005';
import { authService } from '../js/services/authService.js';

/**
 * Servizio per la gestione delle API degli utenti
 */
const UsersAPI = {
    /**
     * Ottiene il profilo dell'utente corrente
     * @returns {Promise} Promise con i dati del profilo utente
     */
    getUserProfile: async () => {
        const token = authService.getToken();

        if (!token) {
            throw new Error('Utente non autenticato');
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nel recupero del profilo utente');
            }

            return await response.json();
        } catch (error) {
            console.error('Errore API getUserProfile:', error);
            throw error;
        }
    },

    /**
     * Aggiorna il profilo dell'utente
     * @param {Object} userData - Dati utente da aggiornare
     * @returns {Promise} Promise con i dati aggiornati
     */
    updateUserProfile: async (userData) => {
        const token = authService.getToken();

        if (!token) {
            throw new Error('Utente non autenticato');
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nell\'aggiornamento del profilo');
            }

            return await response.json();
        } catch (error) {
            console.error('Errore API updateUserProfile:', error);
            throw error;
        }
    },

    /**
     * Cambia la password dell'utente
     * @param {Object} passwordData - Dati per il cambio password
     * @returns {Promise} Promise con esito dell'operazione
     */
    changePassword: async (passwordData) => {
        const token = authService.getToken();

        if (!token) {
            throw new Error('Utente non autenticato');
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(passwordData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nel cambio password');
            }

            return await response.json();
        } catch (error) {
            console.error('Errore API changePassword:', error);
            throw error;
        }
    },

    /**
     * Elimina l'account dell'utente
     * @returns {Promise} Promise con esito dell'operazione
     */
    deleteAccount: async () => {
        const token = authService.getToken();

        if (!token) {
            throw new Error('Utente non autenticato');
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nell\'eliminazione dell\'account');
            }

            return true;
        } catch (error) {
            console.error('Errore API deleteAccount:', error);
            throw error;
        }
    },

    /**
     * Ottiene l'elenco degli artisani
     * @param {Object} params - Parametri di paginazione e ricerca
     * @returns {Promise} Promise con i dati degli artisani
     */
    getArtisans: async (params = {}) => {
        try {
                        // Costruisci i parametri di query
            const queryParams = new URLSearchParams();

            if (params.page) queryParams.append('page', params.page);
            if (params.limit) queryParams.append('limit', params.limit);
            if (params.search) queryParams.append('search', params.search);

            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
            const url = `${API_BASE_URL}/users/artisans${queryString}`;

            // Prepara gli headers con il token di autenticazione
            const headers = {
                'Content-Type': 'application/json'
            };

            const response = await fetch(url, {
                method: 'GET',
                headers
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nel recupero degli artisani');
            }

            return await response.json();
        } catch (error) {
            console.error('Errore API getArtisans:', error);
            throw error;
        }
    },
    // Funzione per ottenere tutti gli utenti con filtri e paginazione
    getUsers: async (params = {}) => {
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.role) queryParams.append('role', params.role);

        try {
            const token = authService.getToken();
            if (!token) {
                throw new Error('Utente non autenticato');
            }

            const response = await fetch(`${API_BASE_URL}/users?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nel recupero degli utenti');
            }

            return await response.json();
        } catch (error) {
            console.error('Errore API getUsers:', error);
            throw error;
        }
    }
};

export default UsersAPI;

