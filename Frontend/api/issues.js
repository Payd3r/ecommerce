/*
  issues.js
  -----------------------------
  Questo modulo fornisce funzioni per la gestione delle segnalazioni (issues) nell'applicazione Pane e Salame.
  - Tutte le chiamate sono indirizzate alle API REST del backend, utilizzando fetchWithAuth per autenticazione e gestione token.
  - Le funzioni permettono: recupero, creazione, aggiornamento e cancellazione delle segnalazioni.
  - Le scelte tecniche privilegiano la modularità e la separazione delle responsabilità: la logica di gestione issues è centralizzata qui.
  - Tutte le chiamate sono protette da error handling robusto e restituiscono dati già pronti per l'uso nei componenti frontend.
  - Le rotte e i payload sono allineati con la documentazione Swagger del backend.
  - Ogni funzione è documentata inline per chiarire parametri, comportamento e possibili errori.
*/

import { authService } from '../js/services/authService.js';
import { fetchWithAuth } from '../js/services/fetchWithAuth.js';
import { getApiUrl } from './config.js';

const API_URL = getApiUrl();

/**
 * Ottiene tutte le segnalazioni (paginato).
 * @param {number} [page=1] - Numero della pagina.
 * @param {number} [pageSize=10] - Numero di segnalazioni per pagina.
 * @returns {Promise<object>} Risposta del server con lista e totale segnalazioni.
 * @throws {Error} Se la richiesta fallisce o il token non è presente.
 */
export async function getIssues(page = 1, pageSize = 10) {
    const token = authService.getToken();
    if (!token) throw new Error('Token di accesso non trovato');
    const res = await fetchWithAuth(`${API_URL}/issues?page=${page}&pageSize=${pageSize}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) throw new Error('Errore nel recupero delle segnalazioni');
    return await res.json();
}

/**
 * Aggiorna una segnalazione esistente.
 * @param {object} issue - Oggetto issue con i dati aggiornati (deve contenere id_issue).
 * @returns {Promise<object>} Risposta del server con i dati aggiornati.
 * @throws {Error} Se la richiesta fallisce o il token non è presente.
 */
export async function updateIssue(issue) {
    const token = authService.getToken();
    if (!token) throw new Error('Token di accesso non trovato');
    const res = await fetchWithAuth(`${API_URL}/issues/${issue.id_issue}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(issue)
    });
    if (!res.ok) {
        let err = {};
        try { err = await res.json(); } catch { }
        throw new Error(err.error || 'Errore nell\'aggiornamento della segnalazione');
    }
    return await res.json();
}

/**
 * Elimina una segnalazione esistente.
 * @param {number|string} issueId - ID della segnalazione da eliminare.
 * @returns {Promise<boolean>} True se l'eliminazione ha successo.
 * @throws {Error} Se la richiesta fallisce o il token non è presente.
 */
export async function deleteIssue(issueId) {
    const token = authService.getToken();
    if (!token) throw new Error('Token di accesso non trovato');
    const res = await fetchWithAuth(`${API_URL}/issues/${issueId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!res.ok) {
        let err = {};
        try { err = await res.json(); } catch { }
        throw new Error(err.error || 'Errore nell\'eliminazione della segnalazione');
    }
    return true;
}

/**
 * Crea una nuova segnalazione.
 * @param {object} issueData - Oggetto con i dati della segnalazione (title, description, ecc.).
 * @returns {Promise<object>} Risposta del server con i dati della segnalazione creata.
 * @throws {Error} Se la richiesta fallisce.
 */
export async function createIssue(issueData) {
    let headers = {
        'Content-Type': 'application/json'
    };
    const token = authService.getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const fetchFn = token ? fetchWithAuth : fetch;
    const res = await fetchFn(`${API_URL}/issues`, {
        method: 'POST',
        headers,
        body: JSON.stringify(issueData)
    });
    if (!res.ok) {
        let err = {};
        try { err = await res.json(); } catch { }
        throw new Error(err.error || 'Errore nella creazione della segnalazione');
    }
    return await res.json();
}

