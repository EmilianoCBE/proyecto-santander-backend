const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const verifyToken = require("../middlewares/verifyToken");
const { customQuery } = require("../db_connection");

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Obtener documentos
router.get("/private/docs", verifyToken, async (req, res) => {
  try {
    const docs = await customQuery("CALL sp_get_documentos(?)", [
      req.user.email,
    ]);
    res.json({ documentos: docs[0] }); // sp devuelve los documentos en el primer índice
  } catch (err) {
    console.error("Error al traer documentos:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Subir documentos y generar tickets + historial
router.post(
  "/private/docs",
  verifyToken,
  upload.array("files"),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0)
        return res.status(400).json({ error: "No se subieron archivos" });

      const userEmail = req.user.email;
      const savedFiles = [];

      for (const file of req.files) {
        // Llamar al SP que inserta documento, ticket e historial
        const result = await customQuery(
          "CALL sp_insert_documento_ticket(?, ?, ?, ?)",
          [file.originalname, "PDF", file.path, userEmail]
        );

        // El SP devuelve id_folio y id_ticket
        const { id_folio, id_ticket } = result[0][0];
        savedFiles.push({ nombre: file.originalname, id_folio, id_ticket });
      }

      res.json({
        message: "Archivos subidos y tickets generados correctamente",
        files: savedFiles,
      });
    } catch (err) {
      console.error("Error en subida de archivos o creación de tickets:", err);
      res
        .status(500)
        .json({ error: "Error al subir documentos y generar tickets" });
    }
  }
);

module.exports = router;
