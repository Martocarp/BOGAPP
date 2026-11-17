import { useState } from "react";
import { Link } from "react-router-dom";

function Create_c() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  function registrar(e) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (password !== confirmarPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setEnviando(true);

    fetch("http://localhost:8000/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Nombre: nombre,
        Apellido: apellido,
        Email: email,
        Password: password,
        Tipo_Cuenta: "CLIENTE",
      }),
    })
      .then((res) =>
        res.json().then((data) => {
          if (!res.ok) {
            throw new Error(data.message || "Error al registrar usuario");
          }

          return data;
        }),
      )
      .then((data) => {
        setMensaje(data.message);

        setNombre("");
        setApellido("");
        setEmail("");
        setPassword("");
        setConfirmarPassword("");
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setEnviando(false);
      });
  }

  return (
    <div className="registro">
      <h1>BOGAPP</h1>
      <h2>CREATE ACCOUNT</h2>
      <p>Registrate para comenzar a utilizar BOGAPP.</p>

      <form onSubmit={registrar}>
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Apellido"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Contraseña (mínimo 8 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />

        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmarPassword}
          onChange={(e) => setConfirmarPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={enviando}>
          {enviando ? "Registrando..." : "CREATE ACCOUNT"}
        </button>
      </form>

      {mensaje && <p className="mensaje-ok">{mensaje}</p>}
      {error && <p className="mensaje-error">{error}</p>}

      <p className="registro-link">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}

export default Create_c;
