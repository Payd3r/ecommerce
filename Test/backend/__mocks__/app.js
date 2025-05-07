// Mock dell'app Express per i test
const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Rotte mock per i test
// Auth
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'test@example.com' && password === 'password123') {
    return res.status(200).json({
      success: true,
      data: {
        token: 'mock-token-123',
        user: { id: 1, name: 'Test User', email, role: 'client' }
      }
    });
  }
  
  return res.status(401).json({
    success: false,
    message: 'Credenziali non valide'
  });
});

app.post('/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  
  return res.status(201).json({
    success: true,
    data: {
      token: 'mock-token-123',
      user: { id: 1, name, email, role }
    }
  });
});

// Products
app.get('/products', (req, res) => {
  return res.status(200).json({
    success: true,
    data: [
      { id: 1, name: 'Prodotto 1', price: 10.99, category_id: 1 },
      { id: 2, name: 'Prodotto 2', price: 19.99, category_id: 1 }
    ]
  });
});

app.get('/products/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    data: { id: parseInt(req.params.id), name: `Prodotto ${req.params.id}`, price: 10.99, category_id: 1 }
  });
});

app.get('/products/category/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    data: [
      { id: 1, name: 'Prodotto 1', price: 10.99, category_id: parseInt(req.params.id) }
    ]
  });
});

app.post('/products', (req, res) => {
  // Verifica autorizzazione
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Non autorizzato' });
  }
  
  return res.status(201).json({
    success: true,
    data: { id: 3, ...req.body }
  });
});

// Categories
app.get('/categories', (req, res) => {
  return res.status(200).json({
    success: true,
    data: [
      { id: 1, name: 'Categoria 1' },
      { id: 2, name: 'Categoria 2' }
    ]
  });
});

// Cart
app.get('/cart', (req, res) => {
  // Verifica autorizzazione
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Non autorizzato' });
  }
  
  return res.status(200).json({
    success: true,
    data: {
      items: [
        { id: 1, product_id: 1, quantity: 2, product: { name: 'Prodotto 1', price: 10.99 } }
      ]
    }
  });
});

app.post('/cart/add', (req, res) => {
  // Verifica autorizzazione
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Non autorizzato' });
  }
  
  return res.status(200).json({
    success: true,
    data: { id: 1, ...req.body }
  });
});

app.delete('/cart/item/:id', (req, res) => {
  // Verifica autorizzazione
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Non autorizzato' });
  }
  
  return res.status(200).json({
    success: true,
    message: 'Elemento rimosso dal carrello'
  });
});

module.exports = app; 