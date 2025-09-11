// db_connection.js
const mysql = require("mysql2");
const fs = require("fs");

const ca = fs.readFileSync("ca.pem");

const pool = mysql.createPool({
  host: process.env.AIVEN_HOST,
  port: process.env.AIVEN_PORT,
  user: process.env.AIVEN_USER,
  password: process.env.AIVEN_PASSWORD,
  database: "defaultdb",
  ssl: { ca },
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
