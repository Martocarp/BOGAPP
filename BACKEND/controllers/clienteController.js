const { db, intId, estudioDe, contextoCaso, permitido } = require('../helpers/permisos');


function error(res, err) {
  console.error('Portal cliente:', err.message);
  return res.status(500).json({ message: 'No se pudo completar la operación' });
}

// Novedades REALES del cliente: avances publicados y preguntas sin responder.

async function actividad(req, res) {
  const clienteId = req.usuario.Usuario_ID;

  try {
    const [novedades] = await db.query(`
      SELECT a.Avance_ID, a.Caso_ID, a.Titulo, a.Fecha_Publicacion, c.Titulo AS Caso_Titulo
      FROM Avances a JOIN Casos c ON c.Caso_ID = a.Caso_ID
      WHERE c.Cliente_ID = ? AND a.Publicado = 1
      ORDER BY a.Fecha_Publicacion DESC LIMIT 5`, [clienteId]);

    const [pendientes] = await db.query(`
      SELECT COUNT(*) AS total FROM Consultas_Casos cc
      JOIN Casos c ON c.Caso_ID = cc.Caso_ID
      WHERE c.Cliente_ID = ? AND cc.Respuesta IS NULL`, [clienteId]);

    return res.json({ novedades, preguntasPendientes: pendientes[0].total });
  } catch (err) { return error(res, err); }
}

// Listar solicitudes: el cliente ve las propias; el abogado, las de su espacio activo.

async function listarSolicitudes(req, res) {
  const uid = req.usuario.Usuario_ID;
  const tipo = req.usuario.Tipo_Cuenta;
  const estudioId = intId(req.query.estudioId);

  try {
    let condicion = 's.Cliente_ID = ?';
    let parametros = [uid];

    if (tipo === 'PROFESIONAL') {
      if (req.query.espacio === 'estudio') {
        // Los pedidos pueden contener información sensible: solo los ve ADMIN_ESTUDIO.
        if ((await estudioDe(uid, estudioId)) !== 'ADMIN_ESTUDIO') {
          return res.status(403).json({ message: 'Solo el administrador del estudio puede consultar estos pedidos' });
        }

        condicion = 's.Estudio_ID = ?';
        parametros = [estudioId];
      } else {
        condicion = 's.Profesional_ID = ?';
      }
    } else if (tipo !== 'CLIENTE') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const [rows] = await db.query(`
      SELECT s.*, CONCAT(u.Nombre, ' ', u.Apellido) AS Cliente_Nombre,
        CONCAT(p.Nombre, ' ', p.Apellido) AS Profesional_Nombre, e.Nombre AS Estudio_Nombre
      FROM Solicitudes_Casos s
      JOIN Usuarios u ON u.Usuario_ID = s.Cliente_ID
      LEFT JOIN Usuarios p ON p.Usuario_ID = s.Profesional_ID
      LEFT JOIN Estudios e ON e.Estudio_ID = s.Estudio_ID
      WHERE ${condicion} ORDER BY s.Fecha_Solicitud DESC`, parametros);

    return res.json(rows);
  } catch (err) { return error(res, err); }
}

// El cliente solo puede enviar pedidos a estudios o profesionales con vínculo ACTIVO.

async function crearSolicitud(req, res) {
  const clienteId = req.usuario.Usuario_ID;
  const profesionalId = req.body.Profesional_ID ? intId(req.body.Profesional_ID) : null;
  const estudioId = req.body.Estudio_ID ? intId(req.body.Estudio_ID) : null;
  const { Titulo, Descripcion } = req.body;

  if (Boolean(profesionalId) === Boolean(estudioId) || typeof Titulo !== 'string' ||
    !Titulo.trim() || Titulo.length > 200 || typeof Descripcion !== 'string' ||
    !Descripcion.trim() || Descripcion.length > 4000) {
    return res.status(400).json({ message: 'Elegí un destinatario y completá el asunto' });
  }

  try {
    const [vinculos] = estudioId
      ? await db.query("SELECT 1 FROM Clientes_Estudios WHERE Usuario_ID=? AND Estudio_ID=? AND Estado='ACTIVO'", [clienteId, estudioId])
      : await db.query("SELECT 1 FROM Profesionales_Clientes WHERE Cliente_ID=? AND Profesional_ID=? AND Estado='ACTIVO'", [clienteId, profesionalId]);

    if (!vinculos.length) return res.status(403).json({ message: 'Primero necesitás una vinculación activa' });

    const [result] = await db.query(`
      INSERT INTO Solicitudes_Casos (Cliente_ID, Profesional_ID, Estudio_ID, Titulo, Descripcion)
      VALUES (?, ?, ?, ?, ?)`, [clienteId, profesionalId, estudioId, Titulo.trim(), Descripcion.trim()]);

    return res.status(201).json({ message: 'Consulta enviada. Todavía no es un expediente.', Solicitud_ID: result.insertId });
  } catch (err) { return error(res, err); }
}

