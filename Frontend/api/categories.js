/*
  categories.js
  -----------------------------
  Questo modulo fornisce un'API client-side per la gestione delle categorie nell'applicazione Pane e Salame.
  - Tutte le chiamate sono indirizzate alle API REST del backend tramite fetchWithAuth, che gestisce token e headers.
  - Le funzioni di CategoriesAPI permettono: recupero di tutte le categorie, dell'albero categorie, di una singola categoria, creazione, aggiornamento e cancellazione (queste ultime solo per admin).
  - Le scelte tecniche privilegiano la modularità e la separazione delle responsabilità: la logica di gestione categorie è centralizzata qui.
  - Tutte le chiamate sono protette da error handling robusto e restituiscono dati già pronti per l'uso nei componenti frontend.
  - Le rotte e i payload sono allineati con la documentazione Swagger del backend.
  - Ogni funzione è documentata inline per chiarire parametri, comportamento e possibili errori.
*/

import { fetchWithAuth } from '../js/services/fetchWithAuth.js';
import { getApiUrl } from './config.js';
import { authService } from '../js/services/authService.js';

const API_URL = getApiUrl();
/**
 * Servizio per la gestione delle API delle categorie
 */
const CategoriesAPI = {
    /**
     * Ottiene tutte le categorie.
     * @returns {Promise<object>} Promise con i dati delle categorie.
     * @throws {Error} Se la richiesta fallisce.
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
     * Ottiene l'albero delle categorie.
     * @returns {Promise<object>} Promise con l'albero delle categorie.
     * @throws {Error} Se la richiesta fallisce.
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
     * Ottiene una singola categoria tramite ID.
     * @param {number|string} id - ID della categoria.
     * @returns {Promise<object>} Promise con i dati della categoria.
     * @throws {Error} Se la richiesta fallisce.
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
     * Crea una nuova categoria (richiede autenticazione admin).
     * @param {Object} categoryData - Dati della categoria da creare (name, description, dad_id).
     * @returns {Promise<object>} Promise con i dati della categoria creata.
     * @throws {Error} Se l'utente non è autenticato o la richiesta fallisce.
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
     * Aggiorna una categoria esistente (richiede autenticazione admin).
     * @param {number|string} id - ID della categoria.
     * @param {Object} categoryData - Dati della categoria da aggiornare (name, description, dad_id).
     * @returns {Promise<object>} Promise con i dati della categoria aggiornata.
     * @throws {Error} Se l'utente non è autenticato o la richiesta fallisce.
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
     * Elimina una categoria (richiede autenticazione admin).
     * @param {number|string} id - ID della categoria da eliminare.
     * @returns {Promise<boolean>} Promise con esito dell'operazione.
     * @throws {Error} Se l'utente non è autenticato o la richiesta fallisce.
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
