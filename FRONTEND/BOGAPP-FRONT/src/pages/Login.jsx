import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { ingresar } = useAuth();
  const navigate = useNavigate();

  // El login devuelve el rol del usuario; la protección REAL de datos está en Express.
  async function iniciarSesion(e) {
    e.preventDefault();
    setError(""); setEnviando(true);
    try {
      const usuario = await ingresar(email, password);
      const rutas = { ADMIN_BOGAPP: "/", PROFESIONAL: "/profesional", CLIENTE: "/cliente" };
      navigate(rutas[usuario.Tipo_Cuenta] || "/sin-permiso", { replace: true });
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-mark">⚖</div>
      <h1>BOGAPP</h1>
      <p className="auth-subtitle">Plataforma de gestión jurídica</p>
      <h2>Iniciar sesión</h2>
      <form onSubmit={iniciarSesion}>
        <label>Correo electrónico</label>
        <input type="email" placeholder="tu@email.com" value={email}
          onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        <label>Contraseña</label>
        <input type={mostrarClave ? "text" : "password"} placeholder="Tu contraseña" value={password}
          onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
        <label className="pro-check"><input type="checkbox" checked={mostrarClave} onChange={e => setMostrarClave(e.target.checked)} /> Mostrar contraseña</label>
        <button type="submit" disabled={enviando}>{enviando ? "Ingresando..." : "Iniciar sesión"}</button>
      </form>
      {error && <p className="error-text" role="alert">{error}</p>}
      <p className="auth-footer">¿No tenés cuenta? <Link to="/register">Registrate como cliente</Link></p>
      <p className="auth-footer"><Link to="/register/profesional">Crear cuenta profesional</Link></p>
    </div>
  );
}
export default Login;
