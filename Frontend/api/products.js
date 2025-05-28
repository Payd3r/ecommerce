/*
  products.js
  -----------------------------
  Questo modulo fornisce funzioni per la gestione dei prodotti nell'applicazione ArtigianatoShop.
  - Tutte le chiamate sono indirizzate alle API REST del backend, utilizzando fetchWithAuth per autenticazione e gestione token dove necessario.
  - Le funzioni permettono: recupero, creazione, aggiornamento, eliminazione prodotti, ricerca, best seller e prodotti per artigiano.
  - Le scelte tecniche privilegiano la modularità e la separazione delle responsabilità: la logica di gestione prodotti è centralizzata qui.
  - Tutte le chiamate sono protette da error handling robusto e restituiscono dati già pronti per l'uso nei componenti frontend.
  - Le rotte e i payload sono allineati con la documentazione Swagger del backend.
  - Ogni funzione è documentata inline per chiarire parametri, comportamento e possibili errori.
*/

import { fetchWithAuth } from '../js/services/fetchWithAuth.js';
import { getApiUrl } from './config.js';
import { authService } from '../js/services/authService.js';

const API_URL = getApiUrl();

/**
 * Ottiene la lista dei prodotti con filtri e paginazione.
 * @param {object} [params={}] - Parametri di filtro e paginazione (page, limit, search, category, artisan, minPrice, maxPrice).
 * @returns {Promise<object>} Lista di prodotti e dati di paginazione.
 * @throws {Error} Se la richiesta fallisce.
 */
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

/**
 * Ottiene i dettagli di un singolo prodotto.
 * @param {number|string} id - ID del prodotto.
 * @returns {Promise<object>} Dati del prodotto.
 * @throws {Error} Se la richiesta fallisce.
 */
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

/**
 * Crea un nuovo prodotto (richiede autenticazione).
 * @param {object} productData - Dati del prodotto da creare.
 * @returns {Promise<object>} Prodotto creato.
 * @throws {Error} Se la richiesta fallisce o l'utente non è autenticato.
 */
async function createProduct(productData) {
    try {
        const token = authService.getToken();
        if (!token) {
            throw new Error('Utente non autenticato');
        }
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

/**
 * Aggiorna un prodotto esistente (richiede autenticazione).
 * @param {number|string} id - ID del prodotto.
 * @param {object} productData - Dati aggiornati del prodotto.
 * @returns {Promise<object>} Prodotto aggiornato.
 * @throws {Error} Se la richiesta fallisce o l'utente non è autenticato.
 */
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

/**
 * Elimina un prodotto esistente (richiede autenticazione).
 * @param {number|string} id - ID del prodotto.
 * @returns {Promise<boolean>} True se eliminazione avvenuta.
 * @throws {Error} Se la richiesta fallisce o l'utente non è autenticato.
 */
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

/**
 * Ottiene tutti i prodotti di un artigiano specifico (pubblica).
 * @param {number|string} artisanId - ID dell'artigiano.
 * @param {object} [params={}] - Parametri di filtro e paginazione.
 * @returns {Promise<object>} Lista di prodotti dell'artigiano.
 * @throws {Error} Se la richiesta fallisce.
 */
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

/**
 * Cerca prodotti per nome (per i suggerimenti della navbar).
 * @param {string} searchTerm - Testo da cercare.
 * @param {number} [limit=5] - Numero massimo di risultati.
 * @returns {Promise<object>} Lista di prodotti trovati.
 * @throws {Error} Se la richiesta fallisce.
 */
async function searchProducts(searchTerm, limit = 5) {
    return getProducts({ search: searchTerm, limit: limit, page: 1 });
}

/**
 * Ottiene i prodotti più acquistati (best seller).
 * @param {number} [limit=10] - Numero massimo di prodotti da restituire.
 * @returns {Promise<object>} Lista di best seller.
 * @throws {Error} Se la richiesta fallisce.
 */
async function getBestSellerProducts(limit = 10) {
    try {
        const response = await fetch(`${API_URL}/products/best-sellers?limit=${limit}`);
        if (!response.ok) throw new Error('Errore nel recupero dei best seller');
        return await response.json();
    } catch (error) {
        console.error('Errore:', error);
        throw error;
    }
}

export {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByArtisan,
    searchProducts,
    getBestSellerProducts
}; 