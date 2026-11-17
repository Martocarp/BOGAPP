import { useState, useEffect } from "react";

function EliminarEstudios() {
  const [estudios, setEstudios] = useState([]);
  const [procesando, setProcesando] = useState(false);

  // OBTENER ESTUDIOS
  useEffect(function () {
    fetch("http://localhost:8000/estudios")
      .then((res) => res.json())
      .then((data) => setEstudios(data))
      .catch((err) => console.log(err));
  }, []);

  // SOLO ESTUDIOS QUE PODEMOS ELIMINAR
  const eliminables = estudios.filter(
    (estudio) =>
      estudio.Estado === "PENDIENTE" || estudio.Estado === "RECHAZADO",
  );

  const rechazados = estudios.filter(
    (estudio) => estudio.Estado === "RECHAZADO",
  );

  // ELIMINAR UN ESTUDIO
  async function eliminarEstudio(id) {
    const confirmar = window.confirm(
      "¿Seguro que querés eliminar este estudio?",
    );

    if (!confirmar) return;

    setProcesando(true);

    try {
      const res = await fetch(`http://localhost:8000/estudios/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      window.location.reload();
    } catch (err) {
      alert(err.message);
      setProcesando(false);
    }
  }

  // ELIMINAR TODOS LOS RECHAZADOS
  async function limpiarRechazados() {
    if (rechazados.length === 0) return;

    const confirmar = window.confirm(
      `¿Eliminar los ${rechazados.length} estudios rechazados?`,
    );

    if (!confirmar) return;

    setProcesando(true);

    let eliminados = 0;
    let errores = 0;

    for (const estudio of rechazados) {
      try {
        const res = await fetch(
          `http://localhost:8000/estudios/${estudio.Estudio_ID}`,
          {
            method: "DELETE",
          },
        );

        if (res.ok) {
          eliminados++;
        } else {
          errores++;
        }
      } catch (err) {
        errores++;
      }
    }

    alert(`Estudios eliminados: ${eliminados}\nErrores: ${errores}`);

    window.location.reload();
  }

  return (
    <div>
      <h2>Administrar estudios</h2>

      <button
        onClick={limpiarRechazados}
        disabled={procesando || rechazados.length === 0}
      >
        Limpiar rechazados ({rechazados.length})
      </button>

      <h3>Estudios disponibles para eliminar</h3>

      {eliminables.length === 0 && (
        <p>No hay estudios pendientes o rechazados.</p>
      )}

      {eliminables.map((estudio) => (
        <div key={estudio.Estudio_ID}>
          <h3>{estudio.Nombre}</h3>

          <p>ID: {estudio.Estudio_ID}</p>
          <p>Estado: {estudio.Estado}</p>

          <button
            disabled={procesando}
            onClick={() => eliminarEstudio(estudio.Estudio_ID)}
          >
            Eliminar estudio
          </button>
        </div>
      ))}
    </div>
  );
}

export default EliminarEstudios;