// Aceptar significa que el abogado evaluará el pedido; el expediente se crea aparte.

async function responderSolicitud(req, res) {
  const id = intId(req.params.id);
  const { Estado } = req.body;
  if (!id || !['ACEPTADA', 'RECHAZADA'].includes(Estado)) {
    return res.status(400).json({ message: 'Solicitud o respuesta inválida' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM Solicitudes_Casos WHERE Solicitud_ID=?', [id]);
    const solicitud = rows[0];
    if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada' });

    const autorizado = solicitud.Estudio_ID
      ? (await estudioDe(req.usuario.Usuario_ID, solicitud.Estudio_ID)) === 'ADMIN_ESTUDIO'
      : solicitud.Profesional_ID === req.usuario.Usuario_ID;

    if (!autorizado) return res.status(403).json({ message: 'No podés responder esta solicitud' });

    const [result] = await db.query(`
      UPDATE Solicitudes_Casos SET Estado=?, Fecha_Respuesta=NOW()
      WHERE Solicitud_ID=? AND Estado='PENDIENTE'`, [Estado, id]);

    if (!result.affectedRows) return res.status(409).json({ message: 'La solicitud ya fue respondida' });
    return res.json({ message: 'Solicitud actualizada. Podés crear el expediente desde Casos.' });
  } catch (err) { return error(res, err); }
}

// Preguntas sobre un expediente: solo el cliente titular pregunta y un responsable responde.

async function consultas(req, res) {
  try {
    const contexto = await contextoCaso(req.params.id, req.usuario);
    if (!permitido(res, contexto)) return;

    const [rows] = await db.query(`
      SELECT * FROM Consultas_Casos WHERE Caso_ID = ?
      ORDER BY Fecha_Pregunta DESC, Consulta_ID DESC`, [contexto.caso.Caso_ID]);

    return res.json(rows);
  } catch (err) { return error(res, err); }
}


async function preguntar(req, res) {
  const pregunta = req.body.Pregunta;
  if (typeof pregunta !== 'string' || !pregunta.trim() || pregunta.length > 2000) {
    return res.status(400).json({ message: 'Escribí una consulta de hasta 2000 caracteres' });
  }

  try {
    const contexto = await contextoCaso(req.params.id, req.usuario);
    if (!permitido(res, contexto)) return;
    if (!contexto.cliente) return res.status(403).json({ message: 'Solo el cliente puede preguntar' });

    await db.query('INSERT INTO Consultas_Casos (Caso_ID, Pregunta) VALUES (?, ?)',
      [contexto.caso.Caso_ID, pregunta.trim()]);

    return res.status(201).json({ message: 'Consulta enviada al profesional' });
  } catch (err) { return error(res, err); }
}


async function responderConsulta(req, res) {
  const respuesta = req.body.Respuesta;
  const consultaId = intId(req.params.consultaId);
  if (!consultaId || typeof respuesta !== 'string' || !respuesta.trim() || respuesta.length > 2000) {
    return res.status(400).json({ message: 'Escribí una respuesta válida' });
  }

  try {
    const contexto = await contextoCaso(req.params.id, req.usuario);
    if (!permitido(res, contexto)) return;
    if (!(contexto.admin || contexto.responsable)) {
      return res.status(403).json({ message: 'Solo el responsable o administrador puede responder' });
    }

    const [result] = await db.query(`
      UPDATE Consultas_Casos SET Respuesta=?, Fecha_Respuesta=NOW()
      WHERE Consulta_ID=? AND Caso_ID=? AND Respuesta IS NULL`,
      [respuesta.trim(), consultaId, contexto.caso.Caso_ID]);

    if (!result.affectedRows) return res.status(409).json({ message: 'Consulta inexistente o ya respondida' });
    return res.json({ message: 'Respuesta enviada' });
  } catch (err) { return error(res, err); }
}

module.exports = {
  actividad, listarSolicitudes, crearSolicitud, responderSolicitud,
  consultas, preguntar, responderConsulta
};
