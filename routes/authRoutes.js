const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { customQuery } = require("../db_connection");
const jwt = require("jsonwebtoken");

// LOGIN
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

// FORGOT PASSWORD
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

module.exports = router;
