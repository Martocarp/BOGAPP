const { db, estudioDe, intId } = require('../helpers/permisos');

function error(res, e) { console.error('Profesionales:', e.message); return res.status(500).json({ message: 'Error al gestionar profesionales' }); }

async function buscarProfesional(req, res) {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Ingresá el correo completo' });
  try { const [rows] = await db.query("SELECT Usuario_ID,Nombre,Apellido,Email,Matricula FROM Usuarios WHERE Email=? AND Tipo_Cuenta='PROFESIONAL' AND Estado=1", [email]); return res.json(rows[0] || null); } catch (e) { return error(res, e); }
}

async function invitaciones(req, res) {
  try {    
const [rows] = await db.query(`SELECT pe.Estudio_ID,e.Nombre,pe.Rol_Estudio,pe.Origen,pe.Estado
    FROM Profesionales_Estudios pe JOIN Estudios e ON e.Estudio_ID=pe.Estudio_ID
    WHERE pe.Usuario_ID=? ORDER BY pe.Fecha_Solicitud DESC`, [req.usuario.Usuario_ID]); return res.json(rows);  
} catch (e) { return error(res, e); }
}

async function invitar(req, res) {
  const id = intId(req.params.id), profesional = intId(req.body.Usuario_ID), rol = req.body.Rol_Estudio || 'ABOGADO';
  if (!id || !profesional || !['ABOGADO', 'ADMIN_ESTUDIO'].includes(rol)) return res.status(400).json({ message: 'Datos inválidos' });
  try {
    if (await estudioDe(req.usuario.Usuario_ID, id) !== 'ADMIN_ESTUDIO') return res.status(403).json({ message: 'Solo un administrador del estudio puede invitar' });
    const [users] = await db.query("SELECT Usuario_ID FROM Usuarios WHERE Usuario_ID=? AND Tipo_Cuenta='PROFESIONAL' AND Estado=1", [profesional]);
    if (!users.length) return res.status(404).json({ message: 'Profesional no disponible' });
    await db.query(`INSERT INTO Profesionales_Estudios (Estudio_ID,Usuario_ID,Rol_Estudio,Origen,Estado)
      VALUES (?,?,?,'INVITACION','PENDIENTE') ON DUPLICATE KEY UPDATE
      Rol_Estudio=IF(Estado='ACTIVO',Rol_Estudio,VALUES(Rol_Estudio)),
      Estado=IF(Estado='ACTIVO','ACTIVO','PENDIENTE'),Origen=IF(Estado='ACTIVO',Origen,'INVITACION')`, [id, profesional, rol]);
    return res.status(201).json({ message: 'Invitación enviada al profesional' });
  } catch (e) { return error(res, e); }
}

async function solicitarIngreso(req, res) {
  const id = intId(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID inválido' });
  try {
    const [rows] = await db.query("SELECT 1 FROM Estudios WHERE Estudio_ID=? AND Estado='APROBADO'", [id]);
    if (!rows.length) return res.status(404).json({ message: 'Estudio no aprobado' });
    await db.query(`INSERT INTO Profesionales_Estudios (Estudio_ID,Usuario_ID,Rol_Estudio,Origen,Estado)
      VALUES (?,?,'ABOGADO','SOLICITUD','PENDIENTE')
      ON DUPLICATE KEY UPDATE Estado=IF(Estado='ACTIVO','ACTIVO','PENDIENTE'),Origen=IF(Estado='ACTIVO',Origen,'SOLICITUD')`, [id, req.usuario.Usuario_ID]);
    return res.status(201).json({ message: 'Solicitud de incorporación enviada' });
  } catch (e) { return error(res, e); }
}

async function responderInvitacion(req, res) {
  const id = intId(req.params.id), estado = req.body.Estado;
  if (!id || !['ACTIVO', 'RECHAZADO'].includes(estado)) return res.status(400).json({ message: 'Estado inválido' });
  try {
    const [r] = await db.query(`UPDATE Profesionales_Estudios SET Estado=? WHERE Estudio_ID=? AND Usuario_ID=?
      AND Estado='PENDIENTE' AND Origen='INVITACION'`, [estado, id, req.usuario.Usuario_ID]);
    if (!r.affectedRows) return res.status(409).json({ message: 'No hay invitación pendiente' });
    return res.json({ message: estado === 'ACTIVO' ? 'Invitación aceptada' : 'Invitación rechazada' });
  } catch (e) { return error(res, e); }
}

async function pendientes(req, res) {
  const id = intId(req.params.id);
  try {
    if (await estudioDe(req.usuario.Usuario_ID, id) !== 'ADMIN_ESTUDIO') return res.status(403).json({ message: 'Solo ADMIN_ESTUDIO' });
    const [rows] = await db.query(`SELECT u.Usuario_ID,u.Nombre,u.Apellido,u.Email,pe.Rol_Estudio,pe.Origen,pe.Estado
      FROM Profesionales_Estudios pe JOIN Usuarios u ON u.Usuario_ID=pe.Usuario_ID
      WHERE pe.Estudio_ID=? AND pe.Estado='PENDIENTE'`, [id]); return res.json(rows);
  } catch (e) { return error(res, e); }
}

async function responderSolicitud(req, res) {
  const id = intId(req.params.id), profesional = intId(req.params.usuarioId), estado = req.body.Estado;
  if (!id || !profesional || !['ACTIVO', 'RECHAZADO'].includes(estado)) return res.status(400).json({ message: 'Datos inválidos' });
  try {
    if (await estudioDe(req.usuario.Usuario_ID, id) !== 'ADMIN_ESTUDIO') return res.status(403).json({ message: 'Solo ADMIN_ESTUDIO' });
    const [r] = await db.query(`UPDATE Profesionales_Estudios SET Estado=? WHERE Estudio_ID=? AND Usuario_ID=?
      AND Estado='PENDIENTE' AND Origen='SOLICITUD'`, [estado, id, profesional]);
    if (!r.affectedRows) return res.status(409).json({ message: 'No hay solicitud pendiente' });
    return res.json({ message: 'Solicitud actualizada' });
  } catch (e) { return error(res, e); }
}
module.exports = { buscarProfesional, invitaciones, invitar, solicitarIngreso, responderInvitacion, pendientes, responderSolicitud };
