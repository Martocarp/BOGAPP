const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function api(ruta, opciones = {}) {
  const res = await fetch(`${API_URL}${ruta}`, {
    credentials: "include",
    ...opciones,
    headers: { ...(opciones.body && !(opciones.body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...opciones.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Error HTTP ${res.status}`);
  return data;
}

export function enviarJSON(method, ruta, datos) {
  return api(ruta, { method, body: JSON.stringify(datos) });
}

export async function descargarArchivo(ruta, nombre) {
  const res = await fetch(`${API_URL}${ruta}`, { credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudo descargar archivo');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download=nombre; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
}
