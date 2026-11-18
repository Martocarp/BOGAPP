const { db, estudioDe, intId } = require('../helpers/permisos');
function fallo(res,e){console.error('Vínculos:',e.message);return res.status(500).json({message:'Error al gestionar vínculos'});}
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
async function pedirEstudio(req,res) {
  const id=intId(req.body.Estudio_ID);
  if(!id)return res.status(400).json({message:'Elegí un estudio'});
  try {
    const [rows]=await db.query("SELECT 1 FROM Estudios WHERE Estudio_ID=? AND Estado='APROBADO'",[id]);
    if(!rows.length)return res.status(404).json({message:'Estudio no disponible'});
    const [result]=await db.query(`INSERT INTO Clientes_Estudios (Usuario_ID,Estudio_ID,Estado,Origen)
      VALUES (?,?,'PENDIENTE','SOLICITUD') ON DUPLICATE KEY UPDATE
      Estado=IF(Estado='ACTIVO','ACTIVO','PENDIENTE'),Origen=IF(Estado='ACTIVO',Origen,'SOLICITUD')`,[req.usuario.Usuario_ID,id]);
    return res.status(201).json({message:'Solicitud enviada al estudio'});
  }catch(e){return fallo(res,e);}
}
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
module.exports={mis,pedirEstudio,pedirProfesional,responderEstudioComoCliente,responderProfesionalComoCliente,
  responderEstudioComoAdmin,responderParticularComoProfesional};
