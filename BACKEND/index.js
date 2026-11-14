const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

console.log("HOST:", process.env.DB_HOST);
console.log("USER:", process.env.DB_USER);
console.log("DATABASE:", process.env.DB_NAME);

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect((error) => {
  if (error) {
    console.log("Error al conectar MySQL:", error.message);
    return;
  }
  console.log("CONEXION EXITOSA");
});

app.get("/", (req, res) => {
  res.send("API");
});

app.listen(8000, () => {
  console.log("Servidor funcionando en puerto 8000");
});
