const db = require("../config/db");

// Admin BOGAPP administra todos los estudios; ADMIN_ESTUDIO solo los suyos.

function adminDeEstudio(req, res, next) {
  if (req.usuario.Tipo_Cuenta === "ADMIN_BOGAPP") return next();
  if (req.usuario.Tipo_Cuenta !== "PROFESIONAL") {
    return res.status(403).json({ message: "Acceso no autorizado" });
  }
  db.query(`SELECT Vinculo_ID FROM Profesionales_Estudios
    WHERE Usuario_ID = ? AND Estudio_ID = ? AND Rol_Estudio = 'ADMIN_ESTUDIO' AND Estado = 'ACTIVO'`,
    [req.usuario.Usuario_ID, req.params.id], (err, rows) => {
      if (err) return res.status(500).json({ message: "Error al verificar permisos del estudio" });
      if (!rows.length) return res.status(403).json({ message: "No administrás este estudio" });
      next();
    });
}
module.exports = { adminDeEstudio };
