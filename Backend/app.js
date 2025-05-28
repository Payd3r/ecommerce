const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const port = process.env.PORT || 3015;
app.use(express.static(path.join(__dirname, '../Frontend')));
// Middleware
app.use(cors({
  origin: true, // Permette tutte le origini durante lo sviluppo
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve la cartella Media come statica
// app.use('/Media', express.static(path.resolve(__dirname, 'Media'))); // ora servito da imageserver

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Artigianato Online API',
      version: '1.0.0',
      description: 'Documentazione delle API di Artigianato Online',
    },
    servers: [
      {
        url: 'http://localhost:' + port,
      },
    ],
  },
  apis: ['./routes/*.js'], // Percorso ai file delle route per i commenti JSDoc
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes base
app.get('/', (req, res) => {
  res.send('Benvenuto su Artigianato Online API');
});

// Modularizzazione (aggiungeremo dopo)
app.use('/auth', require('./routes/auth'));
app.use('/products', require('./routes/products'));
app.use('/users', require('./routes/users'));
app.use('/categories', require('./routes/categories'));
app.use('/cart', require('./routes/cart'));
app.use('/orders', require('./routes/orders'));
app.use('/images', require('./routes/images'));
app.use('/issues', require('./routes/issue'));
app.use('/address', require('./routes/address'));

app.listen(port, () => {
  console.log(`Server attivo su http://0.0.0.0:${port}`);
});

