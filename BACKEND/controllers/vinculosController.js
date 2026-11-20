const { db, estudioDe, intId } = require('../helpers/permisos');
const { descargar } = require('../helpers/archivos');
// Las vinculaciones particulares requieren dos consentimientos.
// Al estudio el cliente se puede unir directamente; si lo invita el estudio, debe aceptar.
function fallo(res,e){console.error('Vínculos:',e.message);return res.status(500).json({message:'Error al gestionar vínculos'});}
// Obtiene las vinculaciones propias del cliente (estudios y abogados particulares).
async function mis(req,res) {
  const id=req.usuario.Usuario_ID;
  try {
    const [estudios]=await db.query(`SELECT ce.Estudio_ID, e.Nombre AS Nombre, ce.Estado,ce.Origen
      FROM Clientes_Estudios ce JOIN Estudios e ON e.Estudio_ID=ce.Estudio_ID
      WHERE ce.Usuario_ID=? ORDER BY ce.Fecha_Solicitud DESC`,[id]);
    const [profesionales]=await db.query(`SELECT pc.Profesional_ID, CONCAT(u.Nombre, ' ', u.Apellido) AS Nombre, pc.Estado, pc.Origen
      FROM Profesionales_Clientes pc JOIN Usuarios u ON u.Usuario_ID=pc.Profesional_ID
      WHERE pc.Cliente_ID=? ORDER BY pc.Fecha_Solicitud DESC`,[id]);
    return res.json({estudios,profesionales});
  }catch(e){return fallo(res,e);}
}
// El cliente se une directamente: su acción ya equivale a aceptar la relación.
async function pedirEstudio(req,res) {
  const id=intId(req.body.Estudio_ID);
  if(!id)return res.status(400).json({message:'Elegí un estudio'});
  try {
    const [rows]=await db.query("SELECT 1 FROM Estudios WHERE Estudio_ID=? AND Estado='APROBADO'",[id]);
    if(!rows.length)return res.status(404).json({message:'Estudio no disponible'});
    // Quien pulsa «Unirse» ya consiente la relación; no requiere aprobación del estudio.
    await db.query(`INSERT INTO Clientes_Estudios (Usuario_ID,Estudio_ID,Estado,Origen)
      VALUES (?,?,'ACTIVO','SOLICITUD') ON DUPLICATE KEY UPDATE Estado='ACTIVO', Origen='SOLICITUD'`,
      [req.usuario.Usuario_ID,id]);
    return res.status(201).json({message:'Ya estás vinculado con el estudio'});
  }catch(e){return fallo(res,e);}
}
// El cliente SOLICITA un abogado; el profesional decide si acepta.
async function pedirProfesional(req,res) {
  const id=intId(req.body.Profesional_ID);
  if(!id)return res.status(400).json({message:'Elegí un profesional'});
  try {
    const [rows]=await db.query("SELECT 1 FROM Usuarios WHERE Usuario_ID=? AND Tipo_Cuenta='PROFESIONAL' AND Estado=1",[id]);
    if(!rows.length)return res.status(404).json({message:'Profesional no encontrado'});
    await db.query(`INSERT INTO Profesionales_Clientes (Profesional_ID,Cliente_ID,Estado,Origen)
      VALUES (?,?,'PENDIENTE','SOLICITUD') ON DUPLICATE KEY UPDATE Estado=IF(Estado='ACTIVO','ACTIVO','PENDIENTE'), Origen=IF(Estado='ACTIVO',Origen,'SOLICITUD')`,[id,req.usuario.Usuario_ID]);
    return res.status(201).json({message:'Solicitud enviada al profesional'});
  }catch(e){return fallo(res,e);}
}
// Invitación del estudio: el cliente puede aceptar o rechazar.
async function responderEstudioComoCliente(req,res) {
  const estado=req.body.Estado, id=intId(req.params.estudioId);
  if(!['ACTIVO','RECHAZADO'].includes(estado)||!id)return res.status(400).json({message:'Estado inválido'});
  try {
    const [r]=await db.query(`UPDATE Clientes_Estudios SET Estado=? WHERE Estudio_ID=? AND Usuario_ID=?
      AND Estado='PENDIENTE' AND Origen='INVITACION'`,[estado,id,req.usuario.Usuario_ID]);
    if(!r.affectedRows)return res.status(409).json({message:'No hay invitación pendiente para responder'});
    return res.json({message:estado==='ACTIVO'?'Vinculación aceptada':'Invitación rechazada'});
  }catch(e){return fallo(res,e);}
}
async function responderProfesionalComoCliente(req,res) {
  const estado=req.body.Estado, id=intId(req.params.profesionalId);
  if(!['ACTIVO','RECHAZADO'].includes(estado)||!id)return res.status(400).json({message:'Estado inválido'});
  try {
    const [r]=await db.query(`UPDATE Profesionales_Clientes SET Estado=? WHERE Profesional_ID=? AND Cliente_ID=? AND Estado='PENDIENTE' AND Origen='INVITACION'`,[estado,id,req.usuario.Usuario_ID]);
    if(!r.affectedRows)return res.status(409).json({message:'No hay invitación pendiente'});
    return res.json({message:'Vinculación actualizada'});
  }catch(e){return fallo(res,e);}
}
async function responderEstudioComoAdmin(req,res) {
  const estado=req.body.Estado, id=intId(req.params.estudioId),clienteId=intId(req.params.clienteId);
  if(!['ACTIVO','RECHAZADO'].includes(estado)||!id||!clienteId)return res.status(400).json({message:'Estado inválido'});
  try {
    if((await estudioDe(req.usuario.Usuario_ID,id))!=='ADMIN_ESTUDIO')return res.status(403).json({message:'Solo ADMIN_ESTUDIO puede aprobar solicitudes'});
    const [r]=await db.query(`UPDATE Clientes_Estudios SET Estado=? WHERE Estudio_ID=? AND Usuario_ID=?
      AND Estado='PENDIENTE' AND Origen='SOLICITUD'`,[estado,id,clienteId]);
    if(!r.affectedRows)return res.status(409).json({message:'No hay solicitud pendiente del cliente'});
    return res.json({message:'Solicitud del cliente actualizada'});
  }catch(e){return fallo(res,e);}
}
async function responderParticularComoProfesional(req,res) {
  const estado=req.body.Estado,id=intId(req.params.clienteId);
  if(!['ACTIVO','RECHAZADO'].includes(estado)||!id)return res.status(400).json({message:'Estado inválido'});
  try {
    const [r]=await db.query("UPDATE Profesionales_Clientes SET Estado=? WHERE Profesional_ID=? AND Cliente_ID=? AND Estado='PENDIENTE' AND Origen='SOLICITUD'",[estado,req.usuario.Usuario_ID,id]);
    if(!r.affectedRows)return res.status(409).json({message:'No hay solicitud pendiente'});
    return res.json({message:'Vinculación actualizada'});
  }catch(e){return fallo(res,e);}
}

