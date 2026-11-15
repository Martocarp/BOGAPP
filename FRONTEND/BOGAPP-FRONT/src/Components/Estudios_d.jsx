import { useState, useEffect } from "react";

function Estudios_d() {
  const [estudios, setEstudios] = useState([]);

  useEffect(function () {
    fetch("http://localhost:8000/estudios")
      .then((res) => res.json())
      .then((data) => setEstudios(data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div>
      <h2>Estudios jurídicos</h2>

      {estudios.map((estudio) => (
        <div key={estudio.Estudio_ID}>
          <h3>{estudio.Nombre}</h3>
          <p>Estado: {estudio.Estado}</p>
          <br />
        </div>
      ))}
    </div>
  );
}

export default Estudios_d;
