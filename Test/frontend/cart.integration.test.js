/**
 * Test di integrazione per la pagina del carrello
 * Questi test verificano che le funzionalità principali della pagina del carrello funzionino correttamente
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8080';
// Credenziali di test per il login
const TEST_EMAIL = 'antonio@example.com';
const TEST_PASSWORD = 'password123';

test.describe('Cart and Checkout Tests', () => {
  let userEmail;
  let userPassword;

  // Prima di tutti i test, prepara i dati di test
  test.beforeAll(() => {
    // Utilizza un indirizzo email temporaneo per i test
    userEmail = `test-user-${Date.now()}@example.com`;
    userPassword = 'Password123!';
  });

  // Prima di ogni test, naviga alla pagina home
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('Dovrebbe permettere di registrare un nuovo account', async ({ page }) => {
    // Vai alla pagina di registrazione
    await page.locator('nav').getByText('Registrati').click();
    
    // Compila il form di registrazione
    await page.locator('input[name="name"]').fill('Test User');
    await page.locator('input[name="email"]').fill(userEmail);
    await page.locator('input[name="password"]').fill(userPassword);
    await page.locator('input[name="password_confirmation"]').fill(userPassword);
    
    // Invia il form
    await page.locator('button[type="submit"]').click();
    
    // Verifica che la registrazione sia avvenuta con successo (reindirizzamento alla dashboard o messaggio di successo)
    await expect(page).toHaveURL(/dashboard|login/);
  });

  test('Dovrebbe permettere di effettuare il login', async ({ page }) => {
    // Vai alla pagina di login
    await page.locator('nav').getByText('Login').click();
    
    // Compila il form di login
    await page.locator('input[name="email"]').fill(userEmail);
    await page.locator('input[name="password"]').fill(userPassword);
    
    // Invia il form
    await page.locator('button[type="submit"]').click();
    
    // Verifica che il login sia avvenuto con successo
    await expect(page.locator('.user-profile, .user-menu')).toBeVisible();
  });

  test('Dovrebbe permettere di aggiungere prodotti al carrello', async ({ page }) => {
    // Effettua il login
    await page.locator('nav').getByText('Login').click();
    await page.locator('input[name="email"]').fill(userEmail);
    await page.locator('input[name="password"]').fill(userPassword);
    await page.locator('button[type="submit"]').click();
    
    // Vai alla homepage
    await page.goto('http://localhost:3000');
    
    // Clicca sul primo prodotto
    await page.locator('.product-card').first().click();
    
    // Attendi il caricamento della pagina di dettaglio prodotto
    await page.waitForSelector('.product-detail-container');
    
    // Imposta la quantità
    await page.locator('input[type="number"], select.quantity-selector').fill('2');
    
    // Aggiungi al carrello
    await page.locator('button', { hasText: /Aggiungi al carrello/i }).click();
    
    // Verifica che il prodotto sia stato aggiunto (notifica o aggiornamento contatore carrello)
    await expect(page.locator('.notification, .alert-success, .toast, .cart-counter')).toBeVisible();
  });

  test('Dovrebbe mostrare i prodotti nel carrello', async ({ page }) => {
    // Effettua il login
    await page.locator('nav').getByText('Login').click();
    await page.locator('input[name="email"]').fill(userEmail);
    await page.locator('input[name="password"]').fill(userPassword);
    await page.locator('button[type="submit"]').click();
    
    // Vai alla pagina del carrello
    await page.locator('nav').getByText('Carrello').click();
    
    // Attendi il caricamento della pagina del carrello
    await page.waitForSelector('.cart-container');
    
    // Verifica che ci sia almeno un prodotto nel carrello
    await expect(page.locator('.cart-item')).toBeVisible();
    
    // Verifica che il totale del carrello sia visibile
    await expect(page.locator('.cart-total')).toBeVisible();
  });

  test('Dovrebbe permettere di modificare la quantità dei prodotti nel carrello', async ({ page }) => {
    // Effettua il login
    await page.locator('nav').getByText('Login').click();
    await page.locator('input[name="email"]').fill(userEmail);
    await page.locator('input[name="password"]').fill(userPassword);
    await page.locator('button[type="submit"]').click();
    
    // Vai alla pagina del carrello
    await page.locator('nav').getByText('Carrello').click();
    
    // Attendi il caricamento della pagina del carrello
    await page.waitForSelector('.cart-container');
    
    // Ottieni il valore del totale del carrello prima della modifica
    const initialTotal = await page.locator('.cart-total').textContent();
    
    // Modifica la quantità del primo prodotto
    await page.locator('.cart-item').first().locator('input[type="number"]').fill('3');
    
    // Aspetta che il totale venga aggiornato
    await page.waitForTimeout(1000);
    
    // Ottieni il valore del totale del carrello dopo la modifica
    const updatedTotal = await page.locator('.cart-total').textContent();
    
    // Verifica che il totale sia cambiato
    expect(initialTotal).not.toBe(updatedTotal);
  });

  test('Dovrebbe permettere di rimuovere prodotti dal carrello', async ({ page }) => {
    // Effettua il login
    await page.locator('nav').getByText('Login').click();
    await page.locator('input[name="email"]').fill(userEmail);
    await page.locator('input[name="password"]').fill(userPassword);
    await page.locator('button[type="submit"]').click();
    
    // Vai alla pagina del carrello
    await page.locator('nav').getByText('Carrello').click();
    
    // Attendi il caricamento della pagina del carrello
    await page.waitForSelector('.cart-container');
    
    // Conta il numero di prodotti nel carrello prima della rimozione
    const initialItemCount = await page.locator('.cart-item').count();
    
    // Rimuovi il primo prodotto
    await page.locator('.cart-item').first().locator('button.remove-item, .delete-button').click();
    
    // Attendi che il carrello venga aggiornato
    await page.waitForTimeout(1000);
    
    // Conta il numero di prodotti nel carrello dopo la rimozione
    const updatedItemCount = await page.locator('.cart-item').count();
    
    // Verifica che il numero di prodotti sia diminuito
    expect(updatedItemCount).toBe(initialItemCount - 1);
  });

  test('Dovrebbe permettere di procedere al checkout', async ({ page }) => {
    // Effettua il login
    await page.locator('nav').getByText('Login').click();
    await page.locator('input[name="email"]').fill(userEmail);
    await page.locator('input[name="password"]').fill(userPassword);
    await page.locator('button[type="submit"]').click();
    
    // Vai alla pagina del carrello
    await page.locator('nav').getByText('Carrello').click();
    
    // Attendi il caricamento della pagina del carrello
    await page.waitForSelector('.cart-container');
    
    // Clicca sul pulsante per procedere al checkout
    await page.locator('button', { hasText: /Procedi al checkout|Acquista ora/i }).click();
    
    // Verifica che sia avvenuta la navigazione alla pagina di checkout
    await expect(page).toHaveURL(/checkout|payment/);
    
    // Verifica che il form di pagamento sia visibile
    await expect(page.locator('form.payment-form, form.checkout-form')).toBeVisible();
  });

  test('Dovrebbe permettere di inserire i dati di spedizione', async ({ page }) => {
    // Effettua il login
    await page.locator('nav').getByText('Login').click();
    await page.locator('input[name="email"]').fill(userEmail);
    await page.locator('input[name="password"]').fill(userPassword);
    await page.locator('button[type="submit"]').click();
    
    // Vai alla pagina del carrello
    await page.locator('nav').getByText('Carrello').click();
    
    // Attendi il caricamento della pagina del carrello
    await page.waitForSelector('.cart-container');
    
    // Clicca sul pulsante per procedere al checkout
    await page.locator('button', { hasText: /Procedi al checkout|Acquista ora/i }).click();
    
    // Compila il form di spedizione
    await page.locator('input[name="name"]').fill('Test User');
    await page.locator('input[name="surname"]').fill('Test Surname');
    await page.locator('input[name="address"]').fill('Via Test 123');
    await page.locator('input[name="city"]').fill('Test City');
    await page.locator('input[name="province"]').fill('TS');
    await page.locator('input[name="postal_code"]').fill('12345');
    await page.locator('input[name="country"]').fill('Italy');
    
    // Procedi al pagamento
    await page.locator('button', { hasText: /Continua|Procedi al pagamento/i }).click();
    
    // Verifica che sia avvenuta la navigazione alla sezione di pagamento
    await expect(page.locator('.payment-section, #card-element')).toBeVisible();
  });

  test('Dovrebbe simulare un pagamento e completare l\'ordine', async ({ page }) => {
    // Effettua il login
    await page.locator('nav').getByText('Login').click();
    await page.locator('input[name="email"]').fill(userEmail);
    await page.locator('input[name="password"]').fill(userPassword);
    await page.locator('button[type="submit"]').click();
    
    // Vai alla pagina del carrello
    await page.locator('nav').getByText('Carrello').click();
    
    // Attendi il caricamento della pagina del carrello
    await page.waitForSelector('.cart-container');
    
    // Clicca sul pulsante per procedere al checkout
    await page.locator('button', { hasText: /Procedi al checkout|Acquista ora/i }).click();
    
    // Compila il form di spedizione
    await page.locator('input[name="name"]').fill('Test User');
    await page.locator('input[name="surname"]').fill('Test Surname');
    await page.locator('input[name="address"]').fill('Via Test 123');
    await page.locator('input[name="city"]').fill('Test City');
    await page.locator('input[name="province"]').fill('TS');
    await page.locator('input[name="postal_code"]').fill('12345');
    await page.locator('input[name="country"]').fill('Italy');
    
    // Procedi al pagamento
    await page.locator('button', { hasText: /Continua|Procedi al pagamento/i }).click();
    
    // Simula il pagamento (in modalità test)
    // Nota: questa parte dipende dall'implementazione del sistema di pagamento
    // e potrebbe richiedere adattamenti in base alla tua implementazione
    
    // Clicca sul pulsante per confermare l'ordine
    await page.locator('button', { hasText: /Conferma ordine|Completa acquisto/i }).click();
    
    // Verifica che appaia una conferma dell'ordine
    await expect(page.locator('.order-confirmation, .success-message')).toBeVisible();
  });
}); 