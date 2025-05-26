/**
 * Test di integrazione per la homepage
 * Questi test verificano che le funzionalità principali della homepage funzionino correttamente
 */
const { test, expect } = require('@playwright/test');

test.describe('Home Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Visita la pagina home
    await page.goto('http://localhost:3000');
  });

  test('Dovrebbe caricare correttamente la pagina home', async ({ page }) => {
    // Verifica che il titolo della pagina sia corretto
    await expect(page).toHaveTitle(/Artisan Craft/);
    
    // Verifica che la navbar sia presente
    await expect(page.locator('nav')).toBeVisible();
    
    // Verifica che il logo sia presente
    await expect(page.locator('nav img')).toBeVisible();
  });

  test('Dovrebbe mostrare le categorie principali', async ({ page }) => {
    // Verifica che la sezione delle categorie sia presente
    await expect(page.locator('section.categories')).toBeVisible();
    
    // Verifica che ci siano almeno alcune categorie visualizzate
    const categories = page.locator('.category-item');
    await expect(categories).toHaveCount({ min: 1 });
  });

  test('Dovrebbe mostrare i prodotti in evidenza', async ({ page }) => {
    // Verifica che la sezione dei prodotti in evidenza sia presente
    await expect(page.locator('section.featured-products')).toBeVisible();
    
    // Verifica che ci siano alcuni prodotti in evidenza
    const featuredProducts = page.locator('.product-card');
    await expect(featuredProducts).toHaveCount({ min: 1 });
  });

  test('Dovrebbe mostrare gli artigiani in evidenza', async ({ page }) => {
    // Verifica che la sezione degli artigiani in evidenza sia presente
    await expect(page.locator('section.featured-artisans')).toBeVisible();
    
    // Verifica che ci siano alcuni artigiani in evidenza
    const featuredArtisans = page.locator('.artisan-card');
    await expect(featuredArtisans).toHaveCount({ min: 1 });
  });

  test('Dovrebbe navigare alla pagina di dettaglio prodotto quando si clicca su un prodotto', async ({ page }) => {
    // Trova il primo prodotto in evidenza e clicca su di esso
    const firstProduct = page.locator('.product-card').first();
    const productId = await firstProduct.getAttribute('data-product-id');
    
    await firstProduct.click();
    
    // Verifica che sia avvenuta la navigazione alla pagina di dettaglio prodotto
    await expect(page).toHaveURL(/\/product\/\d+/);
  });

  test('Dovrebbe navigare alla pagina delle categorie quando si clicca su "Vedi tutte le categorie"', async ({ page }) => {
    // Trova il pulsante "Vedi tutte le categorie" e clicca su di esso
    const viewAllButton = page.locator('text="Vedi tutte le categorie"');
    await viewAllButton.click();
    
    // Verifica che sia avvenuta la navigazione alla pagina delle categorie
    await expect(page).toHaveURL(/\/categories/);
  });

  test('Dovrebbe funzionare la barra di ricerca', async ({ page }) => {
    // Trova la barra di ricerca
    const searchInput = page.locator('input[type="search"]');
    
    // Inserisci un termine di ricerca
    await searchInput.fill('legno');
    await searchInput.press('Enter');
    
    // Verifica che sia avvenuta la navigazione alla pagina dei risultati di ricerca
    await expect(page).toHaveURL(/\/search\?q=legno/);
    
    // Verifica che ci siano risultati di ricerca
    await expect(page.locator('.search-results')).toBeVisible();
  });

  test('Dovrebbe permettere la navigazione al login', async ({ page }) => {
    // Trova il pulsante di login e clicca su di esso
    const loginButton = page.locator('nav').getByText('Login');
    await loginButton.click();
    
    // Verifica che sia avvenuta la navigazione alla pagina di login
    await expect(page).toHaveURL(/\/login/);
    
    // Verifica che il form di login sia presente
    await expect(page.locator('form')).toBeVisible();
  });

  test('Dovrebbe mostrare il footer con i link ai social media', async ({ page }) => {
    // Verifica che il footer sia presente
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Verifica che ci siano i link ai social media
    const socialLinks = footer.locator('.social-links a');
    await expect(socialLinks).toHaveCount({ min: 1 });
  });
}); 