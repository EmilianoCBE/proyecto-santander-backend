const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken");
const { customQuery } = require("../db_connection"); // wrapper de SP

// GET todos los tickets de un usuario
router.get("/private/tickets", verifyToken, async (req, res) => {
  const userEmail = req.user.email;
  const userRole = req.user.role; // viene del token

  try {
    const tickets = await customQuery("CALL sp_get_tickets_by_user(?, ?)", [
      userEmail,
      userRole,
    ]);
    res.json(tickets[0]);
  } catch (err) {
    console.error("Error en GET /private/tickets:", err);
    res.status(500).json({ error: "Error al obtener tickets" });
  }
});

// POST crear ticket para un documento existente
router.post("/private/tickets", verifyToken, async (req, res) => {
  const { id_folio } = req.body;
  const userEmail = req.user.correoElectronico; // también el email

  if (!id_folio) {
    return res.status(400).json({ error: "No se proporcionó id de documento" });
  }

  try {
    const result = await customQuery("CALL sp_create_ticket_from_doc(?, ?)", [
      id_folio,
      userEmail,
    ]);

    res.json({
      message: "Ticket creado correctamente",
      ticketId: result[0][0].ticketId,
    });
  } catch (err) {
    console.error("Error en POST /private/tickets:", err);
    res.status(500).json({ error: "Error al crear ticket" });
  }
});

module.exports = router;
