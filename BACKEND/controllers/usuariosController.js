const db = require("../config/db");
const { borrarUsuario } = require("./adminDelete");

function listar(req, res) {
  db.query(
    `SELECT Usuario_ID, Nombre, Apellido, Email, Tipo_Cuenta, Matricula, Estado, Fecha_Registro
     FROM Usuarios ORDER BY Fecha_Registro DESC, Usuario_ID DESC`,
    (err, results) => err ? res.status(500).json({ message: "Error al obtener usuarios" })
      : res.json({ message: "USUARIOS", usuarios: results })
  );
}
function buscar(req, res) {
  db.query(`SELECT Usuario_ID, Nombre, Apellido, Email, Tipo_Cuenta, Matricula, Estado, Fecha_Registro
            FROM Usuarios WHERE Usuario_ID = ?`, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error al buscar usuario" });
    if (!rows.length) return res.status(404).json({ message: "Usuario no encontrado" });
    return res.json(rows[0]);
  });
}
function editar(req, res) {
  const { Nombre, Apellido, Email, Tipo_Cuenta, Matricula } = req.body;
  if (![Nombre, Apellido, Email].every(s => typeof s === "string" && s.trim()) ||
      !["CLIENTE", "PROFESIONAL"].includes(Tipo_Cuenta)) {
    return res.status(400).json({ message: "Datos inválidos. Admin no se asigna con esta ruta" });
  }
  if (!/^\S+@\S+\.\S+$/.test(Email.trim())) return res.status(400).json({ message: "Email inválido" });
  if (Matricula !== undefined && Matricula !== null && typeof Matricula !== "string") {
    return res.status(400).json({ message: "Matrícula inválida" });
  }
  db.query("SELECT Tipo_Cuenta FROM Usuarios WHERE Usuario_ID = ?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error al buscar usuario" });
    if (!rows.length) return res.status(404).json({ message: "Usuario no encontrado" });
    if (rows[0].Tipo_Cuenta === "ADMIN_BOGAPP") return res.status(403).json({ message: "No modificar cuentas Super Admin desde este formulario" });
    if (rows[0].Tipo_Cuenta !== Tipo_Cuenta) {
      return res.status(409).json({ message: "No se puede cambiar el tipo de una cuenta existente. Creá una cuenta del otro tipo" });
    }
    db.query(`UPDATE Usuarios SET Nombre = ?, Apellido = ?, Email = ?, Tipo_Cuenta = ?, Matricula = ?
      WHERE Usuario_ID = ?`, [Nombre.trim(), Apellido.trim(), Email.trim().toLowerCase(), Tipo_Cuenta,
      Tipo_Cuenta === "PROFESIONAL" ? (Matricula?.trim() || null) : null, req.params.id], (err, result) => {
      if (err?.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Email ya utilizado" });
      if (err) return res.status(500).json({ message: "Error al modificar usuario" });
      return res.json({ message: "Usuario modificado correctamente" });
    });
  });
}
async function eliminar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: "ID inválido" });
  if (id === req.usuario.Usuario_ID) return res.status(403).json({ message: "No podés borrar tu propia cuenta" });
  const conn = await db.promise().getConnection().catch(() => null);
  if (!conn) return res.status(500).json({ message: "Error de conexión" });
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query("SELECT Usuario_ID, Tipo_Cuenta FROM Usuarios WHERE Usuario_ID = ? FOR UPDATE", [id]);
    if (!rows.length) { await conn.rollback(); return res.status(404).json({ message: "Usuario no encontrado" }); }
    if (rows[0].Tipo_Cuenta === "ADMIN_BOGAPP") {
      await conn.rollback(); return res.status(403).json({ message: "No se eliminan otros Super Admin desde el panel" });
    }
    await borrarUsuario(conn, id);
    await conn.commit();
    return res.json({ message: "Usuario y sus datos relacionados eliminados correctamente" });
  } catch (err) {
    await conn.rollback();
    console.error("Error borrando usuario:", err.message);
    return res.status(409).json({ message: "No se pudo borrar el usuario. Revisá sus dependencias en MySQL" });
  } finally { conn.release(); }
}
function clientes(req, res) {
  db.query(`SELECT Usuario_ID, Nombre, Apellido, Email, Fecha_Registro FROM Usuarios
    WHERE Tipo_Cuenta = 'CLIENTE' AND Estado = 1 ORDER BY Usuario_ID DESC`, (err, rows) =>
    err ? res.status(500).json({ message: "Error al obtener clientes" }) : res.json(rows));
}
function profesionales(req, res) {
  db.query(`SELECT Usuario_ID, Nombre, Apellido, Email, Matricula, Estado FROM Usuarios
    WHERE Tipo_Cuenta = 'PROFESIONAL' ORDER BY Usuario_ID DESC`, (err, rows) =>
    err ? res.status(500).json({ message: "Error al obtener profesionales" }) : res.json(rows));
}
module.exports = { listar, buscar, editar, eliminar, clientes, profesionales };
