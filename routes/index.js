const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const docRoutes = require("./docRoutes");
const privateRoutes = require("./privateRoutes");

// Middleware de log general
router.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] Petición ${req.method} '${req.url}'`
  );
  next();
});

// Rutas
router.use(authRoutes);
router.use(docRoutes);
router.use(privateRoutes);

module.exports = router;
