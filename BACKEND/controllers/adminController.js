const db = require('../config/db');

function resumen(req, res) {
  const { desde, hasta } = req.query;
  const hayFechas = desde !== undefined || hasta !== undefined;
  if (hayFechas && (!/^\d{4}-\d{2}-\d{2}$/.test(desde || '') || !/^\d{4}-\d{2}-\d{2}$/.test(hasta || '') || desde > hasta || !Number.isFinite(Date.parse(desde)) || !Number.isFinite(Date.parse(hasta)))) {
    return res.status(400).json({ message: 'Rango de fechas inválido' });
  }
  // En RANGOS: usuarios y estudios creados en fechas; aprobaciones y rechazos REVISADOS en fechas.
  const f = hayFechas;
  const sql = `SELECT
    (SELECT COUNT(*) FROM Usuarios ${f ? 'WHERE DATE(Fecha_Registro) BETWEEN ? AND ?' : ''}) AS usuarios,
    (SELECT COUNT(*) FROM Usuarios WHERE Tipo_Cuenta = 'PROFESIONAL' ${f ? 'AND DATE(Fecha_Registro) BETWEEN ? AND ?' : ''}) AS profesionales,
    (SELECT COUNT(*) FROM Usuarios WHERE Tipo_Cuenta = 'CLIENTE' ${f ? 'AND DATE(Fecha_Registro) BETWEEN ? AND ?' : ''}) AS clientes,
    (SELECT COUNT(*) FROM Estudios ${f ? 'WHERE DATE(Fecha_Creacion) BETWEEN ? AND ?' : ''}) AS estudios,
    (SELECT COUNT(*) FROM Estudios WHERE Estado = 'PENDIENTE' ${f ? 'AND DATE(Fecha_Creacion) BETWEEN ? AND ?' : ''}) AS pendientes,
    (SELECT COUNT(*) FROM Estudios WHERE Estado = 'APROBADO' ${f ? 'AND DATE(Fecha_Revision) BETWEEN ? AND ?' : ''}) AS aprobados,
    (SELECT COUNT(*) FROM Estudios WHERE Estado = 'RECHAZADO' ${f ? 'AND DATE(Fecha_Revision) BETWEEN ? AND ?' : ''}) AS rechazados`;
  const params = f ? Array(7).fill([desde, hasta]).flat() : [];
  db.query(sql, params, (err, rows) => err ? res.status(500).json({ message: 'Error al cargar dashboard' }) : res.json(rows[0]));
}
module.exports = { resumen };
