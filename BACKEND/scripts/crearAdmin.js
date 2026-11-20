// Script manual: ejecutá «node scripts/crearAdmin.js» para crear un Super Admin.
// No forma parte del servidor que atiende las peticiones React.
// Inicialización LOCAL del Super Admin. No hay ruta HTTP para crear administradores.
require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("../config/db");

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 8 || !process.env.DB_NAME) {
    throw new Error("Definí ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 8 caracteres) temporalmente en tu terminal");
  }
  const hash = await bcrypt.hash(password, 10);
  const [rows] = await db.promise().query("SELECT Usuario_ID, Tipo_Cuenta FROM Usuarios WHERE Email = ?", [email]);
  if (rows.length) {
    if (rows[0].Tipo_Cuenta !== "ADMIN_BOGAPP") throw new Error("Ese email ya pertenece a otra cuenta");
    await db.promise().query("UPDATE Usuarios SET Password_Hash = ?, Estado = 1 WHERE Usuario_ID = ?", [hash, rows[0].Usuario_ID]);
    console.log(`Contraseña del Admin actualizada (ID ${rows[0].Usuario_ID})`);
  } else {
    const [result] = await db.promise().query(`INSERT INTO Usuarios
      (Nombre, Apellido, Email, Password_Hash, Tipo_Cuenta, Estado)
      VALUES ('Admin', 'BOGAPP', ?, ?, 'ADMIN_BOGAPP', 1)`, [email, hash]);
    console.log(`Super Admin creado (ID ${result.insertId})`);
  }
}
main().catch(err => { console.error("Error:", err.message); process.exitCode = 1; }).finally(() => db.end());
