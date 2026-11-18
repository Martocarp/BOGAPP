// Eliminación explícita en orden por claves foráneas. Todo ocurre en UNA transacción.
// Eliminar un usuario vinculado también elimina sus expedientes y sus estudios creados.
async function borrarCasos(db, ids) {
  if (!ids.length) return;
  await db.query("DELETE FROM Documentos WHERE Caso_ID IN (?)", [ids]);
  await db.query("DELETE FROM Avances WHERE Caso_ID IN (?)", [ids]);
  await db.query("DELETE FROM Casos_Abogados WHERE Caso_ID IN (?)", [ids]);
  await db.query("DELETE FROM Casos WHERE Caso_ID IN (?)", [ids]);
}

async function borrarEstudios(db, ids) {
  if (!ids.length) return;
  const [casos] = await db.query("SELECT Caso_ID FROM Casos WHERE Estudio_ID IN (?)", [ids]);
  const caseIds = casos.map(c=>c.Caso_ID);
  const [docs] = caseIds.length ? await db.query("SELECT Ruta_Archivo FROM Documentos WHERE Caso_ID IN (?)", [caseIds]) : [[]];
  await borrarCasos(db, caseIds);
  // Tabla opcional añadida durante la etapa de especializaciones.
  try {
    await db.query("DELETE FROM Estudios_Especializaciones WHERE Estudio_ID IN (?)", [ids]);
  } catch (err) {
    if (err.code !== "ER_NO_SUCH_TABLE") throw err;
  }
  await db.query("DELETE FROM Clientes_Estudios WHERE Estudio_ID IN (?)", [ids]);
  await db.query("DELETE FROM Profesionales_Estudios WHERE Estudio_ID IN (?)", [ids]);
  await db.query("DELETE FROM Estudios WHERE Estudio_ID IN (?)", [ids]);
  return docs.map(d=>d.Ruta_Archivo);
}

async function borrarUsuario(db, id) {
  const [propios] = await db.query("SELECT Estudio_ID FROM Estudios WHERE Creado_Por_ID = ?", [id]);
  const archivos = await borrarEstudios(db, propios.map(e => e.Estudio_ID)) || [];

  // Otros casos que le pertenecen como cliente o responsable/creador.
  const [casos] = await db.query(
    "SELECT Caso_ID FROM Casos WHERE Cliente_ID = ? OR Creado_Por_ID = ? OR Responsable_ID = ?",
    [id, id, id]
  );
  const [docs] = casos.length ? await db.query("SELECT Ruta_Archivo FROM Documentos WHERE Caso_ID IN (?)", [casos.map(c=>c.Caso_ID)]) : [[]];
  archivos.push(...docs.map(d=>d.Ruta_Archivo));
  await borrarCasos(db, casos.map(c => c.Caso_ID));

  await db.query("DELETE FROM Casos_Abogados WHERE Abogado_ID = ?", [id]);
  const [docsPropios] = await db.query("SELECT Ruta_Archivo FROM Documentos WHERE Subido_Por_ID = ?", [id]);
  archivos.push(...docsPropios.map(d=>d.Ruta_Archivo));
  await db.query("DELETE FROM Documentos WHERE Subido_Por_ID = ?", [id]);
  await db.query("UPDATE Avances SET Publicado_Por_ID = NULL WHERE Publicado_Por_ID = ?", [id]);
  await db.query("DELETE FROM Avances WHERE Creado_Por_ID = ?", [id]);
  await db.query("UPDATE Estudios SET Revisado_Por_ID = NULL WHERE Revisado_Por_ID = ?", [id]);
  // Nuevas relaciones, presentes después de la migración profesional.
  try {
    const [cv] = await db.query("SELECT Cv_Ruta FROM Perfiles_Profesionales WHERE Usuario_ID = ?", [id]);
    if (cv[0]?.Cv_Ruta) archivos.push(cv[0].Cv_Ruta);
    await db.query("DELETE FROM Profesionales_Especializaciones WHERE Usuario_ID = ?", [id]);
    await db.query("DELETE FROM Perfiles_Profesionales WHERE Usuario_ID = ?", [id]);
    await db.query("DELETE FROM Profesionales_Clientes WHERE Profesional_ID = ? OR Cliente_ID = ?", [id, id]);
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
  }
  await db.query("DELETE FROM Clientes_Estudios WHERE Usuario_ID = ?", [id]);
  await db.query("DELETE FROM Profesionales_Estudios WHERE Usuario_ID = ?", [id]);
  await db.query("DELETE FROM Usuarios WHERE Usuario_ID = ?", [id]);
  return archivos;
}

module.exports = { borrarEstudios, borrarUsuario };
