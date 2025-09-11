// db_connection.js
const mysql = require("mysql2");
const fs = require("fs");
const os = require("os"); // para detectar sistema operativo

let sslConfig;

// Intentamos usar el CA de Aiven
try {
  const ca = fs.readFileSync("ca.pem");
  sslConfig = { ca };

  // Si estamos en Windows, agregamos minVersion TLS para evitar HANDSHAKE_NO_SSL_SUPPORT
  if (os.platform() === "win32") {
    sslConfig.minVersion = "TLSv1.2";
  }
} catch (err) {
  console.warn("No se pudo leer ca.pem, se usará SSL sin validar (solo desarrollo):", err);
  sslConfig = { rejectUnauthorized: false }; // fallback inseguro, solo dev
}

const pool = mysql.createPool({
  host: process.env.AIVEN_HOST,
  port: process.env.AIVEN_PORT,
  user: process.env.AIVEN_USER,
  password: process.env.AIVEN_PASSWORD,
  database: "defaultdb",
  ssl: sslConfig,
});

// convierte el pool a promesas
const promisePool = pool.promise();

async function customQuery(query, params = []) {
  try {
    const [rows] = await promisePool.query(query, params);
    return rows;
  } catch (err) {
    console.error("Error en query:", err);
    throw err;
  }
}

module.exports = {
  customQuery,
};