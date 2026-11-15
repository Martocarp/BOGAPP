require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 8000;

app.use(express.json());
app.use(cors());

// ============================================================
// 1. CONEXIÓN A MYSQL
// ============================================================

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

// ============================================================
// 2. RUTAS GENERALES
// ============================================================

// GET - Inicio de la API
app.get("/", function (req, res) {
  res.send("Bienvenido a la API de BOGAPP");
});

// GET - Probar conexión a MySQL
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

// ============================================================
// 3. USUARIOS
// ============================================================

// GET - Todos los usuarios (sin mostrar contraseñas)
app.get("/users", function (req, res) {
  const consulta = `
    SELECT Usuario_ID, Nombre, Apellido, Email, Tipo_Cuenta, Fecha_Registro
    FROM Usuarios
  `;

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

// GET - Usuario por ID
app.get("/users/:id", function (req, res) {
  const { id } = req.params;

  const consulta = `
    SELECT Usuario_ID, Nombre, Apellido, Email, Tipo_Cuenta
    FROM Usuarios
    WHERE Usuario_ID = ?
  `;

  connection.query(consulta, [id], (err, results) => {
    if (err) {
      console.log("Error:", err.message);
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

// POST - Registrar usuario con contraseña
app.post("/users", function (req, res) {
  const { Nombre, Apellido, Email, Password, Tipo_Cuenta } = req.body;

  if (!Nombre || !Apellido || !Email || !Password || !Tipo_Cuenta) {
    return res.status(400).json({
      message: "Faltan datos obligatorios",
    });
  }

  if (Tipo_Cuenta !== "CLIENTE" && Tipo_Cuenta !== "PROFESIONAL") {
    return res.status(400).json({
      message: "Tipo de cuenta no permitido",
    });
  }

  if (typeof Password !== "string" || Password.length < 8) {
    return res.status(400).json({
      message: "La contraseña debe tener al menos 8 caracteres",
    });
  }

  bcrypt.hash(Password, 10, (err, hash) => {
    if (err) {
      console.log("Error al generar hash:", err.message);
      return res.status(500).json({
        message: "Error al procesar contraseña",
      });
    }

    const consulta = `
      INSERT INTO Usuarios (Nombre, Apellido, Email, Password_Hash, Tipo_Cuenta)
      VALUES (?, ?, ?, ?, ?)
    `;

    connection.query(
      consulta,
      [Nombre, Apellido, Email, hash, Tipo_Cuenta],
      (err, results) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
              message: "Email ya registrado",
            });
          }

          console.log("Error:", err.message);
          return res.status(500).json({
            message: "Error al crear usuario",
          });
        }

        res.status(201).json({
          message: "Usuario creado correctamente",
          id: results.insertId,
        });
      }
    );
  });
});

// PUT - Modificar usuario (no cambia su contraseña)
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
    }
  );
});

// DELETE - Eliminar usuario
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

// GET - Usuarios con cuenta de cliente
// En BOGAPP los clientes están en Usuarios, no en una tabla Clientes.
app.get("/clientes", function (req, res) {
  const consulta = `
    SELECT Usuario_ID, Nombre, Apellido, Email, Fecha_Registro
    FROM Usuarios
    WHERE Tipo_Cuenta = 'CLIENTE'
  `;

  connection.query(consulta, (err, results) => {
    if (err) {
      console.log("Error:", err.message);
      return res.status(500).json({
        message: "Error al obtener clientes",
      });
    }

    res.status(200).json(results);
  });
});

// ============================================================
// 4. ESTUDIOS JURÍDICOS
// ============================================================

// GET - Todos los estudios
app.get("/estudios", function (req, res) {
  const consulta = "SELECT * FROM Estudios";

  connection.query(consulta, (err, results) => {
    if (err) {
      console.log("Error:", err.message);
      return res.status(500).json({
        message: "Error al obtener estudios",
      });
    }

    res.status(200).json(results);
  });
});

// GET - Estudio por ID
app.get("/estudios/:id", function (req, res) {
  const { id } = req.params;
  const consulta = "SELECT * FROM Estudios WHERE Estudio_ID = ?";

  connection.query(consulta, [id], (err, results) => {
    if (err) {
      console.log("Error:", err.message);
      return res.status(500).json({
        message: "Error al buscar estudio",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Estudio no encontrado",
      });
    }

    res.status(200).json(results[0]);
  });
});

// POST - Solicitar creación de estudio (queda PENDIENTE)
app.post("/estudios", function (req, res) {
  const { Nombre, Direccion, Telefono, Creado_Por_ID } = req.body;

  if (!Nombre || !Creado_Por_ID) {
    return res.status(400).json({
      message: "Faltan datos obligatorios",
    });
  }

  const verificar = `
    SELECT Tipo_Cuenta
    FROM Usuarios
    WHERE Usuario_ID = ? AND Estado = 1
  `;

  connection.query(verificar, [Creado_Por_ID], (err, results) => {
    if (err) {
      console.log("Error:", err.message);
      return res.status(500).json({
        message: "Error al verificar usuario",
      });
    }

    if (results.length === 0 || results[0].Tipo_Cuenta !== "PROFESIONAL") {
      return res.status(403).json({
        message: "Solo profesionales activos pueden solicitar estudios",
      });
    }

    const consulta = `
      INSERT INTO Estudios (Nombre, Direccion, Telefono, Creado_Por_ID)
      VALUES (?, ?, ?, ?)
    `;

    connection.query(
      consulta,
      [Nombre, Direccion || null, Telefono || null, Creado_Por_ID],
      (err, results) => {
        if (err) {
          console.log("Error:", err.message);
          return res.status(500).json({
            message: "Error al registrar estudio",
          });
        }

        res.status(201).json({
          message: "Solicitud creada correctamente",
          estudio_id: results.insertId,
          estado: "PENDIENTE",
        });
      }
    );
  });
});

