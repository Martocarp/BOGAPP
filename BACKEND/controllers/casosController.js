const { db, intId, estudioDe, contextoCaso, permitido } = require('../helpers/permisos');
const { guardar, borrar, descargar } = require('../helpers/archivos');
const { borrarCasos } = require('./adminDelete');
function error(res,e,msg='Error en expedientes') { console.error(msg,e.message); return res.status(500).json({message:msg}); }
const estados = ['ABIERTO','EN_PROCESO','CERRADO'];
// Lista únicamente los casos autorizados para este actor y su espacio de trabajo.
async function listar(req,res) {
  const estudio = req.query.espacio === 'estudio';
  const uid = req.usuario.Usuario_ID;
  const eid = intId(req.query.estudioId);
  try {
    let where, params;
    if (req.usuario.Tipo_Cuenta === 'ADMIN_BOGAPP') { where = '1=1'; params = []; }
    else if (req.usuario.Tipo_Cuenta === 'CLIENTE') { where = 'c.Cliente_ID = ?'; params = [uid]; }
    else if (estudio) {
      const rol = await estudioDe(uid, eid);
      if (!rol) return res.status(403).json({message:'Estudio no autorizado'});
      where = 'c.Estudio_ID = ?'; params = [eid];
      if (rol === 'ABOGADO') {
        where += ` AND (c.Responsable_ID = ? OR EXISTS
          (SELECT 1 FROM Casos_Abogados ca WHERE ca.Caso_ID = c.Caso_ID AND ca.Abogado_ID = ?))`;
        params.push(uid,uid);
      }
    } else { where = 'c.Estudio_ID IS NULL AND c.Responsable_ID = ?'; params = [uid]; }
    const [rows] = await db.query(`SELECT c.*, CONCAT(cl.Nombre, ' ', cl.Apellido) AS Cliente_Nombre,
       CONCAT(pro.Nombre, ' ', pro.Apellido) AS Responsable_Nombre,
       e.Nombre AS Estudio_Nombre FROM Casos c
       JOIN Usuarios cl ON cl.Usuario_ID = c.Cliente_ID
       JOIN Usuarios pro ON pro.Usuario_ID = c.Responsable_ID
       LEFT JOIN Estudios e ON e.Estudio_ID = c.Estudio_ID
       WHERE ${where} ORDER BY c.Fecha_Apertura DESC, c.Caso_ID DESC`,params);
    return res.json(rows);
  } catch(e) { return error(res,e,'No se pudieron obtener los expedientes'); }
}
async function buscar(req,res) {
  try {
    const ctx = await contextoCaso(req.params.id,req.usuario);
    if(!permitido(res,ctx))return;
    const [rows] = await db.query(`SELECT c.*, CONCAT(u.Nombre,' ',u.Apellido) AS Cliente_Nombre,
      CONCAT(p.Nombre,' ',p.Apellido) AS Responsable_Nombre FROM Casos c
      JOIN Usuarios u ON u.Usuario_ID = c.Cliente_ID JOIN Usuarios p ON p.Usuario_ID = c.Responsable_ID
      WHERE c.Caso_ID = ?`,[ctx.caso.Caso_ID]);
    return res.json(rows[0]);
  } catch(e){return error(res,e);}
}
// CREAR CASO: primero confirma que el cliente esté vinculado y que el abogado tenga permiso.
async function crear(req,res) {
  const { Estudio_ID=null, Cliente_ID, Titulo, Descripcion='', Responsable_ID } = req.body;
  const uid = req.usuario.Usuario_ID;
  const cid=intId(Cliente_ID), eid=Estudio_ID === null || Estudio_ID === '' ? null : intId(Estudio_ID);
  if (!cid || (Estudio_ID !== null && Estudio_ID !== '' && !eid) || typeof Titulo !== 'string' || !Titulo.trim() || Titulo.length>200 || typeof Descripcion!=='string')
    return res.status(400).json({message:'Datos del expediente inválidos'});
  try {
    const [clientes] = await db.query("SELECT 1 FROM Usuarios WHERE Usuario_ID=? AND Tipo_Cuenta='CLIENTE' AND Estado=1",[cid]);
    if (!clientes.length) return res.status(400).json({message:'El cliente no existe o está inactivo'});
    let responsable=uid;
    if (eid) {
      const rol=await estudioDe(uid,eid);
      if (!rol) return res.status(403).json({message:'No pertenecés a un estudio aprobado'});
      const [links]=await db.query("SELECT 1 FROM Clientes_Estudios WHERE Estudio_ID=? AND Usuario_ID=? AND Estado='ACTIVO'",[eid,cid]);
      if(!links.length) return res.status(409).json({message:'Primero vinculá al cliente con el estudio'});
      if (Responsable_ID && intId(Responsable_ID)!==uid) {
        if (rol!=='ADMIN_ESTUDIO') return res.status(403).json({message:'Solo ADMIN_ESTUDIO puede asignar otro responsable'});
        responsable=intId(Responsable_ID);
        if(!responsable || !(await estudioDe(responsable,eid))) return res.status(400).json({message:'El responsable debe ser un profesional activo del estudio'});
      }
    } else {
      const [links]=await db.query("SELECT 1 FROM Profesionales_Clientes WHERE Profesional_ID=? AND Cliente_ID=? AND Estado='ACTIVO'",[uid,cid]);
      if(!links.length) return res.status(409).json({message:'El cliente todavía no aceptó tu vinculación particular'});
    }
    const [result]=await db.query(`INSERT INTO Casos (Estudio_ID,Cliente_ID,Creado_Por_ID,Responsable_ID,Titulo,Descripcion,Estado)
      VALUES (?,?,?,?,?,?,'ABIERTO')`,[eid,cid,uid,responsable,Titulo.trim(),Descripcion.trim()]);
    return res.status(201).json({message:'Expediente creado',Caso_ID:result.insertId});
  } catch(e){return error(res,e,'No se pudo crear el expediente. Revisá la migración y las relaciones');}
}
// Solo responsable o administrador puede modificar el expediente.
async function editar(req,res) {
  const { Titulo, Descripcion='', Estado, Responsable_ID }=req.body;
  if(typeof Titulo!=='string'||!Titulo.trim()||Titulo.length>200||typeof Descripcion!=='string'||!estados.includes(Estado))
    return res.status(400).json({message:'Datos de expediente inválidos'});
  try {
    const ctx=await contextoCaso(req.params.id,req.usuario);
    if(!permitido(res,ctx))return;
    if(!ctx.editor) return res.status(403).json({message:'No podés modificar este expediente'});
    let respId=ctx.caso.Responsable_ID;
    if(Responsable_ID !== undefined && Number(Responsable_ID)!==respId) {
      if(ctx.caso.Estudio_ID===null || !(ctx.admin || req.usuario.Tipo_Cuenta==='ADMIN_BOGAPP'))
        return res.status(403).json({message:'Solo el administrador del estudio puede reasignar responsables'});
      respId=intId(Responsable_ID);
      if(!respId || !(await estudioDe(respId,ctx.caso.Estudio_ID))) return res.status(400).json({message:'Responsable inválido para este estudio'});
    }
    await db.query('UPDATE Casos SET Titulo=?, Descripcion=?, Estado=?, Responsable_ID=? WHERE Caso_ID=?',
      [Titulo.trim(),Descripcion.trim(),Estado,respId,ctx.caso.Caso_ID]);
    return res.json({message:'Expediente actualizado'});
  } catch(e){return error(res,e);}
}
// Borra expediente y archivos relacionados en una transacción.
async function eliminar(req,res) {
  try {
    const ctx=await contextoCaso(req.params.id,req.usuario);
    if(!permitido(res,ctx))return;
    if(!ctx.editor) return res.status(403).json({message:'No podés eliminar este expediente'});
    // Los colaboradores no eliminan expedientes. Admin estudio / responsable particular / líder caso.
    const conn=await db.getConnection();
    try {
      await conn.beginTransaction();
      const [archivos]=await conn.query('SELECT Ruta_Archivo FROM Documentos WHERE Caso_ID=?',[ctx.caso.Caso_ID]);
      await borrarCasos(conn,[ctx.caso.Caso_ID]);
      await conn.commit();
      await Promise.all(archivos.map(x=>borrar(x.Ruta_Archivo)));
      return res.json({message:'Expediente eliminado con sus avances y documentos'});
    } catch(e){await conn.rollback();return error(res,e,'No se pudo eliminar expediente');}
    finally {conn.release();}
  } catch(e){return error(res,e);}
}
async function abogados(req,res) {
  try {
    const ctx=await contextoCaso(req.params.id,req.usuario);
    if(!permitido(res,ctx))return;
    if(ctx.caso.Estudio_ID===null) return res.json([]);
    const [rows]=await db.query(`SELECT u.Usuario_ID,u.Nombre,u.Apellido,u.Email
      FROM Casos_Abogados ca JOIN Usuarios u ON u.Usuario_ID=ca.Abogado_ID WHERE ca.Caso_ID=?`,[ctx.caso.Caso_ID]);
    return res.json(rows);
  } catch(e){return error(res,e);}
}
async function agregarAbogado(req,res) {
  const abogado=intId(req.body.Abogado_ID);
  try {
    const ctx=await contextoCaso(req.params.id,req.usuario);
    if(!permitido(res,ctx))return;
    if(!ctx.caso.Estudio_ID || !(ctx.admin || ctx.responsable)) return res.status(403).json({message:'Solo admin o responsable de un estudio puede agregar colaboradores'});
    if(!abogado || !(await estudioDe(abogado,ctx.caso.Estudio_ID))) return res.status(400).json({message:'Profesional no activo en el estudio'});
    await db.query('INSERT INTO Casos_Abogados (Caso_ID,Estudio_ID,Abogado_ID) VALUES (?,?,?)',[ctx.caso.Caso_ID,ctx.caso.Estudio_ID,abogado]);
    return res.status(201).json({message:'Abogado colaborador agregado'});
  } catch(e){if(e.code==='ER_DUP_ENTRY')return res.status(409).json({message:'Ya participa en el caso'});return error(res,e);}
}
async function quitarAbogado(req,res) {
  try {
    const ctx=await contextoCaso(req.params.id,req.usuario);
    if(!permitido(res,ctx))return;
    if(!ctx.caso.Estudio_ID || !(ctx.admin || ctx.responsable)) return res.status(403).json({message:'No podés quitar colaboradores'});
    await db.query('DELETE FROM Casos_Abogados WHERE Caso_ID=? AND Abogado_ID=?',[ctx.caso.Caso_ID,req.params.abogadoId]);
    return res.json({message:'Colaborador removido'});
  } catch(e){return error(res,e);}
}
// El cliente recibe solamente avances publicados; el abogado ve también borradores.
async function avances(req,res) {
  try {
    const ctx=await contextoCaso(req.params.id,req.usuario);
    if(!permitido(res,ctx))return;
    const [rows]=await db.query(`SELECT a.*, CONCAT(u.Nombre, ' ', u.Apellido) AS Autor
      FROM Avances a JOIN Usuarios u ON u.Usuario_ID=a.Creado_Por_ID
      WHERE a.Caso_ID=? ${ctx.cliente ? 'AND a.Publicado=1' : ''}
      ORDER BY a.Fecha_Creacion DESC`,[ctx.caso.Caso_ID]);
    return res.json(rows);
  } catch(e){return error(res,e);}
}
async function crearAvance(req,res) {
  const { Titulo,Descripcion }=req.body;
  if(typeof Titulo!=='string'||!Titulo.trim()||Titulo.length>200||typeof Descripcion!=='string'||!Descripcion.trim())return res.status(400).json({message:'Completá título y descripción del avance'});
  try {
    const ctx=await contextoCaso(req.params.id,req.usuario);
    if(!permitido(res,ctx))return;
    if(ctx.cliente)return res.status(403).json({message:'Solo profesionales pueden registrar avances'});
    await db.query('INSERT INTO Avances (Caso_ID,Creado_Por_ID,Titulo,Descripcion,Publicado) VALUES (?,?,?,?,0)',[ctx.caso.Caso_ID,req.usuario.Usuario_ID,Titulo.trim(),Descripcion.trim()]);
    return res.status(201).json({message:'Avance interno registrado'});
  } catch(e){return error(res,e);}
}
async function publicarAvance(req,res) {
  try {
    const ctx=await contextoCaso(req.params.id,req.usuario);
    if(!permitido(res,ctx))return;
    if(!(ctx.admin||ctx.responsable))return res.status(403).json({message:'Solo admin de estudio o responsable puede publicar avances'});
    const [result]=await db.query(`UPDATE Avances SET Publicado=1, Publicado_Por_ID=?, Fecha_Publicacion=NOW()
      WHERE Caso_ID=? AND Avance_ID=?`,[req.usuario.Usuario_ID,ctx.caso.Caso_ID,req.params.avanceId]);
    if(!result.affectedRows)return res.status(404).json({message:'Avance inexistente'});
    return res.json({message:'Avance publicado para el cliente'});
  } catch(e){return error(res,e);}
}
async function quitarAvance(req,res) {
  try {
    const ctx=await contextoCaso(req.params.id,req.usuario);
    if(!permitido(res,ctx))return;
    if(ctx.cliente)return res.status(403).json({message:'No permitido'});
    const [result]=await db.query(`DELETE FROM Avances WHERE Caso_ID=? AND Avance_ID=? AND (Creado_Por_ID=? AND Publicado=0 OR ?=1)`,
      [ctx.caso.Caso_ID,req.params.avanceId,req.usuario.Usuario_ID,ctx.admin||ctx.responsable ? 1 : 0]);
    if(!result.affectedRows)return res.status(403).json({message:'No podés eliminar este avance'});
    return res.json({message:'Avance eliminado'});
  } catch(e){return error(res,e);}
}
// Documentos internos NO aparecen para el cliente.
async function documentos(req,res) {
  try {
    const ctx=await contextoCaso(req.params.id,req.usuario);
    if(!permitido(res,ctx))return;
    const [rows]=await db.query(`SELECT Documento_ID,Caso_ID,Subido_Por_ID,Nombre_Archivo,Visibilidad,Fecha_Subida
      FROM Documentos WHERE Caso_ID=? ${ctx.cliente ? "AND Visibilidad='CLIENTE'" : ''} ORDER BY Fecha_Subida DESC`,[ctx.caso.Caso_ID]);
    return res.json(rows);
  } catch(e){return error(res,e);}
}
// Multer deja el archivo en req.file; guardar() valida PDF/XLSX y lo almacena privado.
async function subirDocumento(req,res) {
  let nombre;
  try {
    const ctx=await contextoCaso(req.params.id,req.usuario);
    if(!permitido(res,ctx))return;
    if(ctx.cliente)return res.status(403).json({message:'Los clientes no pueden subir documentos de un caso'});
    if(!req.file)return res.status(400).json({message:'Seleccioná un PDF o XLSX'});
    const visibilidad=['INTERNO','CLIENTE'].includes(req.body.Visibilidad)?req.body.Visibilidad:'INTERNO';
    if(visibilidad==='CLIENTE' && !(ctx.admin||ctx.responsable))return res.status(403).json({message:'Solo admin o responsable puede compartir documentos con el cliente'});
    nombre=await guardar(req.file,['.pdf','.xlsx']);
    const [result]=await db.query(`INSERT INTO Documentos (Caso_ID,Subido_Por_ID,Nombre_Archivo,Ruta_Archivo,Visibilidad)
      VALUES (?,?,?,?,?)`,[ctx.caso.Caso_ID,req.usuario.Usuario_ID,req.file.originalname.slice(0,255),nombre,visibilidad]);
    return res.status(201).json({message:'Documento cargado',Documento_ID:result.insertId});
  } catch(e){await borrar(nombre);if(e.message.includes('formato')||e.message.includes('PDF')||e.message.includes('XLSX'))return res.status(400).json({message:e.message});return error(res,e,'No se pudo subir documento');}
}
async function descargarDocumento(req,res) {
  try {
    const ctx=await contextoCaso(req.params.id,req.usuario);
    if(!permitido(res,ctx))return;
    const [rows]=await db.query('SELECT * FROM Documentos WHERE Documento_ID=? AND Caso_ID=?',[req.params.docId,ctx.caso.Caso_ID]);
    if(!rows.length || (ctx.cliente && rows[0].Visibilidad!=='CLIENTE'))return res.status(404).json({message:'Documento no disponible'});
    return descargar(res,rows[0].Ruta_Archivo,rows[0].Nombre_Archivo);
  } catch(e){return error(res,e);}
}
async function quitarDocumento(req,res) {
  try {
    const ctx=await contextoCaso(req.params.id,req.usuario);
    if(!permitido(res,ctx))return;
    if(ctx.cliente)return res.status(403).json({message:'Acceso denegado'});
    const [rows]=await db.query('SELECT * FROM Documentos WHERE Documento_ID=? AND Caso_ID=?',[req.params.docId,ctx.caso.Caso_ID]);
    if(!rows.length)return res.status(404).json({message:'Documento inexistente'});
    if(!(ctx.admin||ctx.responsable||rows[0].Subido_Por_ID===req.usuario.Usuario_ID))return res.status(403).json({message:'No podés borrar este documento'});
    await db.query('DELETE FROM Documentos WHERE Documento_ID=?',[rows[0].Documento_ID]);
    await borrar(rows[0].Ruta_Archivo);
    return res.json({message:'Documento eliminado'});
  } catch(e){return error(res,e);}
}
module.exports={listar,buscar,crear,editar,eliminar,abogados,agregarAbogado,quitarAbogado,
  avances,crearAvance,publicarAvance,quitarAvance,documentos,subirDocumento,descargarDocumento,quitarDocumento};
