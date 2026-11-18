require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const db = require("./config/db");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes("REEMPLAZAR")) {
  console.error("Falta JWT_SECRET (mínimo 32 caracteres) en BACKEND/.env");
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 8000;
app.use(express.json({ limit: "100kb" }));
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(cookieParser());

app.get("/", function (req, res) { res.send("Bienvenido a la API de BOGAPP"); });
app.get("/test", function (req, res) {
  db.query("SELECT COUNT(*) AS total FROM Usuarios", (err, results) => {
    if (err) return res.status(500).json({ message: "Error al consultar MySQL" });
    return res.json({ message: "Conexión correcta", usuarios: results[0].total });
  });
});

app.use("/auth", require("./routes/authRoutes"));
app.use("/users", require("./routes/usuariosRoutes"));
app.use("/estudios", require("./routes/estudiosRoutes"));
app.use("/admin", require("./routes/adminRoutes"));
app.use("/", require("./routes/listadosRoutes"));

app.use(function (req, res) { res.status(404).json({ message: "Ruta inexistente" }); });
app.use(function (err, req, res, next) {
  console.error("Error Express:", err.message);
  res.status(500).json({ message: "Error interno del servidor" });
});

db.query("SELECT 1", (err) => {
  if (err) console.error("No se pudo conectar con MySQL:", err.message);
  else console.log("BOGAPP conectado a MySQL");
});
app.listen(PORT, function () { console.log(`Servidor funcionando en puerto ${PORT}`); });
