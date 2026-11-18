const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function api(ruta, opciones = {}) {
  const res = await fetch(`${API_URL}${ruta}`, {
    credentials: "include",
    ...opciones,
    headers: { ...(opciones.body ? { "Content-Type": "application/json" } : {}), ...opciones.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Error HTTP ${res.status}`);
  return data;
}

export function enviarJSON(method, ruta, datos) {
  return api(ruta, { method, body: JSON.stringify(datos) });
}