// PUT - Modificar datos de estudio
app.put("/estudios/:id", function (req, res) {
  const { id } = req.params;
  const { Nombre, Direccion, Telefono } = req.body;

  if (!Nombre) {
    return res.status(400).json({
      message: "El nombre es obligatorio",
    });
  }

  const consulta = `
    UPDATE Estudios
    SET Nombre = ?, Direccion = ?, Telefono = ?
    WHERE Estudio_ID = ?
  `;

  connection.query(
    consulta,
    [Nombre, Direccion || null, Telefono || null, id],
    (err, results) => {
      if (err) {
        console.log("Error:", err.message);
        return res.status(500).json({
          message: "Error al modificar estudio",
        });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({
          message: "Estudio no encontrado",
        });
      }

      res.status(200).json({
        message: "Estudio modificado correctamente",
      });
    }
  );
});

// PATCH - Aprobar o rechazar estudio (simulación de Super Admin)
app.patch("/estudios/:id/estado", function (req, res) {
  const { id } = req.params;
  const { Estado, Revisado_Por_ID } = req.body;

  if (!["APROBADO", "RECHAZADO"].includes(Estado)) {
    return res.status(400).json({
      message: "Estado no permitido",
    });
  }

  if (!Revisado_Por_ID) {
    return res.status(400).json({
      message: "Falta el administrador revisor",
    });
  }

  const verificar = `
    SELECT Usuario_ID
    FROM Usuarios
    WHERE Usuario_ID = ? AND Tipo_Cuenta = 'ADMIN_BOGAPP' AND Estado = 1
  `;

  connection.query(verificar, [Revisado_Por_ID], (err, admins) => {
    if (err) {
      console.log("Error:", err.message);
      return res.status(500).json({
        message: "Error al verificar administrador",
      });
    }

    if (admins.length === 0) {
      return res.status(403).json({
        message: "El revisor debe ser Admin",
      });
    }

    // Si se aprueba, las dos operaciones se guardan juntas.
    connection.beginTransaction((err) => {
      if (err) {
        return res.status(500).json({
          message: "Error al iniciar operación",
        });
      }

      const consulta = `
        UPDATE Estudios
        SET Estado = ?, Revisado_Por_ID = ?, Fecha_Revision = NOW()
        WHERE Estudio_ID = ? AND Estado = 'PENDIENTE'
      `;

      connection.query(consulta, [Estado, Revisado_Por_ID, id], (err, results) => {
        if (err) {
          return connection.rollback(() => {
            res.status(500).json({ message: "Error al actualizar estado" });
          });
        }

        if (results.affectedRows === 0) {
          return connection.rollback(() => {
            res.status(409).json({ message: "Estudio inexistente o ya revisado" });
          });
        }

        const guardarCambios = () => {
          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                res.status(500).json({ message: "Error al guardar cambios" });
              });
            }

            res.status(200).json({
              message: "Estado actualizado correctamente",
              estado: Estado,
            });
          });
        };

        if (Estado === "RECHAZADO") {
          return guardarCambios();
        }

        const vincular = `
          INSERT INTO Profesionales_Estudios
          (Usuario_ID, Estudio_ID, Rol_Estudio, Origen, Estado)
          SELECT Creado_Por_ID, Estudio_ID, 'ADMIN_ESTUDIO', 'CREADOR', 'ACTIVO'
          FROM Estudios
          WHERE Estudio_ID = ?
        `;

        connection.query(vincular, [id], (err) => {
          if (err) {
            console.log("Error:", err.message);
            return connection.rollback(() => {
              res.status(500).json({
                message: "Error al asignar administrador del estudio",
              });
            });
          }

          guardarCambios();
        });
      });
    });
  });
});

// DELETE - Eliminar estudio pendiente o rechazado
app.delete("/estudios/:id", function (req, res) {
  const { id } = req.params;
  const consulta = `
    DELETE FROM Estudios
    WHERE Estudio_ID = ? AND Estado IN ('PENDIENTE', 'RECHAZADO')
  `;

  connection.query(consulta, [id], (err, results) => {
    if (err) {
      console.log("Error:", err.message);
      return res.status(500).json({
        message: "No se pudo eliminar el estudio",
      });
    }

    if (results.affectedRows === 0) {
      return res.status(409).json({
        message: "Estudio inexistente o aprobado. No se puede eliminar",
      });
    }

    res.status(200).json({
      message: "Estudio eliminado correctamente",
    });
  });
});

// ============================================================
// 5. INICIAR SERVIDOR
// ============================================================

app.listen(PORT, function () {
  console.log(`Servidor funcionando en puerto ${PORT}`);
});
