import { Navigate, useNavigate } from "react-router-dom";

function RutaPrivada({ children, rol }) {
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem("usuarioDemo") || "null");

  // Si no inició sesión
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Si no tiene el rol necesario
  if (usuario.Tipo_Cuenta !== rol) {
    return <Navigate to="/sin-permiso" replace />;
  }

  function cerrarSesion() {
    localStorage.removeItem("usuarioDemo");
    navigate("/login", { replace: true });
  }

  return (
    <div>
      <button onClick={cerrarSesion}>Cerrar sesión</button>

      {children}
    </div>
  );
}

export default RutaPrivada;
