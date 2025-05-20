import { fetchWithAuth } from '../js/services/fetchWithAuth.js';
import { getApiUrl } from './config.js';
import { authService } from '../js/services/authService.js';

const API_URL = getApiUrl();

// Funzione per ottenere i prodotti con filtri e paginazione
async function getProducts(params = {}) {
    const queryParams = new URLSearchParams();
    // Aggiungi i parametri se presenti
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.category) {
        if (Array.isArray(params.category)) {
            params.category.forEach(cat => queryParams.append('category[]', cat));
        } else {
            queryParams.append('category[]', params.category);
        }
    }
    if (params.artisan) queryParams.append('artisan', params.artisan);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);

    try {
        const response = await fetch(`${API_URL}/products?${queryParams}`);
        if (!response.ok) throw new Error('Errore nel recupero dei prodotti');
        return await response.json();
    } catch (error) {
        console.error('Errore:', error);
        throw error;
    }
}

// Funzione per ottenere un singolo prodotto
async function getProduct(id) {
    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        if (!response.ok) throw new Error('Prodotto non trovato');
        return await response.json();
    } catch (error) {
        console.error('Errore:', error);
        throw error;
    }
}

// Funzione per creare un nuovo prodotto (richiede autenticazione)
async function createProduct(productData) {
    try {
        const token = authService.getToken();
        if (!token) {
            throw new Error('Utente non autenticato');
        }
        console.log("token", token) ;
        const response = await fetchWithAuth(`${API_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });
        if (!response.ok) throw new Error('Errore nella creazione del prodotto');
        return await response.json();
    } catch (error) {
        console.error('Errore:', error);
        throw error;
    }
}

// Funzione per aggiornare un prodotto (richiede autenticazione)
async function updateProduct(id, productData) {
    try {
        const token = authService.getToken();
        if (!token) {
            throw new Error('Utente non autenticato');
        }
        
        const response = await fetchWithAuth(`${API_URL}/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });
        if (!response.ok) throw new Error('Errore nell\'aggiornamento del prodotto');
        return await response.json();
    } catch (error) {
        console.error('Errore:', error);
        throw error;
    }
}

// Funzione per eliminare un prodotto (richiede autenticazione)
async function deleteProduct(id) {
    try {
        const token = authService.getToken();
        if (!token) {
            throw new Error('Utente non autenticato');
        }
        
        const response = await fetchWithAuth(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Errore nell\'eliminazione del prodotto');
        return true;
    } catch (error) {
        console.error('Errore:', error);
        throw error;
    }
}

// Funzione per ottenere tutti i prodotti di un artigiano specifico (pubblica)
async function getProductsByArtisan(artisanId, params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);

    try {
        const response = await fetch(`${API_URL}/products/by-artisan/${artisanId}?${queryParams}`);
        if (!response.ok) throw new Error('Errore nel recupero dei prodotti dell\'artigiano');
        return await response.json();
    } catch (error) {
        console.error('Errore:', error);
        throw error;
    }
}

// Funzione per cercare prodotti per nome (per i suggerimenti della navbar)
async function searchProducts(searchTerm, limit = 5) {
    return getProducts({ search: searchTerm, limit: limit, page: 1 });
}

export {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByArtisan,
    searchProducts
}; 