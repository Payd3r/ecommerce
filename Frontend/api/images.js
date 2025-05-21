import { authService } from '../js/services/authService.js';
import { getApiUrl } from './config.js';

const API_URL = getApiUrl();
// Funzione per upload immagini prodotto
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

// Funzione per upload immagini categoria
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

// Funzione per upload immagine profilo (una sola)
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

// Funzione per eliminare immagini di prodotto
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

// Funzione per upload banner artigiano (una sola)
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
