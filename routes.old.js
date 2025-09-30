// routes.js
require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { customQuery } = require("./db_connection");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// --- Configuración Multer (subida de archivos a /uploads) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads";
    // Crear la carpeta si no existe
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Carpeta '${dir}' creada automáticamente.`);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Middleware de log de todas las peticiones
router.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] Petición ${req.method} '${req.url}'`
  );
  next();
});

// Middleware para verificar token JWT
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) return res.status(401).json({ error: "No autenticado" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err)
      return res.status(403).json({ error: "Token inválido o expirado" });
    req.user = user; // info del usuario disponible en req.user
    next();
  });
}

// --- LOGIN ---
router.post(
  "/auth/login",
  body("email").isEmail().withMessage("Email inválido"),
  body("password").notEmpty().withMessage("La contraseña es requerida"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const rows = await customQuery("CALL defaultdb.sp_login_usuario(?, ?)", [
        email,
        password,
      ]);

      const user = rows[0][0];
      if (!user)
        return res.status(401).json({ error: "Credenciales inválidas" });

      const token = jwt.sign(
        { id: user.idUsuario, email: user.correoElectronico, role: user.rol },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ token, user });
    } catch (err) {
      console.error("Error en login:", err);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

// --- FORGOT PASSWORD ---
router.post(
  "/auth/forgot-password",
  body("email").isEmail().withMessage("Email inválido"),
  body("newPassword")
    .notEmpty()
    .withMessage("La nueva contraseña es requerida"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, newPassword } = req.body;

    try {
      await customQuery("CALL defaultdb.sp_forgot_password(?, ?)", [
        email,
        newPassword,
      ]);

      res.json({ message: "Contraseña actualizada correctamente" });
    } catch (err) {
      console.error("Error en forgot-password:", err);
      res
        .status(500)
        .json({ error: err.sqlMessage || "Error interno del servidor" });
    }
  }
);

// --- RUTAS PRIVADAS ---
router.get("/private/tickets", verifyToken, (req, res) => {
  res.json({ message: "Aquí van tus tickets", user: req.user });
});

router.get("/private/capacitacion", verifyToken, (req, res) => {
  res.json({ message: "Sección de capacitación", user: req.user });
});

// --- DOCUMENTOS ---
// Obtener documentos
router.get("/private/docs", verifyToken, async (req, res) => {
  try {
    const docs = await customQuery(
      "SELECT id_folio, nombreArchivo, tipoDocumento, rutaArchivo FROM documento WHERE id_correoElectronico = ?",
      [req.user.email]
    );
    res.json({ documentos: docs });
  } catch (err) {
    console.error("Error al traer documentos:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Subir documentos usando SP para evitar inyección SQL
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
        // Llamar al stored procedure que inserta documento
        await customQuery("CALL sp_insert_documento(?, ?, ?, ?)", [
          file.originalname,
          "PDF",
          file.path,
          userEmail,
        ]);

        savedFiles.push({ nombre: file.originalname });
      }

      res.json({
        message: "Archivos subidos correctamente",
        files: savedFiles,
      });
    } catch (err) {
      console.error("Error en subida de archivos:", err);
      res.status(500).json({ error: "Error al subir documentos" });
    }
  }
);

module.exports = router;
