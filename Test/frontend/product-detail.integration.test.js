/**
 * Test di integrazione per la pagina di dettaglio prodotto
 * Questi test verificano che le funzionalità principali della pagina di dettaglio prodotto funzionino correttamente
 */
const { test, expect } = require('@playwright/test');

test.describe('Product Detail Page Tests', () => {
  let productId;

  test.beforeAll(async ({ browser }) => {
    // Trova un ID prodotto valido dalla pagina home
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('http://localhost:3000');
    
    // Attendi che i prodotti siano caricati
    await page.waitForSelector('.product-card');
    
    // Ottieni l'ID del primo prodotto
    productId = await page.locator('.product-card').first().getAttribute('data-product-id');
    
    // Se non è possibile ottenere l'ID, utilizza un ID predefinito per i test
    if (!productId) {
      productId = '1'; // ID di fallback
    }
    
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // Vai alla pagina di dettaglio del prodotto
    await page.goto(`http://localhost:3000/product/${productId}`);
    
    // Attendi che la pagina sia completamente caricata
    await page.waitForSelector('.product-detail-container');
  });

  test('Dovrebbe mostrare i dettagli del prodotto', async ({ page }) => {
    // Verifica che il titolo del prodotto sia visibile
    await expect(page.locator('.product-title')).toBeVisible();
    
    // Verifica che il prezzo sia visibile
    await expect(page.locator('.product-price')).toBeVisible();
    
    // Verifica che la descrizione sia visibile
    await expect(page.locator('.product-description')).toBeVisible();
    
    // Verifica che ci sia almeno un'immagine del prodotto
    await expect(page.locator('.product-image')).toBeVisible();
  });

  test('Dovrebbe mostrare le informazioni sull\'artigiano', async ({ page }) => {
    // Verifica che la sezione dell'artigiano sia visibile
    await expect(page.locator('.artisan-info')).toBeVisible();
    
    // Verifica che il nome dell'artigiano sia visibile
    await expect(page.locator('.artisan-name')).toBeVisible();
  });

  test('Dovrebbe permettere di selezionare la quantità', async ({ page }) => {
    // Verifica che il selettore di quantità sia presente
    const quantitySelector = page.locator('input[type="number"], select.quantity-selector');
    await expect(quantitySelector).toBeVisible();
    
    // Imposta la quantità a 2
    await quantitySelector.fill('2');
    
    // Verifica che il valore sia stato aggiornato
    await expect(quantitySelector).toHaveValue('2');
  });

  test('Dovrebbe permettere di aggiungere il prodotto al carrello', async ({ page }) => {
    // Trova il pulsante "Aggiungi al carrello"
    const addToCartButton = page.locator('button', { hasText: /Aggiungi al carrello/i });
    await expect(addToCartButton).toBeVisible();
    
    // Clicca sul pulsante
    await addToCartButton.click();
    
    // Verifica che appaia un messaggio di conferma
    await expect(page.locator('.notification, .alert-success, .toast')).toBeVisible();
  });

  test('Dovrebbe mostrare prodotti correlati', async ({ page }) => {
    // Scorri fino alla sezione dei prodotti correlati
    await page.locator('.related-products, .similar-products').scrollIntoViewIfNeeded();
    
    // Verifica che la sezione dei prodotti correlati sia visibile
    await expect(page.locator('.related-products, .similar-products')).toBeVisible();
    
    // Verifica che ci siano alcuni prodotti correlati
    const relatedProducts = page.locator('.related-products .product-card, .similar-products .product-card');
    await expect(relatedProducts).toHaveCount({ min: 1 });
  });

  test('Dovrebbe permettere di navigare a un prodotto correlato', async ({ page }) => {
    // Scorri fino alla sezione dei prodotti correlati
    await page.locator('.related-products, .similar-products').scrollIntoViewIfNeeded();
    
    // Trova il primo prodotto correlato e ottieni il suo ID
    const relatedProduct = page.locator('.related-products .product-card, .similar-products .product-card').first();
    
    // Clicca sul prodotto correlato
    await relatedProduct.click();
    
    // Verifica che sia avvenuta la navigazione a un'altra pagina di dettaglio prodotto
    await expect(page).toHaveURL(/\/product\/\d+/);
    
    // Verifica che sia stato caricato un nuovo prodotto
    await expect(page.locator('.product-detail-container')).toBeVisible();
  });

  test('Dovrebbe mostrare recensioni del prodotto', async ({ page }) => {
    // Scorri fino alla sezione delle recensioni
    await page.locator('.reviews-section').scrollIntoViewIfNeeded();
    
    // Verifica che la sezione delle recensioni sia visibile
    await expect(page.locator('.reviews-section')).toBeVisible();
  });

  test('Dovrebbe funzionare il breadcrumb per la navigazione', async ({ page }) => {
    // Verifica che il breadcrumb sia visibile
    await expect(page.locator('.breadcrumb, .breadcrumbs')).toBeVisible();
    
    // Clicca sul link "Home" nel breadcrumb
    await page.locator('.breadcrumb a, .breadcrumbs a').first().click();
    
    // Verifica che sia avvenuta la navigazione alla home page
    await expect(page).toHaveURL('http://localhost:3000/');
  });
}); 