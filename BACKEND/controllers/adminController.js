const db = require("../config/db");

function resumen(req, res) {
  const sql = `SELECT
   (SELECT COUNT(*) FROM Usuarios) AS usuarios,
   (SELECT COUNT(*) FROM Usuarios WHERE Tipo_Cuenta = 'PROFESIONAL') AS profesionales,
   (SELECT COUNT(*) FROM Usuarios WHERE Tipo_Cuenta = 'CLIENTE') AS clientes,
   (SELECT COUNT(*) FROM Estudios) AS estudios,
   (SELECT COUNT(*) FROM Estudios WHERE Estado = 'PENDIENTE') AS pendientes,
   (SELECT COUNT(*) FROM Estudios WHERE Estado = 'APROBADO') AS aprobados,
   (SELECT COUNT(*) FROM Estudios WHERE Estado = 'RECHAZADO') AS rechazados`;
  db.query(sql, (err, rows) => err ? res.status(500).json({ message: "Error al cargar dashboard" }) : res.json(rows[0]));
}
module.exports = { resumen };