// Listado PÚBLICO para clientes: las áreas vienen de MySQL (no están fijadas en React).
async function directorioProfesionales(req, res) {
  try {
    const [rows] = await db.query(`SELECT u.Usuario_ID, u.Nombre, u.Apellido, u.Matricula,
      p.Biografia,
      IF(p.Cv_Visible = 1 AND p.Cv_Ruta IS NOT NULL, 1, 0) AS Cv_Disponible,
      (SELECT GROUP_CONCAT(e.Especializacion_ID) FROM Profesionales_Especializaciones pe
        JOIN Especializaciones e ON e.Especializacion_ID = pe.Especializacion_ID
        WHERE pe.Usuario_ID = u.Usuario_ID) AS Areas_ID,
      (SELECT GROUP_CONCAT(e.Nombre SEPARATOR ', ') FROM Profesionales_Especializaciones pe
        JOIN Especializaciones e ON e.Especializacion_ID = pe.Especializacion_ID
        WHERE pe.Usuario_ID = u.Usuario_ID) AS Areas
      FROM Usuarios u LEFT JOIN Perfiles_Profesionales p ON p.Usuario_ID = u.Usuario_ID
      WHERE u.Tipo_Cuenta = 'PROFESIONAL' AND u.Estado = 1
      ORDER BY u.Apellido, u.Nombre`);
    return res.json(rows);
  } catch (e) { return fallo(res, e); }
}

// El CV nunca se descarga si el abogado lo marcó como privado.
async function cvPublico(req, res) {
  const id = intId(req.params.id);
  if (!id) return res.status(400).json({message:'Profesional inválido'});
  try {
    const [rows] = await db.query(`SELECT p.Cv_Ruta, p.Cv_Nombre FROM Perfiles_Profesionales p
      JOIN Usuarios u ON u.Usuario_ID = p.Usuario_ID
      WHERE p.Usuario_ID = ? AND u.Tipo_Cuenta='PROFESIONAL' AND u.Estado=1 AND p.Cv_Visible=1`, [id]);
    if (!rows[0]?.Cv_Ruta) return res.status(404).json({message:'Este CV no está disponible'});
    return descargar(res, rows[0].Cv_Ruta, rows[0].Cv_Nombre);
  } catch (e) { return fallo(res, e); }
}

module.exports={directorioProfesionales,cvPublico,mis,pedirEstudio,pedirProfesional,responderEstudioComoCliente,responderProfesionalComoCliente,
  responderEstudioComoAdmin,responderParticularComoProfesional};
