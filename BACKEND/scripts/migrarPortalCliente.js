require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const db = require('../config/db').promise();

// Ejecutar una sola vez al instalar las nuevas funciones del cliente.
// CREATE TABLE IF NOT EXISTS permite repetirlo sin eliminar registros.

async function main() {
  const archivo = path.join(__dirname, '../migrations/002_portal_cliente.sql');
  const sql = fs.readFileSync(archivo, 'utf8');
  const instrucciones = sql.replace(/^\s*--.*$/gm, '').split(';').map(x => x.trim()).filter(Boolean);

  for (const instruccion of instrucciones) await db.query(instruccion);
  console.log('Portal Cliente: tablas preparadas correctamente.');
}

main()
  .catch(error => { console.error('Error de migración:', error.message); process.exitCode = 1; })
  .finally(() => db.end());
