import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Definizione metriche personalizzate
const authenticationErrors = new Counter('authentication_errors');
const cartRequestDuration = new Trend('cart_request_duration');
const productRequestDuration = new Trend('product_request_duration');

// Configurazione del test
export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp-up a 10 utenti in 1 minuto
    { duration: '3m', target: 50 },  // Ramp-up a 50 utenti in 3 minuti
    { duration: '2m', target: 50 },  // Mantieni 50 utenti per 2 minuti
    { duration: '1m', target: 0 },   // Ramp-down a 0 utenti in 1 minuto
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% delle richieste devono completarsi in meno di 2s
    http_req_failed: ['rate<0.05'],    // Meno del 5% delle richieste possono fallire
    'cart_request_duration': ['p(95)<1500'], // 95% delle richieste al carrello in meno di 1.5s
    'product_request_duration': ['p(95)<1000'], // 95% delle richieste ai prodotti in meno di 1s
  },
};

// URL di base dell'API
const BASE_URL = 'http://localhost:3015';
// Token di autenticazione di esempio (da generare dinamicamente in scenari reali)
let authToken = '';

// Funzione principale del test
export default function() {
  // Dati utente di test
  const testUser = {
    email: 'test@example.com',
    password: 'password123'
  };

  group('Login e Autenticazione', function() {
    // Esegui login per ottenere token
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(testUser), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(loginRes, {
      'login riuscito': (r) => r.status === 200,
      'token ricevuto': (r) => JSON.parse(r.body).data && JSON.parse(r.body).data.token,
    }) || authenticationErrors.add(1);

    if (loginRes.status === 200) {
      const body = JSON.parse(loginRes.body);
      if (body.data && body.data.token) {
        authToken = body.data.token;
      }
    }
    
    sleep(1);
  });

  // Simulazione carico sulle API dei prodotti
  group('Prodotti API', function() {
    // Test lista prodotti
    const productsStart = new Date();
    const productsRes = http.get(`${BASE_URL}/products`);
    productRequestDuration.add(new Date() - productsStart);
    
    check(productsRes, {
      'prodotti caricati correttamente': (r) => r.status === 200,
      'risposta contiene prodotti': (r) => Array.isArray(JSON.parse(r.body).data),
    });
    
    // Test dettaglio prodotto
    if (productsRes.status === 200) {
      const products = JSON.parse(productsRes.body).data;
      if (products && products.length > 0) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const productDetailStart = new Date();
        const productDetailRes = http.get(`${BASE_URL}/products/${randomProduct.id}`);
        productRequestDuration.add(new Date() - productDetailStart);
        
        check(productDetailRes, {
          'dettaglio prodotto caricato': (r) => r.status === 200,
          'dettaglio prodotto contiene dati': (r) => JSON.parse(r.body).data && JSON.parse(r.body).data.id,
        });
      }
    }
    
    sleep(1);
  });

  // Simulazione carico sulle API del carrello
  group('Carrello API', function() {
    if (authToken) {
      // Ottieni carrello
      const cartStart = new Date();
      const cartRes = http.get(`${BASE_URL}/cart`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      cartRequestDuration.add(new Date() - cartStart);
      
      check(cartRes, {
        'carrello caricato': (r) => r.status === 200,
      });
      
      // Aggiungi prodotto al carrello
      const addToCartStart = new Date();
      const addToCartRes = http.post(`${BASE_URL}/cart/items`, 
        JSON.stringify({ product_id: 1, quantity: 1 }), 
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}` 
          },
        }
      );
      cartRequestDuration.add(new Date() - addToCartStart);
      
      check(addToCartRes, {
        'prodotto aggiunto al carrello': (r) => r.status === 200,
      });
    }
    
    sleep(1);
  });

  // Simulazione carico sulle API delle categorie
  group('Categorie API', function() {
    const categoriesRes = http.get(`${BASE_URL}/categories`);
    
    check(categoriesRes, {
      'categorie caricate': (r) => r.status === 200,
    });
    
    sleep(1);
  });

  // Simulazione carico sulle API degli ordini
  group('Ordini API', function() {
    if (authToken) {
      const ordersRes = http.get(`${BASE_URL}/orders?clientId=1`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      
      check(ordersRes, {
        'ordini caricati': (r) => r.status === 200,
      });
    }
    
    sleep(1);
  });
} 