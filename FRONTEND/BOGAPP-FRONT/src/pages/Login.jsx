import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // CUENTAS DE PRUEBA
  const usuarios = [
    {
      email: "admin@bogapp",
      password: "1234",
      Tipo_Cuenta: "ADMIN_BOGAPP",
    },
    {
      email: "abogado@bogapp",
      password: "1234",
      Tipo_Cuenta: "PROFESIONAL",
    },
    {
      email: "cliente@bogapp",
      password: "1234",
      Tipo_Cuenta: "CLIENTE",
    },
  ];

  function iniciarSesion(e) {
    e.preventDefault();

    const usuario = usuarios.find(
      (u) => u.email === email.trim().toLowerCase() && u.password === password,
    );

    if (!usuario) {
      setError("Email o contraseña incorrectos");
      return;
    }

    // Guardamos el usuario simulado, sin la contraseña
    localStorage.setItem(
      "usuarioDemo",
      JSON.stringify({
        email: usuario.email,
        Tipo_Cuenta: usuario.Tipo_Cuenta,
      }),
    );

    if (usuario.Tipo_Cuenta === "ADMIN_BOGAPP") {
      navigate("/");
    } else if (usuario.Tipo_Cuenta === "PROFESIONAL") {
      navigate("/profesional");
    } else if (usuario.Tipo_Cuenta === "CLIENTE") {
      navigate("/cliente");
    }
  }

  return (
    <div>
      <h1>BOGAPP</h1>
      <h2>Iniciar sesión</h2>

      <form onSubmit={iniciarSesion}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Ingresar</button>
      </form>

      {error && <p>{error}</p>}
    </div>
  );
}

export default Login;
