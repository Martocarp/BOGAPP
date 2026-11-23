const { db, estudioDe, intId } = require('../helpers/permisos');

async function obtener(req, res) {
  const id = intId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Estudio inválido' });
  try {
    const [rows] = await db.query(`SELECT esp.Especializacion_ID,esp.Nombre FROM Estudios_Especializaciones ee
      JOIN Especializaciones esp ON esp.Especializacion_ID=ee.Especializacion_ID
      WHERE ee.Estudio_ID=? ORDER BY esp.Nombre`, [id]); return res.json(rows);
  } catch (e) { return res.status(500).json({ message: 'Error al obtener especializaciones' }); }
}

async function guardar(req, res) {
  const id = intId(req.params.id), especializaciones = req.body.especializaciones;
  if (!id || !Array.isArray(especializaciones) || especializaciones.length > 30 || !especializaciones.every(x => intId(x)) ||
    new Set(especializaciones.map(Number)).size !== especializaciones.length) return res.status(400).json({ message: 'Especializaciones inválidas' });
  try {
    if (req.usuario.Tipo_Cuenta !== 'ADMIN_BOGAPP' && (await estudioDe(req.usuario.Usuario_ID, id)) !== 'ADMIN_ESTUDIO') return res.status(403).json({ message: 'Solo administrador del estudio' });
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction(); await conn.query('DELETE FROM Estudios_Especializaciones WHERE Estudio_ID=?', [id]);
      for (const esp of especializaciones) await conn.query('INSERT INTO Estudios_Especializaciones (Estudio_ID,Especializacion_ID) VALUES (?,?)', [id, esp]);
      await conn.commit(); return res.json({ message: 'Especializaciones del estudio actualizadas' });
    } catch (e) { await conn.rollback(); return res.status(500).json({ message: 'No se pudieron guardar las especializaciones' }); }
    finally { conn.release(); }
  } catch (e) { return res.status(500).json({ message: 'Error de permisos' }); }
}
module.exports = { obtener, guardar };
