import { fetchWithAuth } from '../js/services/fetchWithAuth.js';
const API_URL = 'http://localhost:3005/cart';
import { authService } from '../js/services/authService.js';

const CartAPI = {
    // 1. Crea carrello (se non esiste)
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

    // 2. Aggiungi prodotto al carrello
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

    // 3. Ottieni carrello
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

    // 4. Modifica quantità prodotto
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

    // 5. Rimuovi prodotto dal carrello
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

    // 6. Svuota carrello
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
