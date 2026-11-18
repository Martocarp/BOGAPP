import { useEffect, useState } from "react";
import CrearEstudio from "../Components/CrearEstudio";
import Salir from "../Components/Salir";
import useAuth from "../context/useAuth";
import { api } from "../api";

function Home_p() {
  const { usuario } = useAuth();
  const [estudios, setEstudios] = useState([]);
  const [error, setError] = useState("");
  function cargar() {
    api("/estudios").then(setEstudios).catch(err => setError(err.message));
  }
  useEffect(() => { cargar(); }, []);
  return (
    <div className="page-wrap">
      <header className="page-topbar"><span className="brand-small">BOGAPP <small>Portal profesional</small></span><Salir /></header>
      <div className="page-heading"><h1>Hola, {usuario.Nombre}</h1><p>Administrá tus estudios jurídicos y solicitudes.</p></div>
      <div className="stats-grid stats-grid-2">
        <div className="stat-card"><span>Estudios aprobados</span><strong>{estudios.filter(e => e.Estado === "APROBADO").length}</strong></div>
        <div className="stat-card"><span>Solicitudes pendientes</span><strong>{estudios.filter(e => e.Estado === "PENDIENTE").length}</strong></div>
      </div>
      <section className="panel-card"><h2>Mis estudios jurídicos</h2>
        {error && <p className="error-text">{error}</p>}
        {estudios.length === 0 && <p>Aún no tenés estudios o solicitudes.</p>}
        {estudios.map(e => <div className="list-row" key={e.Estudio_ID}>
          <div><strong>{e.Nombre}</strong><small>{e.Direccion || "Sin dirección"}</small></div>
          <span className={`estado estado--${e.Estado}`}>{e.Estado}</span>
        </div>)}
      </section>
      <CrearEstudio onCreado={cargar} />
    </div>
  );
}
export default Home_p;
