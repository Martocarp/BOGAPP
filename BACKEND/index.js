require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

// CONEXIÓN A MYSQL

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect(function (err) {
  if (err) {
    console.log("Error de conexión:", err.message);
    return;
  }

  console.log("BOGAPP conectado a MySQL");
});

// RUTA PRINCIPAL

app.get("/", function (req, res) {
  res.send("Bienvenido a la API de BOGAPP");
});

// OBTENER CLIENTES

app.get("/clientes", function (req, res) {
  const consulta = "SELECT * FROM Clientes";

  connection.query(consulta, function (err, results) {
    if (err) {
      console.log("Error:", err.message);
      return res.status(500).json({
        message: "Error al obtener clientes",
      });
    }

    res.status(200).json(results);
  });
});

//TESTEO DB

app.get("/test", function (req, res) {
  const consulta = "SELECT COUNT(*) AS total FROM Usuarios";

  connection.query(consulta, (err, results) => {
    if (err) {
      console.log("Error:", err.message);
      return res.status(500).json({
        message: "Error al consultar MySQL",
      });
    }

    res.status(200).json({
      message: "Conexión correcta",
      usuarios: results[0].total,
    });
  });
});

app.get("/users", function (req, res) {
  const consulta =
    "SELECT Nombre,Apellido,Email,Tipo_cuenta,fecha_registro FROM Usuarios";

  connection.query(consulta, (err, results) => {
    if (err) {
      console.log("Error:", err.message);
      return res.status(500).json({
        message: "Error al consultar MySQL",
      });
    }

    res.status(200).json({
      message: "USUARIOS",
      usuarios: results,
    });
  });
});

app.post("/users", function (req, res) {
  const { Nombre, Apellido, Email, Tipo_Cuenta } = req.body;

  if (!Nombre || !Apellido || !Email || !Tipo_Cuenta) {
    return res.status(400).json({
      message: "Faltan datos obligatorios",
    });
  }

  if (Tipo_Cuenta !== "CLIENTE" && Tipo_Cuenta !== "PROFESIONAL") {
    return res.status(400).json({
      message: "Tipo de cuenta no permitido",
    });
  }

  const consulta = `INSERT INTO Usuarios
    (Nombre, Apellido, Email, Tipo_Cuenta)
    VALUES (?, ?, ?, ?)`;

  connection.query(
    consulta,
    [Nombre, Apellido, Email, Tipo_Cuenta],
    (err, results) => {
      if (err) {
        console.log("Error:", err.message);

        return res.status(500).json({
          message: "Error al crear usuario",
        });
      }

      res.status(201).json({
        message: "Usuario creado correctamente",
        id: results.insertId,
      });
    },
  );
});

app.get("/users/:id", function (req, res) {
  const { id } = req.params;

  const consulta =
    "SELECT Usuario_ID, Nombre, Apellido, Email, Tipo_Cuenta FROM Usuarios WHERE Usuario_ID = ?";

  connection.query(consulta, [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Error al consultar MySQL",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    res.status(200).json(results[0]);
  });
});

app.delete("/users/:id", function (req, res) {
  const { id } = req.params;

  const consulta = "DELETE FROM Usuarios WHERE Usuario_ID = ?";

  connection.query(consulta, [id], (err, results) => {
    if (err) {
      console.log("Error:", err.message);
      return res.status(500).json({
        message: "Error al eliminar usuario",
      });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    res.status(200).json({
      message: "Usuario eliminado correctamente",
    });
  });
});

app.put("/users/:id", function (req, res) {
  const { id } = req.params;
  const { Nombre, Apellido, Email, Tipo_Cuenta } = req.body;

  if (!Nombre || !Apellido || !Email || !Tipo_Cuenta) {
    return res.status(400).json({
      message: "Faltan datos obligatorios",
    });
  }

  if (Tipo_Cuenta !== "CLIENTE" && Tipo_Cuenta !== "PROFESIONAL") {
    return res.status(400).json({
      message: "Tipo de cuenta no permitido",
    });
  }

  const consulta = `
    UPDATE Usuarios
    SET Nombre = ?, Apellido = ?, Email = ?, Tipo_Cuenta = ?
    WHERE Usuario_ID = ?
  `;

  connection.query(
    consulta,
    [Nombre, Apellido, Email, Tipo_Cuenta, id],
    (err, results) => {
      if (err) {
        console.log("Error:", err.message);
        return res.status(500).json({
          message: "Error al modificar usuario",
        });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({
          message: "Usuario no encontrado",
        });
      }

      res.status(200).json({
        message: "Usuario modificado correctamente",
      });
    },
  );
});

// SERVIDOR

app.listen(8000, function () {
  console.log("Servidor funcionando en puerto 8000");
});
