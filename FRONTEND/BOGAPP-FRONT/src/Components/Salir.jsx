import { useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import { mostrarAlerta } from "../utils/alertas";

function Salir() {
  const { salir } = useAuth();
  const navigate = useNavigate();
  async function cerrar() {
    try { await salir(); navigate("/login", { replace: true }); }
    catch (err) { await mostrarAlerta(err.message, "error"); navigate("/login", { replace: true }); }
  }
  return <button className="btn-salir" onClick={cerrar} type="button">Cerrar sesión</button>;
}
export default Salir;
