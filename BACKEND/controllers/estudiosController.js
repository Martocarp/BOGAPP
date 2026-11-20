const db = require("../config/db");
const { borrarEstudios } = require("./adminDelete");
const { borrar: borrarArchivo } = require("../helpers/archivos");

// Admin ve TODOS, profesional solo propios/vinculados, cliente solo aprobados.
// CLIENTE: solo ve estudios aprobados, sus datos públicos y áreas jurídicas.
// ADMIN y PROFESIONAL mantienen el listado original que usan sus paneles.
function listar(req, res) {
  const rol = req.usuario.Tipo_Cuenta;
  let sql, params = [];
  if (rol === 'CLIENTE') {
    sql = `SELECT e.Estudio_ID, e.Nombre, e.Direccion, e.Telefono, e.Estado,
      (SELECT GROUP_CONCAT(ee.Especializacion_ID) FROM Estudios_Especializaciones ee
        WHERE ee.Estudio_ID=e.Estudio_ID) AS Areas_ID,
      (SELECT GROUP_CONCAT(x.Nombre SEPARATOR ', ') FROM Estudios_Especializaciones ee
        JOIN Especializaciones x ON x.Especializacion_ID=ee.Especializacion_ID
        WHERE ee.Estudio_ID=e.Estudio_ID) AS Areas
      FROM Estudios e WHERE e.Estado='APROBADO'`;
  } else {
    sql = `SELECT e.*, CONCAT(u.Nombre, ' ', u.Apellido) AS Solicitante
      FROM Estudios e JOIN Usuarios u ON e.Creado_Por_ID=u.Usuario_ID`;
    if (rol === 'PROFESIONAL') {
      sql += ` WHERE e.Creado_Por_ID=? OR EXISTS
        (SELECT 1 FROM Profesionales_Estudios pe WHERE pe.Estudio_ID=e.Estudio_ID
        AND pe.Usuario_ID=? AND pe.Estado='ACTIVO')`;
      params = [req.usuario.Usuario_ID, req.usuario.Usuario_ID];
    }
  }
  sql += ' ORDER BY e.Fecha_Creacion DESC, e.Estudio_ID DESC';
  db.query(sql, params, (err, rows) => err
    ? res.status(500).json({message:'Error al obtener estudios'}) : res.json(rows));
}

function mis(req, res) {
  const id = req.usuario.Usuario_ID;
  db.query(`SELECT e.*, pe.Rol_Estudio, pe.Estado AS Estado_Vinculo
    FROM Estudios e JOIN Profesionales_Estudios pe ON e.Estudio_ID = pe.Estudio_ID
    WHERE pe.Usuario_ID = ? AND pe.Estado = 'ACTIVO'
    ORDER BY e.Fecha_Creacion DESC, e.Estudio_ID DESC`, [id], (err, rows) =>
    err ? res.status(500).json({ message: "Error al obtener mis estudios" }) : res.json(rows));
}

function buscar(req, res) {
  const rol = req.usuario.Tipo_Cuenta;
  let query = "SELECT * FROM Estudios WHERE Estudio_ID = ?";
  let args = [req.params.id];
  if (rol === "CLIENTE") query += " AND Estado = 'APROBADO'";
  if (rol === "PROFESIONAL") {
    query += ` AND (Creado_Por_ID = ? OR EXISTS
      (SELECT 1 FROM Profesionales_Estudios WHERE Estudio_ID = Estudios.Estudio_ID AND Usuario_ID = ? AND Estado = 'ACTIVO'))`;
    args.push(req.usuario.Usuario_ID, req.usuario.Usuario_ID);
  }
  db.query(query, args, (err, rows) => {
    if (err) return res.status(500).json({ message: "Error al buscar estudio" });
    if (!rows.length) return res.status(404).json({ message: "Estudio no encontrado" });
    return res.json(rows[0]);
  });
}

