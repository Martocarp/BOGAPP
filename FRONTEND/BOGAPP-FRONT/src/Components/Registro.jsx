import { useState } from "react";
import { Link } from "react-router-dom";
import { enviarJSON } from "../api";

function Registro({ tipo }) {
  const [form, setForm] = useState({ Nombre: "", Apellido: "", Email: "", Password: "", Confirmar: "", Matricula: "" });
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const profesional = tipo === "PROFESIONAL";

  function actualizar(e) { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); }
  async function registrar(e) {
    e.preventDefault(); setError(""); setMensaje("");
    if (form.Password !== form.Confirmar) { setError("Las contraseñas no coinciden"); return; }
    setEnviando(true);
    try {
      const data = await enviarJSON("POST", "/users", {
        Nombre: form.Nombre, Apellido: form.Apellido, Email: form.Email,
        Password: form.Password, Tipo_Cuenta: tipo,
        ...(profesional ? { Matricula: form.Matricula } : {}),
      });
      setMensaje(`${data.message}. Ya podés iniciar sesión.`);
      setForm({ Nombre: "", Apellido: "", Email: "", Password: "", Confirmar: "", Matricula: "" });
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }
  return (
    <div className="auth-page registro-page">
      <div className="auth-mark">⚖</div>
      <h1>BOGAPP</h1>
      <h2>{profesional ? "Cuenta profesional" : "Cuenta de cliente"}</h2>
      <p className="auth-subtitle">Creá tu cuenta para acceder al sistema.</p>
      <form onSubmit={registrar}>
        <label>Nombre</label>
        <input name="Nombre" placeholder="Nombre" value={form.Nombre} onChange={actualizar} required />
        <label>Apellido</label>
        <input name="Apellido" placeholder="Apellido" value={form.Apellido} onChange={actualizar} required />
        <label>Correo electrónico</label>
        <input type="email" name="Email" placeholder="correo@ejemplo.com" value={form.Email} onChange={actualizar} required />
        {profesional && <><label>Matrícula (opcional)</label>
          <input name="Matricula" placeholder="Nº de matrícula" value={form.Matricula} onChange={actualizar} /></>}
        <label>Contraseña</label>
        <input type="password" name="Password" minLength={8} placeholder="Mínimo 8 caracteres"
          autoComplete="new-password" value={form.Password} onChange={actualizar} required />
        <label>Confirmar contraseña</label>
        <input type="password" name="Confirmar" minLength={8} placeholder="Repetí la contraseña"
          autoComplete="new-password" value={form.Confirmar} onChange={actualizar} required />
        <button type="submit" disabled={enviando}>{enviando ? "Registrando..." : "Crear cuenta"}</button>
      </form>
      {mensaje && <p className="success-text">{mensaje} <Link to="/login">Ir al login</Link></p>}
      {error && <p className="error-text">{error}</p>}
      <p className="auth-footer">¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link></p>
      <p className="auth-footer">{profesional ? <Link to="/register">Registro de cliente</Link> : <Link to="/register/profesional">Registro profesional</Link>}</p>
    </div>
  );
}
export default Registro;
