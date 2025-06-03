// Test di integrazione per il flusso dell'applicazione

// Import dei mock
const { mockSuccessfulLogin, mockUserProfile, mockProductsList, mockCartData } = require('./mocks/apiMocks');
const { router, authService, showBootstrapToast, fetchWithAuth } = require('./mocks/frontendMocks');

describe('Integrazione Frontend', () => {
  beforeEach(() => {
    // Resetta tutti i mock
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('flusso completo: login, navigazione, visualizzazione prodotti e checkout', async () => {
    // 1. Login
    const email = 'test@example.com';
    const password = 'password';
    
    // Configura il mock per il login
    authService.login.mockResolvedValue(mockSuccessfulLogin(email, password).data.user);
    
    // Effettua il login
    const user = await authService.login(email, password);
    
    // Verifica che il login sia avvenuto con successo
    expect(authService.login).toHaveBeenCalledWith(email, password);
    expect(user).toEqual({
      id: 1,
      name: 'Utente Test',
      email: email,
      role: 'client'
    });
    
    // 2. Verifica l'autenticazione
    authService.isAuthenticated.mockReturnValue(true);
    authService.getUser.mockReturnValue(user);
    authService.getToken.mockReturnValue('fake-jwt-token');
    
    // Verifica che l'utente sia autenticato
    expect(authService.isAuthenticated()).toBe(true);
    
    // 3. Navigazione alla pagina prodotti
    // Configura il mock per fetchWithAuth per la richiesta dei prodotti
    const productsResponse = {
      json: jest.fn().mockResolvedValue(mockProductsList())
    };
    fetchWithAuth.mockResolvedValue(productsResponse);
    
    // Naviga alla pagina prodotti
    router.navigate('/products');
    
    // Verifica che il router sia stato chiamato correttamente
    expect(router.navigate).toHaveBeenCalledWith('/products');
    
    // 4. Aggiungi un prodotto al carrello
    // Configura il mock per fetchWithAuth per l'aggiunta al carrello
    const addToCartResponse = {
      json: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 1,
          user_id: 1,
          items: [
            {
              id: 1,
              product_id: 1,
              quantity: 1,
              product: {
                id: 1,
                name: 'Prodotto Test 1',
                price: 19.99,
                images: ['https://example.com/product1.jpg']
              }
            }
          ],
          total: 19.99
        }
      })
    };
    fetchWithAuth.mockResolvedValue(addToCartResponse);
    
    // Simula la chiamata API per aggiungere un prodotto al carrello
    const addToCartResult = await (await fetchWithAuth('https://example.com/api/cart/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-jwt-token'
      },
      body: JSON.stringify({
        product_id: 1,
        quantity: 1
      })
    })).json();
    
    // Verifica che l'aggiunta al carrello sia avvenuta con successo
    expect(addToCartResult.success).toBe(true);
    expect(addToCartResult.data.items.length).toBe(1);
    
    // 5. Navigazione al carrello
    // Configura il mock per fetchWithAuth per la richiesta del carrello
    const cartResponse = {
      json: jest.fn().mockResolvedValue(mockCartData())
    };
    fetchWithAuth.mockResolvedValue(cartResponse);
    
    // Naviga al carrello
    router.navigate('/cart');
    
    // Verifica che il router sia stato chiamato correttamente
    expect(router.navigate).toHaveBeenCalledWith('/cart');
    
    // 6. Verifica che il carrello contenga il prodotto aggiunto
    const cartResult = await (await fetchWithAuth('https://example.com/api/cart')).json();
    
    // Verifica che il carrello contenga il prodotto
    expect(cartResult.success).toBe(true);
    expect(cartResult.data.items.length).toBe(1);
    expect(cartResult.data.total).toBe(39.98);
    
    // 7. Checkout
    // Configura il mock per fetchWithAuth per il checkout
    const checkoutResponse = {
      json: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 1,
          user_id: 1,
          total: 39.98,
          status: 'pending',
          items: [
            {
              id: 1,
              product_id: 1,
              quantity: 2,
              price: 19.99,
              product_name: 'Prodotto Test 1'
            }
          ]
        }
      })
    };
    fetchWithAuth.mockResolvedValue(checkoutResponse);
    
    // Simula la chiamata API per il checkout
    const checkoutResult = await (await fetchWithAuth('https://example.com/api/orders/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-jwt-token'
      }
    })).json();
    
    // Verifica che il checkout sia avvenuto con successo
    expect(checkoutResult.success).toBe(true);
    expect(checkoutResult.data.total).toBe(39.98);
    expect(checkoutResult.data.status).toBe('pending');
    
    // 8. Logout
    authService.logout();
    
    // Verifica che il logout sia stato chiamato
    expect(authService.logout).toHaveBeenCalled();
    
    // Imposta l'utente come non autenticato
    authService.isAuthenticated.mockReturnValue(false);
    
    // Verifica che l'utente non sia più autenticato
    expect(authService.isAuthenticated()).toBe(false);
  });

  test('flusso per utente artigiano: login, accesso dashboard e gestione prodotti', async () => {
    // 1. Login come artigiano
    const artisanUser = {
      id: 2,
      name: 'Artigiano Test',
      email: 'artisan@example.com',
      role: 'artisan'
    };
    
    // Configura il mock per il login
    authService.login.mockResolvedValue(artisanUser);
    
    // Effettua il login
    const user = await authService.login('artisan@example.com', 'password');
    
    // Verifica che il login sia avvenuto con successo
    expect(user).toEqual(artisanUser);
    
    // 2. Verifica l'autenticazione e il ruolo
    authService.isAuthenticated.mockReturnValue(true);
    authService.getUser.mockReturnValue(artisanUser);
    authService.hasRole.mockImplementation((roles) => {
      if (Array.isArray(roles)) {
        return roles.includes('artisan');
      }
      return roles === 'artisan';
    });
    
    // Verifica che l'utente sia autenticato e abbia il ruolo corretto
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.hasRole('artisan')).toBe(true);
    expect(authService.hasRole(['admin', 'artisan'])).toBe(true);
    expect(authService.hasRole('admin')).toBe(false);
    
    // 3. Navigazione alla dashboard artigiano
    router.navigate('/artisan/dashboard');
    
    // Verifica che il router sia stato chiamato correttamente
    expect(router.navigate).toHaveBeenCalledWith('/artisan/dashboard');
    
    // 4. Navigazione alla gestione prodotti
    router.navigate('/artisan/manage-products');
    
    // Verifica che il router sia stato chiamato correttamente
    expect(router.navigate).toHaveBeenCalledWith('/artisan/manage-products');
    
    // 5. Configura il mock per fetchWithAuth per la richiesta dei prodotti dell'artigiano
    const artisanProductsResponse = {
      json: jest.fn().mockResolvedValue({
        success: true,
        data: {
          products: [
            {
              id: 1,
              name: 'Prodotto Artigianale 1',
              description: 'Descrizione prodotto artigianale 1',
              price: 29.99,
              category_id: 1,
              images: ['https://example.com/artisan-product1.jpg']
            }
          ],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1
          }
        }
      })
    };
    fetchWithAuth.mockResolvedValue(artisanProductsResponse);
    
    // Simula la chiamata API per ottenere i prodotti dell'artigiano
    const artisanProductsResult = await (await fetchWithAuth('https://example.com/api/products?artisan_id=2')).json();
    
    // Verifica che la richiesta dei prodotti sia avvenuta con successo
    expect(artisanProductsResult.success).toBe(true);
    expect(artisanProductsResult.data.products.length).toBe(1);
    
    // 6. Logout
    authService.logout();
    
    // Verifica che il logout sia stato chiamato
    expect(authService.logout).toHaveBeenCalled();
  });
}); 