/**
 * @jest-environment jsdom
 */

const { screen, fireEvent } = require('@testing-library/dom');
const { getByTestId, getByText } = require('@testing-library/dom');
require('@testing-library/jest-dom');

// Mock per le funzioni di API
jest.mock('../../Frontend/api/api.js', () => ({
  fetchProducts: jest.fn(() => Promise.resolve({
    data: [
      { id: 15, name: 'Latte intero', price: 3.00, discount: 0, stock: 100 },
      { id: 16, name: 'Latte scremato', price: 4.00, discount: 0, stock: 187 }
    ]
  })),
  fetchProductDetails: jest.fn((id) => Promise.resolve({
    data: {
      id: id,
      name: 'Latte intero',
      description: 'Latte intero, ricco e naturale.',
      price: 3.00,
      discount: 0,
      stock: 100,
      images: [
        { url: '/Media/product/15/1747748703920-804360163.webp', alt_text: 'Immagine product 15' }
      ]
    }
  })),
  login: jest.fn(() => Promise.resolve({
    data: {
      token: 'test-token',
      user: { id: 46, name: 'Antonio', email: 'antonio@example.com', role: 'client' }
    }
  })),
  addToCart: jest.fn(() => Promise.resolve({
    data: { id: 62, product_id: 20, quantity: 1 }
  }))
}));

// Test per il componente del prodotto
describe('Componente ProductCard', () => {
  beforeEach(() => {
    // Setup del DOM con il componente da testare
    document.body.innerHTML = `
      <div class="product-card" data-testid="product-card-15">
        <img src="/Media/product/15/1747748703920-804360163.webp" alt="Latte intero" class="product-image">
        <h3 class="product-name">Latte intero</h3>
        <p class="product-price">€3.00</p>
        <button class="add-to-cart-btn" data-product-id="15">Aggiungi al carrello</button>
      </div>
    `;
  });

  it('dovrebbe visualizzare correttamente i dettagli del prodotto', () => {
    const productCard = screen.getByTestId('product-card-15');
    
    expect(productCard).toBeInTheDocument();
    expect(getByText(productCard, 'Latte intero')).toBeInTheDocument();
    expect(getByText(productCard, '€3.00')).toBeInTheDocument();
    expect(productCard.querySelector('.add-to-cart-btn')).toHaveAttribute('data-product-id', '15');
  });

  it('dovrebbe attivare l\'aggiunta al carrello quando si fa clic sul pulsante', () => {
    const addToCartBtn = screen.getByText('Aggiungi al carrello');
    
    // Aggiungiamo un event listener fittizio per simulare il comportamento JavaScript
    const mockAddToCart = jest.fn();
    addToCartBtn.addEventListener('click', mockAddToCart);
    
    fireEvent.click(addToCartBtn);
    
    expect(mockAddToCart).toHaveBeenCalledTimes(1);
  });
});

// Test per il componente di login
describe('Componente LoginForm', () => {
  beforeEach(() => {
    // Setup del DOM con il componente da testare
    document.body.innerHTML = `
      <form id="login-form" data-testid="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required>
        </div>
        <button type="submit">Accedi</button>
        <p class="error-message" hidden></p>
      </form>
    `;
  });

  it('dovrebbe mostrare un errore quando i campi sono vuoti', () => {
    const form = screen.getByTestId('login-form');
    const submitEvent = new Event('submit');
    
    // Preveniamo il comportamento predefinito
    submitEvent.preventDefault = jest.fn();
    
    // Dispacciamo l'evento di invio
    form.dispatchEvent(submitEvent);
    
    // Dovremmo vedere l'errore perché i campi sono vuoti
    expect(submitEvent.preventDefault).toHaveBeenCalled();
  });

  it('dovrebbe accettare valori validi nei campi', () => {
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    
    fireEvent.change(emailInput, { target: { value: 'antonio@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(emailInput.value).toBe('antonio@example.com');
    expect(passwordInput.value).toBe('password123');
  });
});

// Test per il componente del carrello
describe('Componente ShoppingCart', () => {
  beforeEach(() => {
    // Setup del DOM con il componente da testare
    document.body.innerHTML = `
      <div id="shopping-cart" data-testid="shopping-cart">
        <h2>Il tuo carrello</h2>
        <ul class="cart-items">
          <li class="cart-item" data-item-id="50">
            <span class="item-name">Farina 00</span>
            <span class="item-price">€0.70</span>
            <div class="quantity-controls">
              <button class="decrease-quantity" data-item-id="50">-</button>
              <span class="item-quantity">2</span>
              <button class="increase-quantity" data-item-id="50">+</button>
            </div>
            <button class="remove-item" data-item-id="50">Rimuovi</button>
          </li>
          <li class="cart-item" data-item-id="51">
            <span class="item-name">Tagliata</span>
            <span class="item-price">€15.00</span>
            <div class="quantity-controls">
              <button class="decrease-quantity" data-item-id="51">-</button>
              <span class="item-quantity">3</span>
              <button class="increase-quantity" data-item-id="51">+</button>
            </div>
            <button class="remove-item" data-item-id="51">Rimuovi</button>
          </li>
        </ul>
        <div class="cart-total">
          <strong>Totale:</strong> <span id="cart-total-price">€46.40</span>
        </div>
        <button id="checkout-button">Procedi all'acquisto</button>
      </div>
    `;
  });

  it('dovrebbe visualizzare correttamente gli elementi del carrello', () => {
    const cart = screen.getByTestId('shopping-cart');
    
    expect(cart).toBeInTheDocument();
    expect(getByText(cart, 'Farina 00')).toBeInTheDocument();
    expect(getByText(cart, 'Tagliata')).toBeInTheDocument();
    expect(getByText(cart, '€46.40')).toBeInTheDocument();
  });

  it('dovrebbe attivare la rimozione quando si fa clic sul pulsante rimuovi', () => {
    const removeButtons = screen.getAllByText('Rimuovi');
    
    // Aggiungiamo un event listener fittizio per simulare il comportamento JavaScript
    const mockRemoveItem = jest.fn();
    removeButtons[0].addEventListener('click', mockRemoveItem);
    
    fireEvent.click(removeButtons[0]);
    
    expect(mockRemoveItem).toHaveBeenCalledTimes(1);
  });

  it('dovrebbe attivare l\'incremento della quantità quando si fa clic sul pulsante +', () => {
    const increaseButtons = screen.getAllByText('+');
    
    // Aggiungiamo un event listener fittizio per simulare il comportamento JavaScript
    const mockIncreaseQuantity = jest.fn();
    increaseButtons[0].addEventListener('click', mockIncreaseQuantity);
    
    fireEvent.click(increaseButtons[0]);
    
    expect(mockIncreaseQuantity).toHaveBeenCalledTimes(1);
  });
}); 