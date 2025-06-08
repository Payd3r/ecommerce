/*
  orders.js
  -----------------------------
  Questo modulo fornisce funzioni per la gestione degli ordini nell'applicazione Pane e Salame.
  - Tutte le chiamate sono indirizzate alle API REST del backend, utilizzando fetchWithAuth per autenticazione e gestione token.
  - Le funzioni permettono: recupero, creazione, checkout, aggiornamento stato, eliminazione ordini, statistiche e pagamenti.
  - Le scelte tecniche privilegiano la modularità e la separazione delle responsabilità: la logica di gestione ordini è centralizzata qui.
  - Tutte le chiamate sono protette da error handling robusto e restituiscono dati già pronti per l'uso nei componenti frontend.
  - Le rotte e i payload sono allineati con la documentazione Swagger del backend.
  - Ogni funzione è documentata inline per chiarire parametri, comportamento e possibili errori.
*/

import { authService } from '../js/services/authService.js';
import { fetchWithAuth } from '../js/services/fetchWithAuth.js';
import { getApiUrl } from './config.js';

const API_URL = getApiUrl();

/**
 * Ottiene tutti gli ordini (solo per admin).
 * @returns {Promise<object>} Lista di ordini.
 * @throws {Error} Se la richiesta fallisce o il token non è presente.
 */
export async function getAllOrders() {
    const token = authService.getToken();
    if (!token) throw new Error('Token di accesso non trovato');
    const res = await fetchWithAuth(`${API_URL}/orders`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Errore nel recupero degli ordini');
    return await res.json();
}

/**
 * Ottiene tutti gli ordini (solo per admin o test).
 * @returns {Promise<object>} Lista di ordini.
 * @throws {Error} Se la richiesta fallisce o il token non è presente.
 */
export async function getOrders() {
    const token = authService.getToken();
    if (!token) throw new Error('Token di accesso non trovato');
    const res = await fetchWithAuth(`${API_URL}/orders`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Errore nel recupero degli ordini');
    return await res.json();
}

/**
 * Crea un nuovo ordine.
 * @param {object} orderData - Dati dell'ordine.
 * @returns {Promise<object>} Ordine creato.
 * @throws {Error} Se la richiesta fallisce.
 */
export async function createOrder(orderData) {
    const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    });
    if (!res.ok) throw new Error('Errore nella creazione dell\'ordine');
    return await res.json();
}

/**
 * Checkout: crea ordine dal carrello dell'utente autenticato.
 * @param {number|string} userId - ID utente.
 * @param {string} [paymentIntentId] - ID intent di pagamento Stripe.
 * @returns {Promise<object>} Ordine creato.
 * @throws {Error} Se la richiesta fallisce o il token non è presente.
 */
export async function checkoutOrder(userId, paymentIntentId) {
    if (!userId) throw new Error('userId mancante');
    const token = authService.getToken();
    if (!token) throw new Error('Token di accesso non trovato');
    const body = { userId };
    if (paymentIntentId) body.paymentIntentId = paymentIntentId;
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
    };
    const res = await fetchWithAuth(`${API_URL}/orders/checkout`, options);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Errore nel checkout');
    }
    return await res.json();
}

/**
 * Ottiene tutti gli ordini relativi ai prodotti di un artigiano.
 * @param {number|string} artisanId - ID artigiano.
 * @returns {Promise<object>} Lista di ordini.
 * @throws {Error} Se la richiesta fallisce.
 */
export async function getOrdersByArtisan(artisanId) {
    const res = await fetch(`${API_URL}/orders/by-artisan/${artisanId}`);
    if (!res.ok) throw new Error('Errore nel recupero degli ordini per artigiano');
    return await res.json();
}

/**
 * Ottiene le vendite mensili per artigiano.
 * @param {number|string} artisanId - ID artigiano.
 * @returns {Promise<object>} Statistiche vendite.
 * @throws {Error} Se la richiesta fallisce.
 */
export async function getMonthlySalesByArtisan(artisanId) {
    const res = await fetch(`${API_URL}/orders/stats/sales?artisanId=${artisanId}`);
    if (!res.ok) throw new Error('Errore nel recupero delle vendite mensili');
    return await res.json();
}

/**
 * Ottiene il numero di ordini mensili per artigiano.
 * @param {number|string} artisanId - ID artigiano.
 * @returns {Promise<object>} Statistiche ordini.
 * @throws {Error} Se la richiesta fallisce.
 */
