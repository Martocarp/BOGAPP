import { useContext } from "react";
import { AuthContext } from "./AuthContext";
export default function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("Falta AuthProvider");
  return contexto;
}
