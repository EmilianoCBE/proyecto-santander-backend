const cors = require("cors");
const express = require("express");
const http = require("http");

const app = express();
const server = http.createServer(app);

const PORT = 3005;

const router = require("./routes.js");

app.use(cors({ origin: "http://localhost:5173" }));

app.use(express.json());

app.use("/", router);

server.listen(PORT);

console.log(`Escuchando desde el puerto ${PORT}`);
