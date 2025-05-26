/**
 * Test di compatibilità cross-browser
 * Questi test verificano che le funzionalità principali dell'app funzionino su diversi browser
 */
const { chromium, firefox, webkit } = require('playwright');

// Elenco dei browser da testare
const browsers = [
  { name: 'Chrome', launcher: chromium },
  { name: 'Firefox', launcher: firefox },
  { name: 'Safari', launcher: webkit }
];

// URL di base dell'applicazione frontend
const BASE_URL = 'http://localhost:8080';

// Suite di test per la compatibilità cross-browser
describe('Test di compatibilità cross-browser', () => {
  
  // Ripeti i test per ogni browser
  browsers.forEach(browserType => {
    describe(`Test su ${browserType.name}`, () => {
      let browser;
      let page;

      // Setup prima di ogni test
      beforeAll(async () => {
        browser = await browserType.launcher.launch();
        page = await browser.newPage();
      });

      // Chiusura dopo ogni test
      afterAll(async () => {
        await browser.close();
      });

      // Test della homepage
      test(`Homepage si carica correttamente su ${browserType.name}`, async () => {
        await page.goto(BASE_URL);
        // Verifica che il titolo contenga elementi tipici di un e-commerce
        const title = await page.title();
        expect(title).toBeTruthy();
        // Verifica che gli elementi principali siano presenti
        const navExists = await page.$('nav');
        expect(navExists).not.toBeNull();
        // Verifica la presenza del container principale
        const mainContainerExists = await page.$('#app-container');
        expect(mainContainerExists).not.toBeNull();
      }, 30000);

      // Test del login form
      test(`Form di login funziona correttamente su ${browserType.name}`, async () => {
        await page.goto(`${BASE_URL}/login.html`);
        // Verifica che il form di login sia presente
        const loginFormExists = await page.$('#login-form');
        expect(loginFormExists).not.toBeNull();
        // Verifica che i campi email e password siano presenti
        const emailInput = await page.$('input[type="email"]');
        const passwordInput = await page.$('input[type="password"]');
        expect(emailInput).not.toBeNull();
        expect(passwordInput).not.toBeNull();
        // Verifica il pulsante di submit
        const submitButton = await page.$('button[type="submit"]');
        expect(submitButton).not.toBeNull();
      }, 30000);

      // Test della visualizzazione dei prodotti
      test(`Lista prodotti si visualizza correttamente su ${browserType.name}`, async () => {
        await page.goto(`${BASE_URL}/products.html`);
        // Attendi il caricamento dei prodotti
        await page.waitForSelector('.product-card', { timeout: 5000 }).catch(() => {});
        // Verifica che ci siano dei prodotti visualizzati
        const productCards = await page.$$('.product-card');
        expect(productCards.length).toBeGreaterThan(0);
        // Verifica che ogni prodotto abbia nome e prezzo
        const firstProduct = productCards[0];
        const productName = await firstProduct.$('.product-name');
        const productPrice = await firstProduct.$('.product-price');
        expect(productName).not.toBeNull();
        expect(productPrice).not.toBeNull();
      }, 30000);

      // Test della responsività
      test(`Il sito è responsivo su ${browserType.name}`, async () => {
        // Test su desktop
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(BASE_URL);
        let navbarVisible = await page.isVisible('nav');
        expect(navbarVisible).toBe(true);
        
        // Test su tablet
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto(BASE_URL);
        navbarVisible = await page.isVisible('nav');
        expect(navbarVisible).toBe(true);
        
        // Test su mobile
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(BASE_URL);
        // Su mobile potrebbe esserci un hamburger menu invece della navbar completa
        const hamburgerExists = await page.$('.navbar-toggler, .menu-toggle, [aria-label="Menu"]');
        expect(hamburgerExists).not.toBeNull();
      }, 30000);
    });
  });
}); 