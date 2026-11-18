import { useEffect, useState } from "react";
import { api } from "../api";
import { mostrarAlerta, confirmarAccion } from "../utils/alertas";

function EliminarEstudios() {
  const [estudios, setEstudios] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  function cargar() { api("/estudios").then(setEstudios).catch(err => setError(err.message)); }
  useEffect(() => { cargar(); }, []);
  const rechazados = estudios.filter(e => e.Estado === "RECHAZADO");
  async function limpiar() {
    if (!rechazados.length) return;
    const resultado = await confirmarAccion(`Borrar ${rechazados.length} estudios rechazados. ¿Continuar?`, {
      titulo: "Limpiar estudios rechazados", confirmar: "Eliminar rechazados", peligro: true,
    });
    if (!resultado.isConfirmed) return;
    setProcesando(true); setError("");
    let exitos = 0;
    for (const e of rechazados) {
      try { await api(`/estudios/${e.Estudio_ID}`, { method: "DELETE" }); exitos++; }
      catch (err) { setError(`Algunos estudios no se pudieron eliminar: ${err.message}`); }
    }
    setMensaje(`${exitos} estudios eliminados`); setProcesando(false); cargar();
    if (exitos) mostrarAlerta(`${exitos} estudios rechazados eliminados`);
  }
  return <section className="admin-section">
    <h1>Limpieza de estudios</h1><p>Herramienta para quitar solicitudes rechazadas que ya no son necesarias.</p>
    <div className="panel-card"><h2>Estudios rechazados: {rechazados.length}</h2>
      <p>Para borrar individualmente cualquier estudio, incluso uno aprobado, utilizá la vista Estudios.</p>
      <button disabled={procesando || !rechazados.length} className="btn-danger" onClick={limpiar}>
        {procesando ? "Eliminando..." : "Limpiar estudios rechazados"}
      </button>
      {error && <p className="error-text">{error}</p>}{mensaje && <p className="success-text">{mensaje}</p>}
    </div>
  </section>;
}
export default EliminarEstudios;
