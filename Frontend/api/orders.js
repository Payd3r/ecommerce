const API_URL = '/orders';

// Ottieni tutti gli ordini (solo per admin o test)
export async function getAllOrders() {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Errore nel recupero degli ordini');
    return await res.json();
}

// Crea un nuovo ordine
export async function createOrder(orderData) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    });
    if (!res.ok) throw new Error('Errore nella creazione dell\'ordine');
    return await res.json();
}

// Ottieni tutti gli ordini relativi ai prodotti di un artigiano
export async function getOrdersByArtisan(artisanId) {
    const res = await fetch(`${API_URL}/by-artisan/${artisanId}`);
    if (!res.ok) throw new Error('Errore nel recupero degli ordini per artigiano');
    return await res.json();
}

// Ottieni le vendite mensili per artigiano
export async function getMonthlySalesByArtisan(artisanId) {
    const res = await fetch(`/orders/stats/sales?artisanId=${artisanId}`);
    if (!res.ok) throw new Error('Errore nel recupero delle vendite mensili');
    return await res.json();
}

// Ottieni il numero di ordini mensili per artigiano
export async function getMonthlyOrdersByArtisan(artisanId) {
    const res = await fetch(`/orders/stats/orders?artisanId=${artisanId}`);
    if (!res.ok) throw new Error('Errore nel recupero del numero ordini mensili');
    return await res.json();
}

// Ottieni gli order items di un ordine specifico
export async function getOrderItems(orderId) {
    const res = await fetch(`${API_URL}/${orderId}/items`);
    if (!res.ok) throw new Error('Errore nel recupero degli order items');
    return await res.json();
}

// Ottieni ordini filtrati e paginati per artigiano
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
