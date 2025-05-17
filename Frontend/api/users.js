import { fetchWithAuth } from '../js/services/fetchWithAuth.js';
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
            const response = await fetchWithAuth(`${API_BASE_URL}/users/me`, {
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
            const response = await fetchWithAuth(`${API_BASE_URL}/users/${user.id}`, {
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
            const response = await fetchWithAuth(`${API_BASE_URL}/users/password`, {
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
            const response = await fetchWithAuth(`${API_BASE_URL}/users/me`, {
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
            const url = `${API_BASE_URL}/users/artisans${queryString}`;

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
    // Funzione per ottenere tutti gli utenti con filtri e paginazione
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

            const response = await fetchWithAuth(`${API_BASE_URL}/users?${queryParams}`, {
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
     * Crea un nuovo utente
     * @param {Object} userData - Dati del nuovo utente (name, email, role)
     * @returns {Promise} Promise con i dati dell'utente creato
     */
    createUser: async (userData) => {
        const token = authService.getToken();

        if (!token) {
            throw new Error('Utente non autenticato');
        }

        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/users`, {
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
     * Ottiene un utente tramite ID
     * @param {number|string} userId - ID dell'utente da recuperare
     * @returns {Promise} Promise con i dati dell'utente
     */
    getUser: async (userId) => {
        const token = authService.getToken();
        if (!token) {
            throw new Error('Utente non autenticato');
        }
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/users/${userId}`, {
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
     * Aggiorna un utente tramite ID
     * @param {number|string} userId - ID dell'utente da aggiornare
     * @param {Object} userData - Dati da aggiornare (name, email, role)
     * @returns {Promise} Promise con i dati aggiornati dell'utente
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
            const response = await fetchWithAuth(`${API_BASE_URL}/users/${userId}`, {
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
     * Elimina un utente tramite ID
     * @param {number|string} userId - ID dell'utente da eliminare
     * @returns {Promise} Promise risolta se eliminazione avvenuta con successo
     */
    deleteUser: async (userId) => {
        const token = authService.getToken();
        if (!token) {
            throw new Error('Utente non autenticato');
        }
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/users/${userId}`, {
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
     * Ottiene i conteggi utenti per ruolo (client, artisan, admin, totale)
     * @returns {Promise<Object>} Oggetto con counts: { clients, artisans, admins, total }
     */
    getCounts: async () => {
        const token = authService.getToken();
        if (!token) {
            throw new Error('Utente non autenticato');
        }
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/users/counts`, {
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
     * Aggiorna i dettagli specifici dell'artigiano (bio, immagini).
     * @param {FormData} artisanData - FormData contenente bio, profileImage (file), bannerImage (file).
     * @returns {Promise} Promise con i dati aggiornati.
     */
    updateArtisanDetails: async (artisanData) => {
        const token = authService.getToken();
        if (!token) {
            throw new Error('Utente non autenticato');
        }
        // L'ID utente è implicito nel token e gestito dal backend.
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/users/artisan-details`, {
                method: 'POST',
                headers: {
                    // 'Content-Type': 'multipart/form-data' // NON impostare Content-Type con FormData, il browser lo fa.
                    'Authorization': `Bearer ${token}`
                },
                body: artisanData // Invia direttamente FormData
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
};

export default UsersAPI;

