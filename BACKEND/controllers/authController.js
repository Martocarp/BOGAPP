const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const connection = require("../config/db");

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

// El registro público solo permite CLIENTE o PROFESIONAL. El Admin se crea con un script.
function registrar(req, res) {
  const { Nombre, Apellido, Email, Password, Tipo_Cuenta, Matricula } = req.body;
  if (![Nombre, Apellido, Email].every(x => typeof x === "string" && x.trim()) ||
      typeof Password !== "string" || !["CLIENTE", "PROFESIONAL"].includes(Tipo_Cuenta)) {
    return res.status(400).json({ message: "Completá los datos obligatorios" });
  }
  if (!/^\S+@\S+\.\S+$/.test(Email.trim())) return res.status(400).json({ message: "Email inválido" });
  if (Password.length < 8 || Buffer.byteLength(Password, "utf8") > 72) {
    return res.status(400).json({ message: "La contraseña debe tener 8 o más caracteres y hasta 72 bytes" });
  }
  if (Matricula !== undefined && Matricula !== null && typeof Matricula !== "string") {
    return res.status(400).json({ message: "Matrícula inválida" });
  }
  bcrypt.hash(Password, 10, (err, hash) => {
    if (err) return res.status(500).json({ message: "Error al procesar contraseña" });
    const sql = `INSERT INTO Usuarios (Nombre, Apellido, Email, Password_Hash, Tipo_Cuenta, Matricula)
      VALUES (?, ?, ?, ?, ?, ?)`;
    connection.query(sql, [Nombre.trim(), Apellido.trim(), Email.trim().toLowerCase(), hash,
      Tipo_Cuenta, Tipo_Cuenta === "PROFESIONAL" ? (Matricula?.trim() || null) : null], (err, results) => {
      if (err?.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Email ya registrado" });
      if (err) return res.status(500).json({ message: "Error al registrar usuario" });
      return res.status(201).json({ message: "Usuario registrado correctamente", id: results.insertId });
    });
  });
}

// Comparar el hash con bcrypt y guardar un JWT en una cookie HttpOnly.
function login(req, res) {
  const { Email, Password } = req.body;
  if (typeof Email !== "string" || typeof Password !== "string" || !Email.trim() || !Password) {
    return res.status(400).json({ message: "Email y contraseña obligatorios" });
  }
  connection.query(
    `SELECT Usuario_ID, Nombre, Apellido, Email, Tipo_Cuenta, Matricula, Password_Hash
     FROM Usuarios WHERE Email = ? AND Estado = 1`,
    [Email.trim().toLowerCase()], (err, results) => {
      if (err) return res.status(500).json({ message: "Error al buscar usuario" });
      if (!results.length || !results[0].Password_Hash) {
        return res.status(401).json({ message: "Email o contraseña incorrectos" });
      }
      const usuario = results[0];
      bcrypt.compare(Password, usuario.Password_Hash, (err, valido) => {
        if (err) return res.status(500).json({ message: "Error al verificar contraseña" });
        if (!valido) return res.status(401).json({ message: "Email o contraseña incorrectos" });
        const token = jwt.sign({ id: usuario.Usuario_ID }, process.env.JWT_SECRET,
          { algorithm: "HS256", expiresIn: "8h" });
        res.cookie("bogapp_session", token, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
        const { Password_Hash, ...datosPublicos } = usuario;
        return res.json({ message: "Login correcto", usuario: datosPublicos });
      });
    }
  );
}

// Cambio de clave: exige la contraseña actual y nunca devuelve contraseñas ni hashes.
async function cambiarClave(req, res) {
  const { actual, nueva } = req.body || {};
  if (typeof actual !== 'string' || typeof nueva !== 'string' ||
      nueva.length < 8 || Buffer.byteLength(nueva, 'utf8') > 72) {
    return res.status(400).json({message:'Ingresá la contraseña actual y una nueva de 8 o más caracteres (máximo 72 bytes)'});
  }
  try {
    const [rows] = await connection.promise().query('SELECT Password_Hash FROM Usuarios WHERE Usuario_ID=?', [req.usuario.Usuario_ID]);
    if (!rows.length || !(await bcrypt.compare(actual, rows[0].Password_Hash))) {
      return res.status(401).json({message:'La contraseña actual es incorrecta'});
    }
    const hash = await bcrypt.hash(nueva, 10);
    await connection.promise().query('UPDATE Usuarios SET Password_Hash=? WHERE Usuario_ID=?', [hash, req.usuario.Usuario_ID]);
    return res.json({message:'Contraseña actualizada correctamente'});
  } catch (err) {
    console.error('Cambiar contraseña:', err.message);
    return res.status(500).json({message:'No se pudo cambiar la contraseña'});
  }
}
function me(req, res) { return res.json({ usuario: req.usuario }); }
function logout(req, res) {
  res.clearCookie("bogapp_session", cookieOptions);
  return res.json({ message: "Sesión cerrada" });
}

module.exports = { registrar, login, cambiarClave, me, logout };
