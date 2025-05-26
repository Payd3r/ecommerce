const { test, expect } = require('@playwright/test');

// Test per la homepage
test('Homepage carica correttamente', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Verifica titolo della pagina
  await expect(page).toHaveTitle(/E-commerce Prodotti Artigianali/);
  
  // Verifica elementi principali
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
  await expect(page.locator('.product-grid')).toBeVisible();
  
  // Verifica che ci siano prodotti caricati
  const productCards = page.locator('.product-card');
  await expect(productCards).toHaveCount({ min: 1 });
});

// Test per la pagina di dettaglio prodotto
test('Pagina di dettaglio prodotto mostra le informazioni corrette', async ({ page }) => {
  // Navigazione alla pagina del prodotto
  await page.goto('http://localhost:3000/product.html?id=15');
  
  // Verifica che il titolo del prodotto sia visibile
  await expect(page.locator('.product-title')).toBeVisible();
  
  // Verifica che ci siano le immagini
  const productImages = page.locator('.product-image');
  await expect(productImages).toBeVisible();
  
  // Verifica che ci sia il prezzo
  await expect(page.locator('.product-price')).toBeVisible();
  
  // Verifica che ci sia il pulsante "Aggiungi al carrello"
  await expect(page.locator('.add-to-cart-btn')).toBeVisible();
  
  // Verifica che ci sia la descrizione del prodotto
  await expect(page.locator('.product-description')).toBeVisible();
});

// Test per la pagina di login
test('Pagina di login funziona correttamente', async ({ page }) => {
  await page.goto('http://localhost:3000/login.html');
  
  // Verifica che il form di login sia visibile
  await expect(page.locator('#login-form')).toBeVisible();
  
  // Compila il form
  await page.fill('input[name="email"]', 'antonio@example.com');
  await page.fill('input[name="password"]', 'password123');
  
  // Intercetta la chiamata di rete per il login
  await page.route('**/auth/login', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          token: 'test-token',
          user: {
            id: 46,
            name: 'Antonio',
            email: 'antonio@example.com',
            role: 'client'
          }
        }
      })
    });
  });
  
  // Invia il form
  await page.click('button[type="submit"]');
  
  // Dovrebbe essere reindirizzato alla home page dopo il login
  await expect(page).toHaveURL('http://localhost:3000/index.html');
});

// Test per la pagina del carrello
test('Pagina del carrello mostra i prodotti aggiunti', async ({ page }) => {
  // Prima effettua il login
  await page.goto('http://localhost:3000/login.html');
  await page.fill('input[name="email"]', 'antonio@example.com');
  await page.fill('input[name="password"]', 'password123');
  
  // Intercetta la chiamata di rete per il login
  await page.route('**/auth/login', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          token: 'test-token',
          user: {
            id: 46,
            name: 'Antonio',
            email: 'antonio@example.com',
            role: 'client'
          }
        }
      })
    });
  });
  
  await page.click('button[type="submit"]');
  
  // Intercetta la chiamata al carrello
  await page.route('**/cart', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: 11,
          items: [
            { 
              id: 50, 
              product_id: 27, 
              quantity: 2,
              product_name: 'Farina 00',
              product_price: 0.70,
              product_discount: 0
            },
            { 
              id: 51, 
              product_id: 21, 
              quantity: 3,
              product_name: 'Tagliata',
              product_price: 15.00,
              product_discount: 0
            }
          ]
        }
      })
    });
  });
  
  // Vai alla pagina del carrello
  await page.goto('http://localhost:3000/cart.html');
  
  // Verifica che gli elementi del carrello siano visibili
  await expect(page.locator('.cart-items')).toBeVisible();
  
  // Verifica che ci siano i prodotti nel carrello
  const cartItems = page.locator('.cart-item');
  await expect(cartItems).toHaveCount(2);
  
  // Verifica che ci sia il pulsante per procedere all'acquisto
  await expect(page.locator('#checkout-button')).toBeVisible();
});

// Test per la pagina di checkout
test('Pagina di checkout mostra il riepilogo dell\'ordine', async ({ page }) => {
  // Prima effettua il login
  await page.goto('http://localhost:3000/login.html');
  await page.fill('input[name="email"]', 'antonio@example.com');
  await page.fill('input[name="password"]', 'password123');
  
  // Intercetta la chiamata di rete per il login
  await page.route('**/auth/login', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          token: 'test-token',
          user: {
            id: 46,
            name: 'Antonio',
            email: 'antonio@example.com',
            role: 'client'
          }
        }
      })
    });
  });
  
  await page.click('button[type="submit"]');
  
  // Intercetta la chiamata al carrello
  await page.route('**/cart', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: 11,
          items: [
            { 
              id: 50, 
              product_id: 27, 
              quantity: 2,
              product_name: 'Farina 00',
              product_price: 0.70,
              product_discount: 0
            },
            { 
              id: 51, 
              product_id: 21, 
              quantity: 3,
              product_name: 'Tagliata',
              product_price: 15.00,
              product_discount: 0
            }
          ]
        }
      })
    });
  });
  
  // Intercetta la chiamata agli indirizzi
  await page.route('**/address', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [{
          id: 4,
          user_id: 46,
          name: 'Antonio',
          surname: 'Rossi',
          stato: 'Italia',
          citta: 'Milano',
          provincia: 'MI',
          via: 'Via Monte Napoleone',
          cap: '20121',
          numero_civico: 12
        }]
      })
    });
  });
  
  // Vai alla pagina di checkout
  await page.goto('http://localhost:3000/checkout.html');
  
  // Verifica che il riepilogo dell'ordine sia visibile
  await expect(page.locator('.order-summary')).toBeVisible();
  
  // Verifica che ci siano gli indirizzi di consegna
  await expect(page.locator('.delivery-addresses')).toBeVisible();
  
  // Verifica che ci sia il totale dell'ordine
  await expect(page.locator('.order-total')).toBeVisible();
  
  // Verifica che ci sia il pulsante per confermare l'ordine
  await expect(page.locator('#place-order-button')).toBeVisible();
}); 