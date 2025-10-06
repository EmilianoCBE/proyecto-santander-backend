const cors = require("cors");
const express = require("express");
const http = require("http");
const path = require("path");

const app = express();
const server = http.createServer(app);
const PORT = 3005;

const router = require("./routes");

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

//Servir la carpeta "uploads" para poder acceder a los PDFs
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/", router);

server.listen(PORT, () =>
  console.log(`Servidor escuchando en http://localhost:${PORT}`)
);
