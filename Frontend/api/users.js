/*
  users.js
  -----------------------------
  Questo modulo fornisce un'API client-side per la gestione degli utenti nell'applicazione ArtigianatoShop.
  - Tutte le chiamate sono indirizzate alle API REST del backend tramite fetchWithAuth, che gestisce token e headers.
  - Le funzioni di UsersAPI permettono: gestione profilo, password, eliminazione account, gestione utenti e artigiani, approvazione, conteggi, dettagli artigiano e altro.
  - Le scelte tecniche privilegiano la modularità e la separazione delle responsabilità: la logica di gestione utenti è centralizzata qui.
  - Tutte le chiamate sono protette da error handling robusto e restituiscono dati già pronti per l'uso nei componenti frontend.
  - Le rotte e i payload sono allineati con la documentazione Swagger del backend.
  - Ogni funzione è documentata inline per chiarire parametri, comportamento e possibili errori.
*/

import { fetchWithAuth } from '../js/services/fetchWithAuth.js';
import { getApiUrl } from './config.js';
import { authService } from '../js/services/authService.js';

const API_URL = getApiUrl();

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
            const response = await fetchWithAuth(`${API_URL}/users/me`, {
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
        const user = authService.getUser();

        if (!token) {
            throw new Error('Utente non autenticato');
        }
        if (!user || !user.id) {
            throw new Error('Impossibile determinare l\'utente loggato');
        }

        // userData dovrebbe essere un oggetto JSON solo con i campi da aggiornare (es. name, role)
        // Non dovrebbe contenere file qui.
        const bodyData = { ...userData };
        // Rimuovi eventuali campi file se passati per errore, anche se non dovrebbero esserci.
        delete bodyData.profileImage; 
        delete bodyData.bannerImage;
        delete bodyData.biography; // La biografia è gestita da updateArtisanDetails

        try {
            const response = await fetchWithAuth(`${API_URL}/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json', // Assicurati che sia JSON
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bodyData) // Invia solo dati JSON
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
            const response = await fetchWithAuth(`${API_URL}/users/password`, {
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
            const response = await fetchWithAuth(`${API_URL}/users/me`, {
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
            if (params.id) queryParams.append('id', params.id);

            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
            const url = `${API_URL}/users/artisans${queryString}`;

            // Prepara gli headers con il token di autenticazione
            const headers = {
                'Content-Type': 'application/json'
            };

            const response = await fetchWithAuth(url, {
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

    /**
     * Ottiene tutti gli utenti con filtri e paginazione.
     * @param {Object} params - Parametri di filtro e paginazione (page, limit, name, email, role, orderBy, orderDir).
     * @returns {Promise<object>} Promise con la lista degli utenti.
     * @throws {Error} Se la richiesta fallisce o l'utente non è autenticato.
     */
    getUsers: async (params = {}) => {
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.name) queryParams.append('name', params.name);
        if (params.email) queryParams.append('email', params.email);
        if (params.role) queryParams.append('role', params.role);
        if (params.orderBy) queryParams.append('orderBy', params.orderBy);
        if (params.orderDir) queryParams.append('orderDir', params.orderDir);
        try {
            const token = authService.getToken();
            if (!token) {
                throw new Error('Utente non autenticato');
            }

            const response = await fetchWithAuth(`${API_URL}/users?${queryParams}`, {
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
    },

    /**
     * Crea un nuovo utente.
     * @param {Object} userData - Dati del nuovo utente (name, email, role).
     * @returns {Promise<object>} Promise con i dati dell'utente creato.
     * @throws {Error} Se la richiesta fallisce o l'utente non è autenticato.
     */
    createUser: async (userData) => {
        const token = authService.getToken();

        if (!token) {
            throw new Error('Utente non autenticato');
        }

        try {
            const response = await fetchWithAuth(`${API_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nella creazione dell\'utente');
            }

            return await response.json();
        } catch (error) {
            console.error('Errore API createUser:', error);
            throw error;
        }
    },

    /**
     * Ottiene un utente tramite ID.
     * @param {number|string} userId - ID dell'utente da recuperare.
     * @returns {Promise<object>} Promise con i dati dell'utente.
     * @throws {Error} Se la richiesta fallisce o l'utente non è autenticato.
     */
    getUser: async (userId) => {
        const token = authService.getToken();
        if (!token) {
            throw new Error('Utente non autenticato');
        }
        try {
            const response = await fetchWithAuth(`${API_URL}/users/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nel recupero dell\'utente');
            }
            return await response.json();
        } catch (error) {
            console.error('Errore API getUser:', error);
            throw error;
        }
    },

    /**
     * Aggiorna un utente tramite ID.
     * @param {number|string} userId - ID dell'utente da aggiornare.
     * @param {Object} userData - Dati da aggiornare (name, email, role).
     * @returns {Promise<object>} Promise con i dati aggiornati dell'utente.
     * @throws {Error} Se la richiesta fallisce o l'utente non è autenticato.
     */
    updateUser: async (userId, userData) => {
        const token = authService.getToken();
        if (!token) {
            throw new Error('Utente non autenticato');
        }
        // Costruisci dinamicamente il body solo con i campi forniti (come nel backend)
        const allowedFields = ['name', 'email', 'role'];
        const filteredData = {};
        for (const key of allowedFields) {
            if (userData[key] !== undefined) {
                filteredData[key] = userData[key];
            }
        }
        if (Object.keys(filteredData).length === 0) {
            throw new Error('Nessun campo da aggiornare');
        }
        try {
            const response = await fetchWithAuth(`${API_URL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(filteredData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nell\'aggiornamento dell\'utente');
            }
            return await response.json();
        } catch (error) {
            console.error('Errore API updateUser:', error);
            throw error;
        }
    },

    /**
     * Elimina un utente tramite ID.
     * @param {number|string} userId - ID dell'utente da eliminare.
     * @returns {Promise<boolean>} Promise risolta se eliminazione avvenuta con successo.
     * @throws {Error} Se la richiesta fallisce o l'utente non è autenticato.
     */
    deleteUser: async (userId) => {
        const token = authService.getToken();
        if (!token) {
            throw new Error('Utente non autenticato');
        }
        try {
            const response = await fetchWithAuth(`${API_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok && response.status !== 204) {
                let errorData = {};
                try { errorData = await response.json(); } catch {}
                throw new Error(errorData.error || 'Errore nell\'eliminazione dell\'utente');
            }
            return true;
        } catch (error) {
            console.error('Errore API deleteUser:', error);
            throw error;
        }
    },

    /**
     * Ottiene i conteggi utenti per ruolo (client, artisan, admin, totale).
     * @returns {Promise<Object>} Oggetto con counts: { clients, artisans, admins, total }.
     * @throws {Error} Se la richiesta fallisce o l'utente non è autenticato.
     */
    getCounts: async () => {
        const token = authService.getToken();
        if (!token) {
            throw new Error('Utente non autenticato');
        }
        try {
            const response = await fetchWithAuth(`${API_URL}/users/counts`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nel recupero dei conteggi utenti');
            }
            return await response.json();
        } catch (error) {
            console.error('Errore API getCounts:', error);
            throw error;
        }
    },

    /**
     * Aggiorna i dettagli specifici dell'artigiano (solo bio e dati testuali, NON immagini).
     * @param {Object} artisanData - Oggetto contenente bio (e altri dati testuali).
     * @returns {Promise<object>} Promise con i dati aggiornati.
     * @throws {Error} Se la richiesta fallisce o l'utente non è autenticato.
     */
    updateArtisanDetails: async (artisanData) => {
        const token = authService.getToken();
        if (!token) {
            throw new Error('Utente non autenticato');
        }
        // L'ID utente è implicito nel token e gestito dal backend.
        try {
            const response = await fetchWithAuth(`${API_URL}/users/artisan-details`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(artisanData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nell\'aggiornamento dei dettagli artigiano');
            }
            return await response.json();
        } catch (error) {
            console.error('Errore API updateArtisanDetails:', error);
            throw error;
        }
    },

    /**
     * Ottiene gli artigiani in attesa di approvazione (pending).
     * @param {Object} params - Parametri opzionali (limit).
     * @returns {Promise<object>} Promise con la lista degli utenti pending.
     * @throws {Error} Se la richiesta fallisce o l'utente non è autenticato.
     */
    getPendingArtisans: async (params = {}) => {
        const token = authService.getToken();
        if (!token) {
            throw new Error('Utente non autenticato');
        }
        try {
            const queryParams = new URLSearchParams();
            if (params.limit) queryParams.append('limit', params.limit);
            const url = `${API_URL}/users/pending-artisans${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await fetchWithAuth(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nel recupero degli artigiani da approvare');
            }
            return await response.json();
        } catch (error) {
            console.error('Errore API getPendingArtisans:', error);
            throw error;
        }
    },

    /**
     * Approva un artigiano (cambia ruolo e imposta approved=1).
     * @param {number|string} userId - ID dell'utente da approvare.
     * @returns {Promise<object>} Promise con esito.
     * @throws {Error} Se la richiesta fallisce o l'utente non è autenticato.
     */
    approveArtisan: async (userId) => {
        const token = authService.getToken();
        if (!token) throw new Error('Utente non autenticato');
        try {
            const response = await fetchWithAuth(`${API_URL}/users/${userId}/approve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nell\'approvazione dell\'utente');
            }
            return await response.json();
        } catch (error) {
            console.error('Errore API approveArtisan:', error);
            throw error;
        }
    },
};

export default UsersAPI;

