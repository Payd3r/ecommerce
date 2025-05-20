import { authService } from '../js/services/authService.js';
import { fetchWithAuth } from '../js/services/fetchWithAuth.js';
import { getApiUrl } from './config.js';

const API_URL = getApiUrl();

// Ottieni tutte le segnalazioni (paginato)
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

// Aggiorna una segnalazione
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

// Elimina una segnalazione
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

// Crea una nuova segnalazione
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

