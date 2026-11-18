import { useState } from "react";
import { enviarJSON } from "../api";

function CrearEstudio({ onCreado }) {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function solicitarEstudio(e) {
    e.preventDefault(); setMensaje(""); setError(""); setEnviando(true);
    try {
      const data = await enviarJSON("POST", "/estudios", {
        Nombre: nombre, Direccion: direccion, Telefono: telefono,
        // El backend obtiene Creado_Por_ID de la sesión, no desde React.
      });
      setMensaje(data.message);
      setNombre(""); setDireccion(""); setTelefono("");
      if (onCreado) onCreado();
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }
  return (
    <section className="panel-card">
      <h2>Solicitar un estudio jurídico</h2>
      <p>El Super Admin deberá aprobar la solicitud para activar el estudio.</p>
      <form onSubmit={solicitarEstudio} className="form-grid">
        <label>Nombre del estudio<input value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Estudio Jurídico..." /></label>
        <label>Dirección<input value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Dirección" /></label>
        <label>Teléfono<input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Teléfono" /></label>
        <button type="submit" disabled={enviando}>{enviando ? "Enviando..." : "Enviar solicitud"}</button>
      </form>
      {mensaje && <p className="success-text">{mensaje}</p>}
      {error && <p className="error-text">{error}</p>}
    </section>
  );
}
export default CrearEstudio;
