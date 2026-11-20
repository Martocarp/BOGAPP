require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const db = require("../config/db").promise();
// DDL no es transaccional en MySQL. Hacer backup antes de ejecutarlo.
function ident(s) { return '`' + String(s).replace(/`/g, '``') + '`'; }
// Se ejecuta UNA SOLA VEZ o cuando reinstalamos: modifica estructura de MySQL, no vistas React.
// La parte larga existe para conservar las claves foráneas de la tabla Casos.
async function main() {
  const [cols] = await db.query(`SELECT IS_NULLABLE FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Casos' AND COLUMN_NAME = 'Estudio_ID'`);
  if (!cols.length) throw new Error("No encuentro Casos.Estudio_ID. Revisá el esquema MySQL de BOGAPP.");
  if (cols[0].IS_NULLABLE !== "YES") {
    const [parts] = await db.query(`SELECT k.CONSTRAINT_NAME, k.TABLE_NAME, k.COLUMN_NAME,
      k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME, k.ORDINAL_POSITION,
      r.UPDATE_RULE, r.DELETE_RULE
      FROM information_schema.KEY_COLUMN_USAGE k
      JOIN information_schema.REFERENTIAL_CONSTRAINTS r
        ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
        AND r.TABLE_NAME = k.TABLE_NAME AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
      WHERE k.CONSTRAINT_SCHEMA = DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY k.TABLE_NAME, k.CONSTRAINT_NAME, k.ORDINAL_POSITION`);
    const group = new Map();
    for (const r of parts) {
      const key = `${r.TABLE_NAME}:${r.CONSTRAINT_NAME}`;
      if (!group.has(key)) group.set(key, []);
      group.get(key).push(r);
    }
    const keys = [...group.values()].filter(group => group.some(r =>
      (r.TABLE_NAME === 'Casos' && r.COLUMN_NAME === 'Estudio_ID') ||
      (r.REFERENCED_TABLE_NAME === 'Casos' && r.REFERENCED_COLUMN_NAME === 'Estudio_ID')));
    const changes = keys.map(group => ({
      table: group[0].TABLE_NAME, name: group[0].CONSTRAINT_NAME,
      sql: `ALTER TABLE ${ident(group[0].TABLE_NAME)} ADD CONSTRAINT ${ident(group[0].CONSTRAINT_NAME)} FOREIGN KEY
        (${group.map(r => ident(r.COLUMN_NAME)).join(', ')}) REFERENCES ${ident(group[0].REFERENCED_TABLE_NAME)}
        (${group.map(r => ident(r.REFERENCED_COLUMN_NAME)).join(', ')})
        ON UPDATE ${group[0].UPDATE_RULE} ON DELETE ${group[0].DELETE_RULE}`
    }));
    const dropped = [];
    try {
      for (const fk of changes) {
        await db.query(`ALTER TABLE ${ident(fk.table)} DROP FOREIGN KEY ${ident(fk.name)}`);
        dropped.push(fk);
      }
      await db.query("ALTER TABLE Casos MODIFY COLUMN Estudio_ID INT NULL");
    } finally {
      // Recuperar las FK incluso si ALTER falla.
      for (const fk of dropped.reverse()) {
        try { await db.query(fk.sql); }
        catch (e) { console.error(`ATENCIÓN: restaurar FK ${fk.name} manualmente:`, e.message); throw e; }
      }
    }
    console.log("Casos.Estudio_ID ahora admite NULL (casos particulares)");
  } else console.log("Casos.Estudio_ID ya admite NULL");
  const [origenCol] = await db.query(`SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='Clientes_Estudios' AND COLUMN_NAME='Origen'`);
  if (!origenCol.length) {
    await db.query("ALTER TABLE Clientes_Estudios ADD COLUMN Origen ENUM('SOLICITUD','INVITACION') NOT NULL DEFAULT 'SOLICITUD'");
    console.log('Agregado Origen a Clientes_Estudios');
  }
  // La tabla puede existir desde una migración anterior sin la columna Origen.
  const [particularExiste] = await db.query(`SELECT TABLE_NAME FROM information_schema.TABLES
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='Profesionales_Clientes'`);
  if (particularExiste.length) {
    const [origenParticular] = await db.query(`SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='Profesionales_Clientes' AND COLUMN_NAME='Origen'`);
    if (!origenParticular.length) await db.query("ALTER TABLE Profesionales_Clientes ADD COLUMN Origen ENUM('SOLICITUD','INVITACION') NOT NULL DEFAULT 'INVITACION'");
  }
  const sql = fs.readFileSync(path.join(__dirname, '../migrations/001_profesionales.sql'), 'utf8');
  const statements = sql.replace(/^\s*--.*$/gm, '').split(';').map(s=>s.trim()).filter(Boolean);
  for (const stmt of statements) await db.query(stmt);
  console.log(`Migración aplicada correctamente (${statements.length} instrucciones SQL).`);
}
main().then(() => db.end()).catch(async err => {
  console.error("Error al migrar:", err.message);
  await db.end(); process.exitCode = 1;
});
