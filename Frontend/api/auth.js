const API_BASE_URL = 'http://localhost:3005';

export class ApiService {
    static async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
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
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
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
} 