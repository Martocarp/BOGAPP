const db = require('../config/db').promise();
// Convierte un ID recibido por URL o formulario a entero válido.
const intId = value => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
// Comprueba el rol real del profesional en un estudio activo.

async function estudioDe(profId, estudioId) {
  if (!intId(estudioId)) return null;
  const [rows] = await db.query(`SELECT pe.Rol_Estudio FROM Profesionales_Estudios pe
    JOIN Estudios e ON e.Estudio_ID = pe.Estudio_ID
    WHERE pe.Usuario_ID = ? AND pe.Estudio_ID = ? AND pe.Estado = 'ACTIVO' AND e.Estado = 'APROBADO'`, [profId, estudioId]);
  return rows[0]?.Rol_Estudio || null;
}
// Punto central de seguridad: verifica si este usuario puede ver/editar ESTE caso.
// Primero carga el caso, después comprueba cliente, abogado independiente o estudio.

async function contextoCaso(casoId, usuario) {
  const [rows] = await db.query('SELECT * FROM Casos WHERE Caso_ID = ?', [casoId]);
  const caso = rows[0];
  if (!caso) return { error: 404, message: 'Expediente no encontrado' };
  if (usuario.Tipo_Cuenta === 'ADMIN_BOGAPP') return { caso, admin: true, editor: true, responsable: true };
  if (usuario.Tipo_Cuenta === 'CLIENTE') {
    if (caso.Cliente_ID !== usuario.Usuario_ID) return { error: 403, message: 'No podés acceder a este expediente' };
    return { caso, cliente: true, editor: false, responsable: false };
  }
  if (usuario.Tipo_Cuenta !== 'PROFESIONAL') return { error: 403, message: 'Acceso denegado' };
  if (caso.Estudio_ID === null) {
    if (caso.Responsable_ID !== usuario.Usuario_ID) return { error: 403, message: 'No pertenece a tus casos particulares' };
    return { caso, particular: true, editor: true, responsable: true };
  }
  const rol = await estudioDe(usuario.Usuario_ID, caso.Estudio_ID);
  if (!rol) return { error: 403, message: 'No pertenecés al estudio' };
  const admin = rol === 'ADMIN_ESTUDIO';
  if (admin || caso.Responsable_ID === usuario.Usuario_ID) return { caso, admin, editor: true, responsable: caso.Responsable_ID === usuario.Usuario_ID, rol };
  const [rows2] = await db.query('SELECT 1 FROM Casos_Abogados WHERE Caso_ID = ? AND Abogado_ID = ?', [casoId, usuario.Usuario_ID]);
  if (rows2.length) return { caso, colaborador: true, editor: false, responsable: false, rol };
  return { error: 403, message: 'No tenés acceso a este expediente' };
}

function permitido(res, context) { if (context.error) { res.status(context.error).json({ message: context.message }); return false; } return true; }
module.exports = { db, intId, estudioDe, contextoCaso, permitido };
