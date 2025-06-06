/*
  images.js
  -----------------------------
  Questo modulo fornisce funzioni per la gestione delle immagini (upload e cancellazione) nell'applicazione Pane e Salame.
  - Tutte le chiamate sono indirizzate alle API REST del backend, utilizzando FormData per l'upload e JSON per la cancellazione.
  - Le funzioni permettono: upload immagini prodotto, categoria, profilo, banner artigiano e cancellazione immagini prodotto.
  - Le scelte tecniche privilegiano la modularità e la separazione delle responsabilità: la logica di gestione immagini è centralizzata qui.
  - Tutte le chiamate sono protette da error handling robusto e restituiscono dati già pronti per l'uso nei componenti frontend.
  - Le rotte e i payload sono allineati con la documentazione Swagger del backend.
  - Ogni funzione è documentata inline per chiarire parametri, comportamento e possibili errori.
*/

import { authService } from '../js/services/authService.js';
import { getApiUrl } from './config.js';

const API_URL = getApiUrl();

/**
 * Carica una o più immagini per un prodotto.
 * @param {number|string} productId - ID del prodotto.
 * @param {FileList|File[]} files - Lista di file immagine da caricare.
 * @returns {Promise<object>} Risposta del server con i dettagli delle immagini caricate.
 * @throws {Error} Se la richiesta fallisce.
 */
export async function uploadProductImages(productId, files) {
    const formData = new FormData();
    formData.append('id', productId);
    for (const file of files) {
        formData.append('images', file);
    }
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/images/upload/product`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
    });
    if (!res.ok) throw new Error('Errore upload immagini prodotto');
    return await res.json();
}

/**
 * Carica una o più immagini per una categoria.
 * @param {number|string} categoryId - ID della categoria.
 * @param {FileList|File[]} files - Lista di file immagine da caricare.
 * @returns {Promise<object>} Risposta del server con i dettagli delle immagini caricate.
 * @throws {Error} Se la richiesta fallisce.
 */
export async function uploadCategoryImages(categoryId, files) {
    const formData = new FormData();
    formData.append('id', categoryId);
    for (const file of files) {
        formData.append('images', file);
    }
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/images/upload/category`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
    });
    if (!res.ok) throw new Error('Errore upload immagini categoria');
    return await res.json();
}

/**
 * Carica l'immagine profilo di un utente (una sola).
 * @param {number|string} userId - ID dell'utente.
 * @param {File} file - File immagine da caricare.
 * @returns {Promise<object>} Risposta del server con i dettagli dell'immagine caricata.
 * @throws {Error} Se la richiesta fallisce.
 */
export async function uploadProfileImage(userId, file) {
    const formData = new FormData();
    formData.append('id', userId);
    formData.append('image', file);
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/images/upload/profile`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
    });
    if (!res.ok) throw new Error('Errore upload immagine profilo');
    return await res.json();
}

/**
 * Elimina una o più immagini di un prodotto.
 * @param {number|string} productId - ID del prodotto.
 * @param {Array<number|string>} imageIds - Array di ID delle immagini da eliminare.
 * @returns {Promise<object>} Risposta del server sull'esito dell'operazione.
 * @throws {Error} Se la richiesta fallisce.
 */
export async function deleteProductImages(productId, imageIds) {
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/images/product/${productId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ imageIds })
    });
    if (!res.ok) throw new Error('Errore eliminazione immagini prodotto');
    return await res.json();
}

/**
 * Carica un nuovo banner per l'artigiano (una sola immagine).
 * @param {number|string} userId - ID dell'utente artigiano.
 * @param {File} file - File immagine banner da caricare.
 * @returns {Promise<object>} Risposta del server con i dettagli del banner caricato.
 * @throws {Error} Se la richiesta fallisce.
 */
export async function uploadBannerImage(userId, file) {
    const formData = new FormData();
    formData.append('id', userId);
    formData.append('banner', file);
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/images/upload/banner`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
    });
    if (!res.ok) throw new Error('Errore upload banner');
    return await res.json();
}
