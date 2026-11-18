import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { api, enviarJSON } from "../api";

function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    api("/auth/me")
      .then((data) => { if (activo) setUsuario(data.usuario); })
      .catch(() => { if (activo) setUsuario(null); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);

  async function ingresar(Email, Password) {
    const data = await enviarJSON("POST", "/auth/login", { Email, Password });
    setUsuario(data.usuario);
    return data.usuario;
  }
  async function salir() {
    try { await api("/auth/logout", { method: "POST" }); }
    finally { setUsuario(null); }
  }
  return (
    <AuthContext.Provider value={{ usuario, cargando, ingresar, salir }}>
      {children}
    </AuthContext.Provider>
  );
}
export default AuthProvider;