function crear(req, res) {
  const { Nombre, Direccion, Telefono } = req.body;
  if (typeof Nombre !== "string" || !Nombre.trim()) {
    return res.status(400).json({ message: "El nombre es obligatorio" });
  }
  db.query(`INSERT INTO Estudios (Nombre, Direccion, Telefono, Creado_Por_ID)
    VALUES (?, ?, ?, ?)`, [Nombre.trim(), Direccion || null, Telefono || null, req.usuario.Usuario_ID],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Error al registrar estudio" });
      return res.status(201).json({ message: "Solicitud creada correctamente", estudio_id: results.insertId, estado: "PENDIENTE" });
    });
}

function editar(req, res) {
  const { Nombre, Direccion, Telefono } = req.body;
  if (typeof Nombre !== "string" || !Nombre.trim()) return res.status(400).json({ message: "El nombre es obligatorio" });
  db.query('UPDATE Estudios SET Nombre=?, Direccion=?, Telefono=? WHERE Estudio_ID=?',
    [Nombre.trim(), Direccion || null, Telefono || null, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({message:'Error al modificar estudio'});
      if (!result.affectedRows) return res.status(404).json({message:'Estudio no encontrado'});
      return res.json({message:'Estudio modificado correctamente'});
    });
}

async function cambiarEstado(req, res) {
  const { Estado } = req.body;
  if (!["APROBADO", "RECHAZADO"].includes(Estado)) {
    return res.status(400).json({ message: "Estado no permitido" });
  }
  const conn = await db.promise().getConnection().catch(() => null);
  if (!conn) return res.status(500).json({ message: "Sin conexión a MySQL" });
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(`UPDATE Estudios
      SET Estado = ?, Revisado_Por_ID = ?, Fecha_Revision = NOW()
      WHERE Estudio_ID = ? AND Estado = 'PENDIENTE'`,
      [Estado, req.usuario.Usuario_ID, req.params.id]);
    if (!result.affectedRows) {
      await conn.rollback();
      return res.status(409).json({ message: "Estudio inexistente o ya revisado" });
    }
    if (Estado === "APROBADO") {
      await conn.query(`INSERT INTO Profesionales_Estudios
        (Usuario_ID, Estudio_ID, Rol_Estudio, Origen, Estado)
        SELECT Creado_Por_ID, Estudio_ID, 'ADMIN_ESTUDIO', 'CREADOR', 'ACTIVO'
        FROM Estudios WHERE Estudio_ID = ?`, [req.params.id]);
    }
    await conn.commit();
    return res.json({ message: "Estado actualizado correctamente", estado: Estado });
  } catch (err) {
    await conn.rollback();
    console.error("Error revisando estudio:", err.message);
    return res.status(500).json({ message: "No se pudo actualizar el estudio" });
  } finally { conn.release(); }
}

async function eliminar(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: "ID inválido" });
  const conn = await db.promise().getConnection().catch(() => null);
  if (!conn) return res.status(500).json({ message: "Sin conexión a MySQL" });
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query("SELECT Estudio_ID FROM Estudios WHERE Estudio_ID = ? FOR UPDATE", [id]);
    if (!rows.length) { await conn.rollback(); return res.status(404).json({ message: "Estudio no encontrado" }); }
    // A diferencia del borrado anterior, el super admin puede borrar un estudio APROBADO,
    // eliminando también sus relaciones y casos en una misma transacción.
    const archivos = await borrarEstudios(conn, [id]);
    await conn.commit();
    await Promise.all((archivos || []).map(borrarArchivo));
    return res.json({ message: "Estudio y datos relacionados eliminados" });
  } catch (err) {
    await conn.rollback();
    console.error("Error eliminando estudio:", err.message);
    return res.status(409).json({ message: "No se pudo eliminar el estudio por sus dependencias" });
  } finally { conn.release(); }
}

