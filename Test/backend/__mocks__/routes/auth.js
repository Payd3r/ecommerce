const express = require('express');
const router = express.Router();

// POST /auth/login
router.post('/login', (req, res) => {
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

// POST /auth/register
router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;
  
  // Verifica che l'email non sia già registrata
  if (email === 'existing@example.com') {
    return res.status(400).json({
      success: false,
      message: 'Email già registrata'
    });
  }
  
  return res.status(201).json({
    success: true,
    data: {
      token: 'mock-token-123',
      user: { id: 1, name, email, role }
    }
  });
});

module.exports = router; 