export async function getMonthlyOrdersByArtisan(artisanId) {
    const res = await fetch(`${API_URL}/orders/stats/orders?artisanId=${artisanId}`);
    if (!res.ok) throw new Error('Errore nel recupero del numero ordini mensili');
    return await res.json();
}

/**
 * Ottiene gli order items di un ordine specifico.
 * @param {number|string} orderId - ID ordine.
 * @returns {Promise<object>} Lista di order items.
 * @throws {Error} Se la richiesta fallisce.
 */
export async function getOrderItems(orderId) {
    const token = authService.getToken();
    if (!token) throw new Error('Token di accesso non trovato');
    const res = await fetch(`${API_URL}/orders/${orderId}/items`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Errore nel recupero degli order items');
    return await res.json();
}

/**
 * Ottiene ordini filtrati e paginati per artigiano.
 * @param {number|string} artisanId - ID artigiano.
 * @param {object} params - Parametri di filtro e paginazione.
 * @returns {Promise<object>} Lista di ordini filtrati.
 * @throws {Error} Se la richiesta fallisce.
 */
export async function getFilteredOrdersByArtisan(artisanId, params = {}) {
    const queryParams = new URLSearchParams();
    if (params.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.status) queryParams.append('status', params.status);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    const res = await fetch(`${API_URL}/by-artisan/${artisanId}/filtered?${queryParams}`);
    if (!res.ok) throw new Error('Errore nel recupero degli ordini filtrati');
    return await res.json();
}

/**
 * Ottiene tutti gli ordini di un client.
 * @param {number|string} clientId - ID client.
 * @returns {Promise<object>} Lista di ordini.
 * @throws {Error} Se la richiesta fallisce o il token non è presente.
 */
export async function getOrdersByClient(clientId) {
    const token = authService.getToken();
    if (!token) throw new Error('Token di accesso non trovato');
    const res = await fetchWithAuth(`${API_URL}/orders?clientId=${clientId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Errore nel recupero degli ordini del cliente');
    return await res.json();
}

/**
 * Elimina un ordine (admin).
 * @param {number|string} orderId - ID ordine.
 * @returns {Promise<boolean>} True se eliminazione avvenuta.
 * @throws {Error} Se la richiesta fallisce o il token non è presente.
 */
export async function deleteOrder(orderId) {
    const token = authService.getToken();
    if (!token) throw new Error('Token di accesso non trovato');
    const res = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) {
        let err = {};
        try { err = await res.json(); } catch {}
        throw new Error(err.error || 'Errore nell\'eliminazione dell\'ordine');
    }
    return true;
}

/**
 * Aggiorna lo stato di un ordine (admin).
 * @param {number|string} orderId - ID ordine.
 * @param {string} status - Nuovo stato.
 * @returns {Promise<object>} Ordine aggiornato.
 * @throws {Error} Se la richiesta fallisce o il token non è presente.
 */
export async function updateOrderStatus(orderId, status) {
    const token = authService.getToken();
    if (!token) throw new Error('Token di accesso non trovato');
    const res = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
    });
    if (!res.ok) {
        let err = {};
        try { err = await res.json(); } catch {}
        throw new Error(err.error || 'Errore nell\'aggiornamento dello stato ordine');
    }
    return await res.json();
}

/**
 * Recupera i dati di spedizione (address) di un utente dato il suo userId.
 * @param {number|string} userId - ID utente.
 * @returns {Promise<object>} Dati di spedizione.
 * @throws {Error} Se la richiesta fallisce o il token non è presente.
 */
export async function getAddressByUserId(userId) {
    const token = authService.getToken();
    if (!token) throw new Error('Token di accesso non trovato');
    const res = await fetchWithAuth(`${API_URL}/address/user/${userId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Errore nel recupero dati spedizione');
    const data = await res.json();
    return data.data;
}

/**
 * Crea una PaymentIntent Stripe per il carrello dell'utente.
 * @param {number|string} userId - ID utente.
 * @returns {Promise<object>} Dati PaymentIntent.
 * @throws {Error} Se la richiesta fallisce o il token non è presente.
 */
export async function createPaymentIntent(userId) {
    if (!userId) throw new Error('userId mancante');
    const token = authService.getToken();
    if (!token) throw new Error('Token di accesso non trovato');
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
    };
    const res = await fetchWithAuth(`${API_URL}/orders/create-payment-intent`, options);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Errore nella creazione del pagamento');
    }
    return await res.json();
}
