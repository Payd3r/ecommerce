const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3005;

// Middleware
app.use(cors({
    origin: true, // Permette tutte le origini durante lo sviluppo
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes base
app.get('/', (req, res) => {
  res.send('Benvenuto su Artigianato Online API');
});

// Modularizzazione (aggiungeremo dopo)
app.use('/auth', require('./routes/auth'));
app.use('/products', require('./routes/products'));
app.use('/users', require('./routes/users'));
app.use('/categories', require('./routes/categories'));

app.listen(port, () => {
  console.log(`Server attivo su http://localhost:${port}`);
});
