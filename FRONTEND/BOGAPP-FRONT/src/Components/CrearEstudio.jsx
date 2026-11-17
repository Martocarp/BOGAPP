import { useState } from "react";

function CrearEstudio() {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  // ID de un profesional de prueba registrado en MySQL
  const profesionalId = 2;

  function solicitarEstudio(e) {
    e.preventDefault();
    setMensaje("");
    setEnviando(true);

    fetch("http://localhost:8000/estudios", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Nombre: nombre,
        Direccion: direccion,
        Telefono: telefono,
        Creado_Por_ID: profesionalId,
      }),
    })
      .then((res) => {
        return res.json().then((data) => {
          if (!res.ok) {
            throw new Error(data.message || "Error al crear estudio");
          }
          return data;
        });
      })
      .then((data) => {
        setMensaje(data.message);
        setNombre("");
        setDireccion("");
        setTelefono("");
      })
      .catch((err) => {
        setMensaje(err.message);
      })
      .finally(() => {
        setEnviando(false);
      });
  }

  return (
    <div>
      <h2>Solicitar nuevo estudio jurídico</h2>

      <form onSubmit={solicitarEstudio}>
        <input
          type="text"
          placeholder="Nombre del estudio"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Dirección"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
        />

        <input
          type="tel"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />

        <button type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Solicitar estudio"}
        </button>
      </form>

      {mensaje && <p>{mensaje}</p>}
    </div>
  );
}

export default CrearEstudio;
