import { authService } from '../js/services/authService.js';
import { fetchWithAuth } from '../js/services/fetchWithAuth.js';
import { getApiUrl } from './config.js';

const API_URL = getApiUrl();

export class ApiService {
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