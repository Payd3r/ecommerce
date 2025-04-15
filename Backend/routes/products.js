// routes/auth.js
const express = require('express');
const router = express.Router();

router.get('/prova', (req, res) => {
  res.send('aaaaa route OK');
});

module.exports = router;
