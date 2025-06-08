/*
  auth.js
  -----------------------------
  Questo modulo fornisce un'API client-side per la gestione dell'autenticazione e del profilo utente nell'applicazione Pane e Salame.
  - Tutte le chiamate sono indirizzate alle API REST del backend tramite fetchWithAuth, che gestisce token e headers.
  - Le funzioni statiche della classe ApiService permettono: login, registrazione, recupero e aggiornamento profilo, gestione indirizzo, aggiornamento bio artigiano e upload banner.
  - Le scelte tecniche privilegiano la modularità e la separazione delle responsabilità: la logica di autenticazione è centralizzata qui, mentre la gestione del token è delegata ad authService.
  - Tutte le chiamate sono protette da error handling robusto e restituiscono dati già pronti per l'uso nei componenti frontend.
  - Le rotte e i payload sono allineati con la documentazione Swagger del backend.
  - Questo file è pensato per essere facilmente estendibile con nuove funzionalità di autenticazione o gestione utente.
  - Ogni funzione è documentata inline per chiarire parametri, comportamento e possibili errori.
*/
import { authService } from '../js/services/authService.js';
import { fetchWithAuth } from '../js/services/fetchWithAuth.js';
import { getApiUrl } from './config.js';

const API_URL = getApiUrl();

export class ApiService {
    /**
     * Effettua il login dell'utente.
     * @param {string} email - Email dell'utente.
     * @param {string} password - Password dell'utente.
     * @returns {Promise<{token: string, user: object}>} Token JWT e dati utente se il login ha successo.
     * @throws {Error} Se le credenziali sono errate o la richiesta fallisce.
     */
    static async login(email, password) {
        try {
            const response = await fetchWithAuth(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            console.log('Risposta server login:', data);
            console.log('Struttura user:', data.data?.user);
            if (data.success) {
                return {
                    token: data.data.token,
                    user: data.data.user
                };
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Errore durante il login:', error);
            throw error;
        }
    }

    /**
     * Registra un nuovo utente.
     * @param {string} name - Nome dell'utente.
     * @param {string} email - Email dell'utente.
     * @param {string} password - Password scelta.
     * @param {string} role - Ruolo dell'utente (es. 'client' o 'artisan').
     * @returns {Promise<{token: string, user: object}>} Token JWT e dati utente se la registrazione ha successo.
     * @throws {Error} Se la registrazione fallisce o i dati non sono validi.
     */
    static async register(name, email, password, role) {
        try {
            const response = await fetchWithAuth(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    name,
                    role
                })
            });
            const data = await response.json();
            if (data.success) {
                return {
                    token: data.data.token,
                    user: data.data.user
                };
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Errore durante la registrazione:', error);
            throw error;
        }
    }

    /**
     * Recupera il profilo dell'utente autenticato.
     * @returns {Promise<object>} Dati del profilo utente.
     * @throws {Error} Se la richiesta fallisce o il token non è valido.
     */
    static async getProfile() {
        try {
            const token = authService.getToken();
            const response = await fetchWithAuth(`${API_URL}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                return data.data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Errore durante il recupero del profilo:', error);
            throw error;
        }
    }

    /**
     * Recupera l'indirizzo dell'utente autenticato.
     * @returns {Promise<object>} Dati dell'indirizzo.
     * @throws {Error} Se la richiesta fallisce o il token non è valido.
     */
    static async getAddress() {
        try {
            const token = authService.getToken();
            const response = await fetchWithAuth(`${API_URL}/address/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                return data.data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Errore durante il recupero dell\'indirizzo:', error);
            throw error;
        }
    }

    /**
     * Salva o aggiorna l'indirizzo dell'utente autenticato.
     * @param {object} address - Oggetto con i dati dell'indirizzo.
     * @returns {Promise<object>} Dati dell'indirizzo salvato.
     * @throws {Error} Se la richiesta fallisce o i dati non sono validi.
     */
    static async saveAddress(address) {
        try {
            const token = authService.getToken();
            const response = await fetchWithAuth(`${API_URL}/address`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(address)
            });
            const data = await response.json();
            if (data.success) {
                return data.data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Errore durante il salvataggio dell\'indirizzo:', error);
            throw error;
        }
    }

    /**
     * Aggiorna il profilo dell'utente (nickname, email).
     * @param {object} param0 - Oggetto con i dati da aggiornare.
     * @param {string} param0.nickname - Nuovo nickname.
     * @param {string} param0.email - Nuova email.
     * @returns {Promise<object>} Dati aggiornati del profilo.
     * @throws {Error} Se la richiesta fallisce o i dati non sono validi.
     */
    static async updateProfile({ nickname, email }) {
        try {
            const token = authService.getToken();
            const response = await fetchWithAuth(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nickname, email })
            });
            const data = await response.json();
            if (data.success) {
                return data.data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Errore durante l\'aggiornamento del profilo:', error);
            throw error;
        }
    }

    /**
     * Aggiorna la bio dell'artigiano autenticato.
     * @param {object} param0 - Oggetto con la bio.
     * @param {string} param0.bio - Nuova bio.
     * @returns {Promise<object>} Risposta del server.
     * @throws {Error} Se la richiesta fallisce o la bio non è valida.
     */
    static async updateArtisanBio({ bio }) {
        const token = authService.getToken();
        const response = await fetchWithAuth(`${API_URL}/auth/artisan/bio`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ bio })
        });
        const data = await response.json();
        if (data.success) return data;
        throw new Error(data.message);
    }

    /**
     * Carica un nuovo banner per l'artigiano.
     * @param {number|string} userId - ID dell'utente artigiano.
     * @param {File} file - File immagine banner da caricare.
     * @returns {Promise<object>} Risposta del server con URL del banner.
     * @throws {Error} Se la richiesta fallisce o il file non è valido.
     */
    static async uploadArtisanBanner(userId, file) {
        const formData = new FormData();
        formData.append('banner', file);
        const token = authService.getToken();
        const res = await fetch(`${API_URL}/auth/artisan/banner`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        });
        const data = await res.json();
        if (data.success) return data;
        throw new Error(data.message);
    }
} 