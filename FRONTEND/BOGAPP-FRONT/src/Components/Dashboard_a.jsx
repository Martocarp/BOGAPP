import { useEffect, useState } from "react";

function Dashboard_a() {
  const [estudios, setEstudios] = useState([]);
  const [error, setError] = useState("");

  useEffect(function () {
    fetch("http://localhost:8000/estudios")
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se pudieron obtener los estudios");
        }

        return res.json();
      })
      .then((data) => setEstudios(data))
      .catch((err) => setError(err.message));
  }, []);

  const total = estudios.length;

  const aprobados = estudios.filter((e) => e.Estado === "APROBADO").length;

  const pendientes = estudios.filter((e) => e.Estado === "PENDIENTE").length;

  const rechazados = estudios.filter((e) => e.Estado === "RECHAZADO").length;

  const recientes = [...estudios]
    .sort((a, b) => b.Estudio_ID - a.Estudio_ID)
    .slice(0, 5);

  return (
    <div className="admin-dashboard">
      <h1>Dashboard</h1>
      <p>Resumen general de BOGAPP</p>

      {error && <p>{error}</p>}

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <p>Estudios registrados</p>
          <h2>{total}</h2>
        </div>

        <div className="dashboard-card">
          <p>Estudios aprobados</p>
          <h2>{aprobados}</h2>
        </div>

        <div className="dashboard-card">
          <p>Solicitudes pendientes</p>
          <h2>{pendientes}</h2>
        </div>

        <div className="dashboard-card">
          <p>Estudios rechazados</p>
          <h2>{rechazados}</h2>
        </div>
      </div>

      <section className="dashboard-recientes">
        <h2>Últimos estudios registrados</h2>

        {recientes.length === 0 && <p>No hay estudios registrados.</p>}

        {recientes.map((estudio) => (
          <div className="dashboard-estudio" key={estudio.Estudio_ID}>
            <strong>{estudio.Nombre}</strong>

            <span className={`estado estado--${estudio.Estado}`}>
              {estudio.Estado}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}

export default Dashboard_a;
