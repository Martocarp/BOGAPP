const jwt = require("jsonwebtoken");
const connection = require("../config/db");

// El JWT solo incluye el ID. Rol y estado se consultan SIEMPRE en MySQL.
function autenticar(req, res, next) {
  const token = req.cookies && req.cookies.bogapp_session;
  if (!token) return res.status(401).json({ message: "Iniciá sesión para continuar" });
  let datos;
  try {
    datos = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch (err) {
    return res.status(401).json({ message: "Sesión vencida o inválida" });
  }
  connection.query(
    "SELECT Usuario_ID, Nombre, Apellido, Email, Tipo_Cuenta, Matricula FROM Usuarios WHERE Usuario_ID = ? AND Estado = 1",
    [datos.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Error al comprobar sesión" });
      if (!results.length) return res.status(401).json({ message: "Cuenta no disponible" });
      req.usuario = results[0];
      next();
    }
  );
}

function permitirRoles(...roles) {
  return function (req, res, next) {
    if (!req.usuario || !roles.includes(req.usuario.Tipo_Cuenta)) {
      return res.status(403).json({ message: "No tenés permisos para esta acción" });
    }
    next();
  };
}

module.exports = { autenticar, permitirRoles };
