const mysql = require("mysql2");
const fs = require("fs");

const ca = fs.readFileSync("ca.pem");

const dbConnection = mysql.createConnection({
  host: process.env.AIVEN_HOST,
  port: process.env.AIVEN_PORT,
  user: process.env.AIVEN_USER,
  password: process.env.AIVEN_PASSWORD,
  database: "defaultdb",
  ssl: { ca }
});

dbConnection.connect((err) => {

  if (err) {
    console.error("[Aiven DB]: Error de conexión", err);
    return;
  };

  console.log("[Aiven DB]: Conectado a MySQL en Aiven");

  // ejemplo: consulta simple
  dbConnection.query("SELECT NOW() AS fecha", (err, results) => {
    if (err) {
      console.error("Error en consulta:", err);
    } else {
      console.log("Resultado:", results);
    }

    // cerrar conexión
    dbConnection.end();
  });
});

async function customQuery (query) {

    let res = await dbConnection.query(query);

    return res;

};

module.exports = {
    customQuery,
};