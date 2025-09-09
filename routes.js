const express = require('express');
const router = express.Router();

router.use((req, res, next) => {

    console.log(`[${new Date().toISOString()}] Peticion ${req.method} '${req.url}'`);
    
    next();

});

router.get('/', (req, res) => {

  res.send('hol');

});

router.get('/saludo/:nombre', (req, res) => {

  res.send(`el ${req.params.nombre}!`);

});

router.post('/mensaje', (req, res) => {

  const { texto } = req.body;

  res.json({ recibido: texto });

});

module.exports = router;