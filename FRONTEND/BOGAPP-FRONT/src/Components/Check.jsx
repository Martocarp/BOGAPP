import { useEffect, useState } from "react";
import { api, enviarJSON } from "../api";
import { mostrarAlerta, confirmarAccion } from "../utils/alertas";

function Check() {
  const [estudios, setEstudios] = useState([]);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(null);
  function cargar() {
    api("/estudios")
      .then(setEstudios)
      .catch((err) => setError(err.message));
  }
  useEffect(() => {
    cargar();
  }, []);
  async function cambiarEstado(id, estado) {
    const resultado = await confirmarAccion(
      `¿${estado === "APROBADO" ? "Aprobar" : "Rechazar"} esta solicitud?`,
      {
        titulo: estado === "APROBADO" ? "Aprobar estudio" : "Rechazar estudio",
        confirmar: estado === "APROBADO" ? "Aprobar" : "Rechazar",
        peligro: estado === "RECHAZADO",
      }
    );
    if (!resultado.isConfirmed) return;
    setProcesando(id);
    setError("");
    try {
      // Revisado_Por_ID se obtiene de la sesión JWT verificada en Express.
      await enviarJSON("PATCH", `/estudios/${id}/estado`, { Estado: estado });
      await api("/estudios").then(setEstudios);
      mostrarAlerta(estado === "APROBADO" ? "Estudio aprobado correctamente" : "Estudio rechazado correctamente");
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(null);
    }
  }
  const pendientes = estudios.filter((e) => e.Estado === "PENDIENTE");
  return (
    <section className="admin-section">
      <div className="section-head">
        <div>
          <h1>Solicitudes pendientes</h1>
          <p>Aprobá o rechazá nuevas solicitudes de estudios.</p>
        </div>
        <span className="count-pill">{pendientes.length} pendientes</span>
      </div>
      {error && <p className="error-text">{error}</p>}
      {!pendientes.length && (
        <div className="empty-state">No hay solicitudes pendientes.</div>
      )}
      {pendientes.map((e) => (
        <div className="item-card" key={e.Estudio_ID}>
          <div>
            <h3>{e.Nombre}</h3>
            <p>
              {e.Direccion || "Sin dirección"} · {e.Telefono || "Sin teléfono"}
            </p>
            <small>
              Solicitante: {e.Solicitante} · #{e.Estudio_ID}
            </small>
          </div>
          <div className="actions">
            <button
              disabled={procesando !== null}
              onClick={() => cambiarEstado(e.Estudio_ID, "APROBADO")}
            >
              Aprobar
            </button>
            <button
              className="btn-danger-outline"
              disabled={procesando !== null}
              onClick={() => cambiarEstado(e.Estudio_ID, "RECHAZADO")}
            >
              Rechazar
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
export default Check;
