// Mock dell'app Express per i test
const express = require('express');
const app = express();

// Importazione delle route mockate
const authRoutes = require('../__mocks__/routes/auth');
const productsRoutes = require('../__mocks__/routes/products');
const cartRoutes = require('../__mocks__/routes/cart');
const categoriesRoutes = require('../__mocks__/routes/categories');
const ordersRoutes = require('../__mocks__/routes/orders');
const usersRoutes = require('../__mocks__/routes/users');
const addressRoutes = require('../__mocks__/routes/address');
const imagesRoutes = require('../__mocks__/routes/images');
const issuesRoutes = require('../__mocks__/routes/issues');

// Middlewares
app.use(express.json());

// Mock del middleware di autenticazione
app.use((req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    // Simula l'autenticazione
    req.user = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: req.headers.authorization.includes('admin') ? 'admin' : 
            req.headers.authorization.includes('artisan') ? 'artisan' : 'client'
    };
  }
  next();
});

// Registrazione delle route
app.use('/auth', authRoutes);
app.use('/products', productsRoutes);
app.use('/cart', cartRoutes);
app.use('/categories', categoriesRoutes);
app.use('/orders', ordersRoutes);
app.use('/users', usersRoutes);
app.use('/address', addressRoutes);
app.use('/images', imagesRoutes);
app.use('/issues', issuesRoutes);

module.exports = app; 