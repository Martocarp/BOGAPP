import { Navigate } from "react-router-dom";

function RutaPrivada({ children }) {
  // Usuario simulado hasta implementar el login
  const usuario = {
    Tipo_Cuenta: "ADMIN_BOGAPP",
  };

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.Tipo_Cuenta !== "ADMIN_BOGAPP") {
    return <Navigate to="/sin-permiso" replace />;
  }

  return children;
}

export default RutaPrivada;
