const { test, expect } = require('@playwright/test');

// Funzione di test comune per tutti i browser
async function runBrowserCompatibilityTest(page) {
  // Test della homepage
  await page.goto('http://localhost:3000');
  
  // Verifica titolo della pagina
  await expect(page).toHaveTitle(/E-commerce Prodotti Artigianali/);
  
  // Verifica elementi principali
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
  await expect(page.locator('.product-grid')).toBeVisible();
  
  // Verifica che ci siano prodotti caricati
  const productCards = page.locator('.product-card');
  const productCount = await productCards.count();
  expect(productCount).toBeGreaterThan(0);
  
  // Verifica responsive su diverse dimensioni dello schermo
  await verifyResponsive(page);
  
  // Verifica funzionalità interattive
  await verifyInteractiveElements(page);
  
  // Test della pagina di login
  await page.goto('http://localhost:3000/login.html');
  await expect(page.locator('#login-form')).toBeVisible();
  
  // Test della pagina di dettaglio prodotto
  await page.goto('http://localhost:3000/product.html?id=15');
  await expect(page.locator('.product-title')).toBeVisible();
  await expect(page.locator('.product-image')).toBeVisible();
  
  // Aggiungi il prodotto al carrello e verifica
  await page.click('.add-to-cart-btn');
  const addedToast = page.locator('.toast-success');
  await expect(addedToast).toBeVisible({ timeout: 5000 });
}

// Verifica del responsive design
async function verifyResponsive(page) {
  // Test su mobile
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
  await expect(page.locator('.mobile-menu-toggle')).toBeVisible();
  
  // Test su tablet
  await page.setViewportSize({ width: 768, height: 1024 }); // iPad
  await expect(page.locator('nav')).toBeVisible();
  
  // Test su desktop
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.locator('nav')).toBeVisible();
}

// Verifica degli elementi interattivi
async function verifyInteractiveElements(page) {
  // Verifica del menu di navigazione
  await page.click('nav a:first-child');
  await expect(page).toHaveURL(/.*index\.html/);
  
  // Verifica della ricerca
  await page.fill('.search-input', 'latte');
  await page.click('.search-button');
  
  // Dovrebbe mostrare risultati filtrati
  await expect(page.locator('.product-card')).toBeVisible();
  
  // Verifica del filtro per categoria
  await page.click('.category-filter select');
  await page.selectOption('.category-filter select', { label: 'Lattiero-Caseari' });
  
  // Dovrebbe mostrare prodotti filtrati
  await expect(page.locator('.product-card')).toBeVisible();
}

// Test su Chrome
test('Compatibilità con Chrome', async ({ browser }) => {
  const page = await browser.newPage();
  await runBrowserCompatibilityTest(page);
});

// Test su Firefox
test('Compatibilità con Firefox', async ({ browser }) => {
  // Verifica che il browser sia Firefox
  // Nota: questo dovrebbe essere eseguito solo quando il progetto è configurato per testare Firefox
  if (browser.browserType().name() !== 'firefox') {
    test.skip();
  }
  
  const page = await browser.newPage();
  await runBrowserCompatibilityTest(page);
});

// Test su Safari
test('Compatibilità con Safari', async ({ browser }) => {
  // Verifica che il browser sia Safari
  // Nota: questo dovrebbe essere eseguito solo quando il progetto è configurato per testare Safari
  if (browser.browserType().name() !== 'webkit') {
    test.skip();
  }
  
  const page = await browser.newPage();
  await runBrowserCompatibilityTest(page);
});

// Test su Edge
test('Compatibilità con Edge', async ({ browser }) => {
  // Verifica che il browser sia Edge (basato su Chromium)
  // Nota: Edge moderno è basato su Chromium, quindi il test di Chrome dovrebbe funzionare anche qui
  if (browser.browserType().name() !== 'chromium') {
    test.skip();
  }
  
  const page = await browser.newPage();
  await runBrowserCompatibilityTest(page);
});

// Raccolta dei problemi di compatibilità
test('Raccogli problemi di compatibilità', async ({ page }) => {
  // Ottieni le informazioni del browser
  const userAgent = await page.evaluate(() => navigator.userAgent);
  
  // Aggiungi il codice per scrivere i risultati in un file di report
  await page.evaluate(async (ua) => {
    const issues = [];
    
    // Verifica funzionalità CSS moderne
    const cssFeatures = {
      'grid': window.CSS && CSS.supports('display', 'grid'),
      'flexbox': window.CSS && CSS.supports('display', 'flex'),
      'variables': window.CSS && CSS.supports('--custom: property'),
      'animations': window.CSS && CSS.supports('animation', 'name 1s'),
    };
    
    for (const [feature, supported] of Object.entries(cssFeatures)) {
      if (!supported) {
        issues.push(`CSS ${feature} non supportato`);
      }
    }
    
    // Verifica funzionalità JavaScript moderne
    try {
      eval('(async () => {})()');
    } catch (e) {
      issues.push('async/await non supportato');
    }
    
    try {
      eval('const obj = {...{a:1}}');
    } catch (e) {
      issues.push('spread operator non supportato');
    }
    
    // Salva i risultati (simulato qui)
    console.log(`User Agent: ${ua}`);
    console.log(`Problemi rilevati: ${issues.length > 0 ? issues.join(', ') : 'Nessuno'}`);
    
    return issues;
  }, userAgent);
}); 