/*
  cart.js
  -----------------------------
  Questo modulo fornisce un'API client-side per la gestione del carrello nell'applicazione ArtigianatoShop.
  - Tutte le chiamate sono indirizzate alle API REST del backend tramite fetchWithAuth, che gestisce token e headers.
  - Le funzioni di CartAPI permettono: creazione carrello, aggiunta/rimozione/modifica prodotti, recupero e svuotamento carrello.
  - Ogni operazione aggiorna lo stato globale del carrello tramite eventi custom ('cart:change') per sincronizzare UI e badge.
  - Le scelte tecniche privilegiano la modularità e la separazione delle responsabilità: la logica di gestione carrello è centralizzata qui.
  - Tutte le chiamate sono protette da error handling robusto e restituiscono dati già pronti per l'uso nei componenti frontend.
  - Le rotte e i payload sono allineati con la documentazione Swagger del backend.
  - Ogni funzione è documentata inline per chiarire parametri, comportamento e possibili errori.
*/

import { fetchWithAuth } from '../js/services/fetchWithAuth.js';
import { getApiUrl } from './config.js';
import { authService } from '../js/services/authService.js';

const API_URL = getApiUrl();
const CartAPI = {
    /**
     * Crea un nuovo carrello per l'utente autenticato (se non esiste).
     * @returns {Promise<object>} Dati del carrello creato o già esistente.
     * @throws {Error} Se l'utente non è autenticato o la richiesta fallisce.
     */
    createCart: async () => {
        const token = authService.getToken();
        if (!token) throw new Error('Utente non autenticato');
        try {
            const response = await fetchWithAuth(`${API_URL}/cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nella creazione del carrello');
            }
            return await response.json();
        } catch (error) {
            console.error('Errore API createCart:', error);
            throw error;
        }
    },

    /**
     * Aggiunge un prodotto al carrello.
     * @param {number|string} product_id - ID del prodotto da aggiungere.
     * @param {number} [quantity=1] - Quantità da aggiungere (default 1).
     * @returns {Promise<object>} Risultato dell'operazione.
     * @throws {Error} Se l'utente non è autenticato o la richiesta fallisce.
     */
    addItem: async (product_id, quantity = 1) => {
        console.log(product_id, quantity);
        const token = authService.getToken();
        if (!token) throw new Error('Utente non autenticato');
        try {
            const response = await fetchWithAuth(`${API_URL}/cart/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ product_id, quantity })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nell\'aggiunta al carrello');
            }
            const result = await response.json();
            // Dispatch evento per aggiornare il counter del carrello
            document.dispatchEvent(new CustomEvent('cart:change'));
            return result;
        } catch (error) {
            console.error('Errore API addItem:', error);
            throw error;
        }
    },

    /**
     * Recupera il carrello dell'utente autenticato.
     * @returns {Promise<object>} Dati del carrello.
     * @throws {Error} Se l'utente non è autenticato o la richiesta fallisce.
     */
    getCart: async () => {
        const token = authService.getToken();
        if (!token) throw new Error('Utente non autenticato');
        try {
            const response = await fetchWithAuth(`${API_URL}/cart`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nel recupero del carrello');
            }
            return await response.json();
        } catch (error) {
            console.error('Errore API getCart:', error);
            throw error;
        }
    },

    /**
     * Modifica la quantità di un prodotto nel carrello.
     * @param {number|string} item_id - ID dell'item nel carrello.
     * @param {number} quantity - Nuova quantità.
     * @returns {Promise<object>} Risultato dell'operazione.
     * @throws {Error} Se l'utente non è autenticato o la richiesta fallisce.
     */
    updateItem: async (item_id, quantity) => {
        const token = authService.getToken();
        if (!token) throw new Error('Utente non autenticato');
        try {
            const response = await fetchWithAuth(`${API_URL}/cart/items/${item_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quantity })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nell\'aggiornamento della quantità');
            }
            const result = await response.json();
            // Dispatch evento per aggiornare il counter del carrello
            document.dispatchEvent(new CustomEvent('cart:change'));
            return result;
        } catch (error) {
            console.error('Errore API updateItem:', error);
            throw error;
        }
    },

    /**
     * Rimuove un prodotto dal carrello.
     * @param {number|string} item_id - ID dell'item da rimuovere.
     * @returns {Promise<object>} Risultato dell'operazione.
     * @throws {Error} Se l'utente non è autenticato o la richiesta fallisce.
     */
    removeItem: async (item_id) => {
        const token = authService.getToken();
        if (!token) throw new Error('Utente non autenticato');
        try {
            const response = await fetchWithAuth(`${API_URL}/cart/items/${item_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nella rimozione dal carrello');
            }
            const result = await response.json();
            // Dispatch evento per aggiornare il counter del carrello
            document.dispatchEvent(new CustomEvent('cart:change'));
            return result;
        } catch (error) {
            console.error('Errore API removeItem:', error);
            throw error;
        }
    },

    /**
     * Svuota completamente il carrello dell'utente autenticato.
     * @returns {Promise<object>} Risultato dell'operazione.
     * @throws {Error} Se l'utente non è autenticato o la richiesta fallisce.
     */
    clearCart: async () => {
        const token = authService.getToken();
        if (!token) throw new Error('Utente non autenticato');
        try {
            const response = await fetchWithAuth(`${API_URL}/cart`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nello svuotamento del carrello');
            }
            const result = await response.json();
            // Dispatch evento per aggiornare il counter del carrello
            document.dispatchEvent(new CustomEvent('cart:change'));
            return result;
        } catch (error) {
            console.error('Errore API clearCart:', error);
            throw error;
        }
    }
};

export default CartAPI;
