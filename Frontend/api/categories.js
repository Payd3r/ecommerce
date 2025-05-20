import { fetchWithAuth } from '../js/services/fetchWithAuth.js';
// Utilizziamo l'URL di base delle API dell'applicazione
const API_URL = 'http://localhost:3005';
import { authService } from '../js/services/authService.js';

const API_URL = getApiUrl();
/**
 * Servizio per la gestione delle API delle categorie
 */
const CategoriesAPI = {
    /**
     * Ottiene tutte le categorie
     * @returns {Promise} Promise con i dati delle categorie
     */
    getCategories: async () => {
        try {
            const response = await fetchWithAuth(`${API_URL}/categories`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nel recupero delle categorie');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Errore API getCategories:', error);
            throw error;
        }
    },
    
    /**
     * Ottiene l'albero delle categorie
     * @returns {Promise} Promise con l'albero delle categorie
     */
    getCategoryTree: async () => {
        try {
            const response = await fetchWithAuth(`${API_URL}/categories/tree`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nel recupero dell\'albero delle categorie');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Errore API getCategoryTree:', error);
            throw error;
        }
    },
    
    /**
     * Ottiene una singola categoria tramite ID
     * @param {number|string} id - ID della categoria
     * @returns {Promise} Promise con i dati della categoria
     */
    getCategory: async (id) => {
        try {
            const response = await fetchWithAuth(`${API_URL}/categories/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nel recupero della categoria');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Errore API getCategory:', error);
            throw error;
        }
    },
    
    /**
     * Crea una nuova categoria (richiede autenticazione admin)
     * @param {Object} categoryData - Dati della categoria da creare (name, description, dad_id)
     * @returns {Promise} Promise con i dati della categoria creata
     */
    createCategory: async (categoryData) => {
        const token = authService.getToken();
        
        if (!token) {
            throw new Error('Utente non autenticato');
        }
        
        try {
            const response = await fetchWithAuth(`${API_URL}/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(categoryData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nella creazione della categoria');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Errore API createCategory:', error);
            throw error;
        }
    },
    
    /**
     * Aggiorna una categoria esistente (richiede autenticazione admin)
     * @param {number|string} id - ID della categoria
     * @param {Object} categoryData - Dati della categoria da aggiornare (name, description, dad_id)
     * @returns {Promise} Promise con i dati della categoria aggiornata
     */
    updateCategory: async (id, categoryData) => {
        const token = authService.getToken();
        
        if (!token) {
            throw new Error('Utente non autenticato');
        }
        
        try {
            const response = await fetchWithAuth(`${API_URL}/categories/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(categoryData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nell\'aggiornamento della categoria');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Errore API updateCategory:', error);
            throw error;
        }
    },
    
    /**
     * Elimina una categoria (richiede autenticazione admin)
     * @param {number|string} id - ID della categoria da eliminare
     * @returns {Promise<boolean>} Promise con esito dell'operazione
     */
    deleteCategory: async (id) => {
        const token = authService.getToken();
        
        if (!token) {
            throw new Error('Utente non autenticato');
        }
        
        try {
            const response = await fetchWithAuth(`${API_URL}/categories/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nell\'eliminazione della categoria');
            }
            
            return true;
        } catch (error) {
            console.error('Errore API deleteCategory:', error);
            throw error;
        }
    }
};

export default CategoriesAPI;
