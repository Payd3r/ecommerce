const express = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3005;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes base
app.get('/', (req, res) => {
  res.send('Benvenuto su Artigianato Online API');
});

// Modularizzazione (aggiungeremo dopo)
app.use('/auth', require('./routes/auth'));
app.use('/products', require('./routes/products'));

app.listen(port, () => {
  console.log(`Server attivo su http://localhost:${port}`);
});
