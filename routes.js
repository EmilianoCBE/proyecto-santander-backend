// routes.js
require("dotenv").config(); // <-- Cargar variables de entorno al inicio

const express = require("express");
const jwt = require("jsonwebtoken");
const { customQuery } = require("./db_connection");
const { body, validationResult } = require("express-validator");

const router = express.Router();

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

// Ruta de login con validaciones
router.post(
  "/auth/login",
  body("email").isEmail().withMessage("Email inválido"),
  body("password").notEmpty().withMessage("La contraseña es requerida"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Llamar al stored procedure
      const rows = await customQuery("CALL defaultdb.sp_login_usuario(?, ?)", [
        email,
        password,
      ]);

      const user = rows[0][0]; // resultado típico de CALL

      if (!user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // Generar JWT usando la clave secreta de .env
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

// Ruta para cambiar contraseña (forgot password)
router.post(
  "/auth/forgot-password",
  body("email").isEmail().withMessage("Email inválido"),
  body("newPassword")
    .notEmpty()
    .withMessage("La nueva contraseña es requerida"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, newPassword } = req.body;

    try {
      // Llamamos al SP
      await customQuery("CALL defaultdb.sp_forgot_password(?, ?)", [
        email,
        newPassword,
      ]);

      res.json({ message: "Contraseña actualizada correctamente" });
    } catch (err) {
      console.error("Error en forgot-password:", err);
      return res
        .status(500)
        .json({ error: err.sqlMessage || "Error interno del servidor" });
    }
  }
);

// Rutas privadas
router.get("/private/tickets", verifyToken, (req, res) => {
  res.json({ message: "Aquí van tus tickets", user: req.user });
});

router.get("/private/docs", verifyToken, (req, res) => {
  res.json({ message: "Documentos privados", user: req.user });
});

router.get("/private/capacitacion", verifyToken, (req, res) => {
  res.json({ message: "Sección de capacitación", user: req.user });
});

module.exports = router;
