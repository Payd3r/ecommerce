const API_URL = 'http://localhost:3005';

export async function getIssues(page = 1, pageSize = 10) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/issues?page=${page}&pageSize=${pageSize}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Errore nel recupero delle segnalazioni');
    return await res.json();
}
