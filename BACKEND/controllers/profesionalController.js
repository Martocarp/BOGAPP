const fs = require('node:fs/promises');
const { db, estudioDe, intId } = require('../helpers/permisos');
const { guardar, borrar, descargar } = require('../helpers/archivos');
const { autenticar, permitirRoles } = require('../middlewares/authMiddleware');
const dbCb = require('../config/db');
function error(res, e, message = 'Error al consultar MySQL') {
  console.error(message, e.message); return res.status(500).json({ message });
}
async function especializaciones(req, res) {
  try { const [rows] = await db.query('SELECT * FROM Especializaciones ORDER BY Nombre'); return res.json(rows); }
  catch (e) { return error(res, e, 'Ejecutá primero la migración de profesionales'); }
}
async function perfil(req, res) {
  try {
    const [rows] = await db.query(`SELECT u.Usuario_ID, u.Nombre, u.Apellido, u.Email, u.Matricula,
      p.Biografia, p.Cv_Nombre, p.Cv_Visible, p.Fecha_Actualizacion
      FROM Usuarios u LEFT JOIN Perfiles_Profesionales p ON p.Usuario_ID = u.Usuario_ID
      WHERE u.Usuario_ID = ?`, [req.usuario.Usuario_ID]);
    const [esp] = await db.query('SELECT Especializacion_ID FROM Profesionales_Especializaciones WHERE Usuario_ID = ?', [req.usuario.Usuario_ID]);
    return res.json({ ...rows[0], especializaciones: esp.map(x => x.Especializacion_ID) });
  } catch (e) { return error(res, e); }
}
async function editarPerfil(req, res) {
  const { Biografia = '', Matricula = '', especializaciones = [], Cv_Visible = false } = req.body;
  if (typeof Biografia !== 'string' || Biografia.length > 2000 || typeof Matricula !== 'string' || Matricula.length > 50 ||
      !Array.isArray(especializaciones) || especializaciones.length > 20 ||
      !especializaciones.every(x => intId(x)) || new Set(especializaciones.map(Number)).size !== especializaciones.length) {
    return res.status(400).json({ message: 'Datos de perfil inválidos' });
  }
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE Usuarios SET Matricula = ? WHERE Usuario_ID = ?', [Matricula.trim() || null, req.usuario.Usuario_ID]);
    await conn.query(`INSERT INTO Perfiles_Profesionales (Usuario_ID, Biografia, Cv_Visible) VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE Biografia = VALUES(Biografia), Cv_Visible = VALUES(Cv_Visible)`,
      [req.usuario.Usuario_ID, Biografia.trim(), !!Cv_Visible]);
    await conn.query('DELETE FROM Profesionales_Especializaciones WHERE Usuario_ID = ?', [req.usuario.Usuario_ID]);
    for (const id of especializaciones) await conn.query('INSERT INTO Profesionales_Especializaciones (Usuario_ID, Especializacion_ID) VALUES (?, ?)', [req.usuario.Usuario_ID, id]);
    await conn.commit(); return res.json({ message: 'Perfil actualizado correctamente' });
  } catch (e) { await conn.rollback(); return error(res, e, 'No se pudo actualizar el perfil'); }
  finally { conn.release(); }
}
async function subirCv(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Seleccioná un PDF para el CV' });
  let nuevo;
  try {
    nuevo = await guardar(req.file, ['.pdf']);
    const [rows] = await db.query('SELECT Cv_Ruta FROM Perfiles_Profesionales WHERE Usuario_ID = ?', [req.usuario.Usuario_ID]);
    await db.query(`INSERT INTO Perfiles_Profesionales (Usuario_ID, Cv_Nombre, Cv_Ruta)
      VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE Cv_Nombre = VALUES(Cv_Nombre), Cv_Ruta = VALUES(Cv_Ruta)`,
      [req.usuario.Usuario_ID, req.file.originalname.slice(0, 255), nuevo]);
    await borrar(rows[0]?.Cv_Ruta);
    return res.status(201).json({ message: 'Currículum PDF guardado' });
  } catch (e) { await borrar(nuevo); if (e.message.includes('formato') || e.message.includes('PDF')) return res.status(400).json({ message: e.message }); return error(res, e, 'Error al guardar CV'); }
}
async function bajarCv(req, res) {
  try {
    const [rows] = await db.query('SELECT Cv_Ruta, Cv_Nombre FROM Perfiles_Profesionales WHERE Usuario_ID = ?', [req.usuario.Usuario_ID]);
    if (!rows[0]?.Cv_Ruta) return res.status(404).json({ message: 'Aún no subiste tu CV' });
    return descargar(res, rows[0].Cv_Ruta, rows[0].Cv_Nombre);
  } catch (e) { return error(res, e); }
}
async function borrarCv(req, res) {
  try {
    const [rows] = await db.query('SELECT Cv_Ruta FROM Perfiles_Profesionales WHERE Usuario_ID = ?', [req.usuario.Usuario_ID]);
    await db.query('UPDATE Perfiles_Profesionales SET Cv_Ruta = NULL, Cv_Nombre = NULL, Cv_Visible = 0 WHERE Usuario_ID = ?', [req.usuario.Usuario_ID]);
    await borrar(rows[0]?.Cv_Ruta);
    return res.json({ message: 'CV eliminado' });
  } catch(e) { return error(res,e); }
}
async function clientes(req, res) {
  const estudioId = intId(req.query.estudioId);
  try {
    let sql, p;
    if (req.query.espacio === 'estudio') {
      if (!estudioId) return res.status(400).json({ message: 'Elegí un estudio' });
      const rol = await estudioDe(req.usuario.Usuario_ID, estudioId);
      if (!rol) return res.status(403).json({ message: 'No pertenecés a ese estudio' });
      sql = `SELECT u.Usuario_ID, u.Nombre, u.Apellido, u.Email, ce.Estado, ce.Origen, ce.Fecha_Solicitud
        FROM Clientes_Estudios ce JOIN Usuarios u ON u.Usuario_ID = ce.Usuario_ID
        WHERE ce.Estudio_ID = ? AND u.Tipo_Cuenta = 'CLIENTE'
        ${rol === 'ABOGADO' ? `AND ce.Estado = 'ACTIVO' AND EXISTS
          (SELECT 1 FROM Casos c WHERE c.Estudio_ID = ce.Estudio_ID AND c.Cliente_ID = u.Usuario_ID
          AND (c.Responsable_ID = ? OR EXISTS (SELECT 1 FROM Casos_Abogados ca WHERE ca.Caso_ID = c.Caso_ID AND ca.Abogado_ID = ?)))` : ''}
        ORDER BY ce.Fecha_Solicitud DESC`;
      p = rol === 'ABOGADO' ? [estudioId, req.usuario.Usuario_ID, req.usuario.Usuario_ID] : [estudioId];
    } else {
      sql = `SELECT u.Usuario_ID, u.Nombre, u.Apellido, u.Email, pc.Estado, pc.Origen, pc.Fecha_Solicitud
        FROM Profesionales_Clientes pc JOIN Usuarios u ON u.Usuario_ID = pc.Cliente_ID
        WHERE pc.Profesional_ID = ? ORDER BY pc.Fecha_Solicitud DESC`;
      p = [req.usuario.Usuario_ID];
    }
    const [rows] = await db.query(sql, p); return res.json(rows);
  } catch (e) { return error(res, e); }
}
// Particular: invitar cliente por ID. El CLIENTE debe aceptar antes de crear un caso.
async function invitarParticular(req, res) {
  const clienteId = intId(req.body.Cliente_ID);
  if (!clienteId) return res.status(400).json({ message: 'Cliente_ID inválido' });
  try {
    const [users] = await db.query("SELECT Usuario_ID FROM Usuarios WHERE Usuario_ID = ? AND Tipo_Cuenta = 'CLIENTE' AND Estado = 1", [clienteId]);
    if (!users.length) return res.status(404).json({ message: 'Cliente no encontrado' });
    await db.query(`INSERT INTO Profesionales_Clientes (Profesional_ID, Cliente_ID, Estado, Origen) VALUES (?, ?, 'PENDIENTE', 'INVITACION')
      ON DUPLICATE KEY UPDATE Estado = IF(Estado = 'ACTIVO', 'ACTIVO', 'PENDIENTE'), Origen = IF(Estado = 'ACTIVO', Origen, 'INVITACION')`, [req.usuario.Usuario_ID, clienteId]);
    return res.status(201).json({ message: 'Invitación enviada; el cliente debe aceptarla' });
  } catch(e) { return error(res,e); }
}
async function invitarEstudio(req, res) {
  const estudioId = intId(req.params.id), clienteId = intId(req.body.Cliente_ID);
  if (!clienteId || !estudioId) return res.status(400).json({ message: 'ID inválido' });
  try {
    if ((await estudioDe(req.usuario.Usuario_ID, estudioId)) !== 'ADMIN_ESTUDIO') return res.status(403).json({ message: 'Solo ADMIN_ESTUDIO puede invitar clientes' });
    const [users] = await db.query("SELECT Usuario_ID FROM Usuarios WHERE Usuario_ID = ? AND Tipo_Cuenta = 'CLIENTE' AND Estado = 1", [clienteId]);
    if (!users.length) return res.status(404).json({ message: 'Cliente no encontrado' });
    // El cliente confirma en su portal. No activar unilateralmente.
    await db.query(`INSERT INTO Clientes_Estudios (Estudio_ID, Usuario_ID, Estado, Origen) VALUES (?, ?, 'PENDIENTE', 'INVITACION')
      ON DUPLICATE KEY UPDATE Estado = IF(Estado = 'ACTIVO','ACTIVO','PENDIENTE'), Origen = IF(Estado = 'ACTIVO',Origen,'INVITACION')`, [estudioId, clienteId]);
    return res.status(201).json({ message: 'Invitación enviada al cliente' });
  } catch(e) { return error(res,e); }
}
async function miembros(req, res) {
  const estudioId = intId(req.params.id);
  try {
    if (!(await estudioDe(req.usuario.Usuario_ID, estudioId))) return res.status(403).json({ message: 'No pertenecés a este estudio' });
    const [rows] = await db.query(`SELECT u.Usuario_ID, u.Nombre, u.Apellido, u.Matricula, u.Email, pe.Rol_Estudio
      FROM Profesionales_Estudios pe JOIN Usuarios u ON u.Usuario_ID = pe.Usuario_ID
      WHERE pe.Estudio_ID = ? AND pe.Estado = 'ACTIVO' ORDER BY pe.Rol_Estudio, u.Apellido`, [estudioId]);
    return res.json(rows);
  } catch(e) { return error(res,e); }
}
async function dashboard(req, res) {
  const estudio = req.query.espacio === 'estudio';
  const id = req.usuario.Usuario_ID;
  const estudioId = intId(req.query.estudioId);
  const desde = req.query.desde, hasta = req.query.hasta;
  if ((desde || hasta) && (!/^\d{4}-\d{2}-\d{2}$/.test(desde || '') || !/^\d{4}-\d{2}-\d{2}$/.test(hasta || '') || desde > hasta || !Number.isFinite(Date.parse(desde)) || !Number.isFinite(Date.parse(hasta)))) {
    return res.status(400).json({ message: 'Rango de fechas inválido' });
  }
  try {
    let where, params;
    if (estudio) {
      const rol = await estudioDe(id, estudioId);
      if (!rol) return res.status(403).json({ message: 'Estudio no autorizado' });
      where = `c.Estudio_ID = ?`;
      params = [estudioId];
      if (rol !== 'ADMIN_ESTUDIO') { where += ` AND (c.Responsable_ID = ? OR EXISTS (SELECT 1 FROM Casos_Abogados ca WHERE ca.Caso_ID = c.Caso_ID AND ca.Abogado_ID = ?))`; params.push(id, id); }
    } else { where = 'c.Estudio_ID IS NULL AND c.Responsable_ID = ?'; params = [id]; }
    if (desde && hasta) { where += ' AND DATE(c.Fecha_Apertura) BETWEEN ? AND ?'; params.push(desde, hasta); }
    const [estados] = await db.query(`SELECT c.Estado AS nombre, COUNT(*) AS cantidad FROM Casos c WHERE ${where} GROUP BY c.Estado`, params);
    const [meses] = await db.query(`SELECT DATE_FORMAT(c.Fecha_Apertura, '%Y-%m') AS mes, COUNT(*) AS cantidad FROM Casos c WHERE ${where}
      GROUP BY DATE_FORMAT(c.Fecha_Apertura, '%Y-%m') ORDER BY mes DESC LIMIT 12`, params);
    const [docs] = await db.query(`SELECT COUNT(*) AS total FROM Documentos d JOIN Casos c ON c.Caso_ID = d.Caso_ID WHERE ${where}`, params);
    const [avances] = await db.query(`SELECT COUNT(*) AS total FROM Avances a JOIN Casos c ON c.Caso_ID = a.Caso_ID WHERE ${where}`, params);
    const estadoMap = Object.fromEntries(estados.map(x=>[x.nombre, Number(x.cantidad)]));
    const total = estados.reduce((n,x)=>n+Number(x.cantidad),0);
    // Clientes con al menos un caso en el período (coherente con RANGOS).
    const [clientesCount] = await db.query(`SELECT COUNT(DISTINCT c.Cliente_ID) AS total FROM Casos c WHERE ${where}`, params);
    return res.json({ total, abiertos: estadoMap.ABIERTO || 0, enProceso: estadoMap.EN_PROCESO || 0,
      cerrados: estadoMap.CERRADO || 0, clientes: clientesCount[0].total, documentos: docs[0].total,
      avances: avances[0].total, estados, meses: meses.reverse(), periodo: desde ? {desde,hasta} : null });
  } catch(e) { return error(res,e, 'Error al cargar estadísticas'); }
}
async function buscarCliente(req, res) {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Ingresá el email completo del cliente' });
  try {
    const [rows] = await db.query("SELECT Usuario_ID, Nombre, Apellido, Email FROM Usuarios WHERE Email=? AND Tipo_Cuenta='CLIENTE' AND Estado=1", [email]);
    return res.json(rows[0] || null);
  } catch (e) { return error(res, e); }
}
async function clientesElegibles(req, res) {
  const estudioId = intId(req.query.estudioId);
  try {
    if (!estudioId || !(await estudioDe(req.usuario.Usuario_ID, estudioId))) return res.status(403).json({ message: 'No pertenecés al estudio' });
    const [rows] = await db.query(`SELECT u.Usuario_ID, u.Nombre, u.Apellido
      FROM Clientes_Estudios ce JOIN Usuarios u ON u.Usuario_ID = ce.Usuario_ID
      WHERE ce.Estudio_ID = ? AND ce.Estado = 'ACTIVO' AND u.Estado = 1
      ORDER BY u.Apellido, u.Nombre`, [estudioId]);
    return res.json(rows);
  } catch (e) { return error(res, e); }
}
module.exports = { clientesElegibles, buscarCliente, especializaciones, perfil, editarPerfil, subirCv, bajarCv, borrarCv,
  clientes, invitarParticular, invitarEstudio, miembros, dashboard };
