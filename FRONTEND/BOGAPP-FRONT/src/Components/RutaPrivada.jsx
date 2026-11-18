import { Navigate } from "react-router-dom";
import useAuth from "../context/useAuth";

function RutaPrivada({ children, rol }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="pantalla-carga">Comprobando sesión...</div>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.Tipo_Cuenta !== rol) return <Navigate to="/sin-permiso" replace />;
  return children;
}
export default RutaPrivada;
