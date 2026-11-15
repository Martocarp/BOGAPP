import { useEffect, useState } from "react";

function Check() {
  const [estudios, setEstudios] = useState([]);

  // ID del Super Admin de prueba
  const adminId = 3;

  // OBTENER ESTUDIOS
  useEffect(function () {
    fetch("http://localhost:8000/estudios")
      .then((res) => res.json())
      .then((data) => setEstudios(data))
      .catch((err) => console.log(err));
  }, []);

  // APROBAR O RECHAZAR ESTUDIO
  function cambiarEstado(id, estado) {
    fetch(`http://localhost:8000/estudios/${id}/estado`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Estado: estado,
        Revisado_Por_ID: adminId,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("No se pudo actualizar el estudio");
        }
        return res.json();
      })
      .then((data) => {
        alert(data.message);

        setEstudios((prev) =>
          prev.filter((estudio) => estudio.Estudio_ID !== id),
        );
      })
      .catch((err) => console.log(err));
  }

  const pendientes = estudios.filter(
    (estudio) => estudio.Estado === "PENDIENTE",
  );

  return (
    <div>
      <h2>Solicitudes pendientes</h2>

      {pendientes.length === 0 && <p>No hay solicitudes pendientes</p>}

      {pendientes.map((estudio) => (
        <div key={estudio.Estudio_ID}>
          <h3>{estudio.Nombre}</h3>
          <p>Dirección: {estudio.Direccion}</p>
          <p>Estado: {estudio.Estado}</p>

          <button onClick={() => cambiarEstado(estudio.Estudio_ID, "APROBADO")}>
            Aprobar
          </button>

          <button
            onClick={() => cambiarEstado(estudio.Estudio_ID, "RECHAZADO")}
          >
            Rechazar
          </button>
        </div>
      ))}
    </div>
  );
}

export default Check;
