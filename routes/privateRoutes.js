const express = require("express");
const router = express.Router();
const ticketRoutes = require("./ticketRoutes");
const verifyToken = require("../middlewares/verifyToken");

// Rutas privadas existentes
router.get("/private/capacitacion", verifyToken, (req, res) => {
  res.json({ message: "Sección de capacitación", user: req.user });
});

// Importar las rutas de tickets
router.use(ticketRoutes);

module.exports = router;