function profesionales(req, res) {
  db.query(`SELECT u.Usuario_ID, u.Nombre, u.Apellido, u.Email, u.Matricula,
      pe.Rol_Estudio, pe.Estado, pe.Origen, pe.Fecha_Solicitud
    FROM Profesionales_Estudios pe
    JOIN Usuarios u ON u.Usuario_ID = pe.Usuario_ID
    WHERE pe.Estudio_ID = ? ORDER BY pe.Rol_Estudio, u.Apellido, u.Nombre`,
    [req.params.id], (err, rows) => err ? res.status(500).json({ message: "Error al listar profesionales" }) : res.json(rows));
}
function agregarProfesional(req, res) {
  const { Usuario_ID, Rol_Estudio } = req.body;
  if (!Number.isInteger(Number(Usuario_ID)) || !["ABOGADO", "ADMIN_ESTUDIO"].includes(Rol_Estudio)) {
    return res.status(400).json({ message: "Usuario y rol válidos obligatorios" });
  }
  db.query("SELECT Usuario_ID FROM Usuarios WHERE Usuario_ID = ? AND Tipo_Cuenta = 'PROFESIONAL' AND Estado = 1", [Usuario_ID], (err, users) => {
    if (err) return res.status(500).json({ message: "Error al verificar profesional" });
    if (!users.length) return res.status(400).json({ message: "El usuario no es profesional activo" });
    db.query("SELECT Estudio_ID FROM Estudios WHERE Estudio_ID = ? AND Estado = 'APROBADO'", [req.params.id], (err, studios) => {
      if (err) return res.status(500).json({ message: "Error al consultar estudio" });
      if (!studios.length) return res.status(400).json({ message: "El estudio debe estar aprobado" });
      db.query(`INSERT INTO Profesionales_Estudios
        (Usuario_ID, Estudio_ID, Rol_Estudio, Origen, Estado)
        VALUES (?, ?, ?, 'INVITACION', 'ACTIVO')`, [Usuario_ID, req.params.id, Rol_Estudio], (err) => {
        if (err?.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Este profesional ya está vinculado" });
        if (err) return res.status(500).json({ message: "No se pudo agregar profesional" });
        return res.status(201).json({ message: "Profesional vinculado correctamente" });
      });
    });
  });
}
function quitarProfesional(req, res) {
  const estudioId = Number(req.params.id), usuarioId = Number(req.params.usuarioId);
  // No dejar un estudio aprobado sin ningún ADMIN_ESTUDIO activo.
  db.query(`SELECT Rol_Estudio FROM Profesionales_Estudios WHERE Estudio_ID=? AND Usuario_ID=?`,
    [estudioId, usuarioId], (err, rows) => {
      if (err) return res.status(500).json({ message: "Error al verificar profesional" });
      if (!rows.length) return res.status(404).json({ message: "Vínculo inexistente" });
      const eliminar = () => db.query("DELETE FROM Profesionales_Estudios WHERE Estudio_ID=? AND Usuario_ID=?",
        [estudioId, usuarioId], (err, result) => {
          if (err) return res.status(409).json({ message: "Profesional asignado a expedientes. Reasigná los casos primero" });
          if (!result.affectedRows) return res.status(404).json({ message: "Vínculo inexistente" });
          return res.json({ message: "Profesional desvinculado" });
        });
      if (rows[0].Rol_Estudio !== 'ADMIN_ESTUDIO') return eliminar();
      db.query(`SELECT COUNT(*) AS total FROM Profesionales_Estudios WHERE Estudio_ID=?
        AND Rol_Estudio='ADMIN_ESTUDIO' AND Estado='ACTIVO'`, [estudioId], (err, totals) => {
        if (err) return res.status(500).json({ message: "Error al comprobar administradores" });
        if (totals[0].total <= 1) return res.status(409).json({ message: "El estudio debe conservar al menos un ADMIN_ESTUDIO activo" });
        eliminar();
      });
    });
}

module.exports = { listar, mis, buscar, crear, editar, cambiarEstado, eliminar, profesionales, agregarProfesional, quitarProfesional };
