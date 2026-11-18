import { useEffect, useMemo, useState } from "react";
import { api, enviarJSON } from "../api";
import { mostrarAlerta, confirmarAccion } from "../utils/alertas";

function Estudios_d() {
  const [estudios, setEstudios] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [editar, setEditar] = useState(false);
  const [form, setForm] = useState({ Nombre: "", Direccion: "", Telefono: "" });
  const [nuevo, setNuevo] = useState({ Usuario_ID: "", Rol_Estudio: "ABOGADO" });
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    return api("/estudios").then(setEstudios).catch(err => setError(err.message));
  }
  useEffect(() => {
    cargar();
    api("/profesionales").then(setCatalogo).catch(() => {});
  }, []);

  const filtrados = useMemo(() => estudios.filter(e =>
    `${e.Nombre} ${e.Direccion || ""} ${e.Solicitante || ""} ${e.Estado} ${e.Estudio_ID}`
      .toLowerCase().includes(busqueda.toLowerCase())
  ), [estudios, busqueda]);

  async function seleccionar(estudio) {
    setSeleccionado(estudio); setEditar(false); setError(""); setMensaje("");
    setForm({ Nombre: estudio.Nombre, Direccion: estudio.Direccion || "", Telefono: estudio.Telefono || "" });
    try { setProfesionales(await api(`/estudios/${estudio.Estudio_ID}/profesionales`)); }
    catch (err) { setError(err.message); }
  }
  async function guardar(e) {
    e.preventDefault(); setGuardando(true); setError("");
    try {
      await enviarJSON("PUT", `/estudios/${seleccionado.Estudio_ID}`, form);
      setMensaje("Datos actualizados"); mostrarAlerta("Datos del estudio actualizados correctamente"); setEditar(false);
      setSeleccionado({ ...seleccionado, ...form }); await cargar();
    } catch (err) { setError(err.message); }
    finally { setGuardando(false); }
  }
  async function borrar(estudio) {
    const aviso = `Vas a borrar DEFINITIVAMENTE «${estudio.Nombre}» y sus relaciones, casos y avances. Esta acción no se puede deshacer. ¿Continuar?`;
    const primera = await confirmarAccion(aviso, { titulo: "Eliminar estudio", confirmar: "Continuar", peligro: true });
    if (!primera.isConfirmed) return;
    const segunda = await confirmarAccion("Confirmación final: ¿eliminar estudio definitivamente?", {
      titulo: "Última confirmación", confirmar: "Eliminar definitivamente", peligro: true,
    });
    if (!segunda.isConfirmed) return;
    setGuardando(true); setError("");
    try {
      await api(`/estudios/${estudio.Estudio_ID}`, { method: "DELETE" });
      setSeleccionado(null); setProfesionales([]); setMensaje("Estudio eliminado"); mostrarAlerta("Estudio eliminado correctamente");
      await cargar();
    } catch (err) { setError(err.message); }
    finally { setGuardando(false); }
  }
  async function vincular(e) {
    e.preventDefault(); setGuardando(true); setError("");
    try {
      await enviarJSON("POST", `/estudios/${seleccionado.Estudio_ID}/profesionales`, {
        Usuario_ID: Number(nuevo.Usuario_ID), Rol_Estudio: nuevo.Rol_Estudio,
      });
      setProfesionales(await api(`/estudios/${seleccionado.Estudio_ID}/profesionales`));
      setNuevo({ Usuario_ID: "", Rol_Estudio: "ABOGADO" }); setMensaje("Profesional vinculado correctamente"); mostrarAlerta("Profesional vinculado correctamente");
    } catch (err) { setError(err.message); }
    finally { setGuardando(false); }
  }
  async function quitar(id) {
    const resultado = await confirmarAccion("¿Desvincular este profesional del estudio?", {
      titulo: "Desvincular profesional", confirmar: "Desvincular", peligro: true,
    });
    if (!resultado.isConfirmed) return;
    setGuardando(true); setError("");
    try {
      await api(`/estudios/${seleccionado.Estudio_ID}/profesionales/${id}`, { method: "DELETE" });
      setProfesionales(await api(`/estudios/${seleccionado.Estudio_ID}/profesionales`));
      setMensaje("Profesional desvinculado"); mostrarAlerta("Profesional desvinculado correctamente");
    } catch (err) { setError(err.message); }
    finally { setGuardando(false); }
  }

  const libres = catalogo.filter(p => !profesionales.some(v => v.Usuario_ID === p.Usuario_ID) && p.Estado);
  return (
    <section className="admin-section">
      <div className="section-head"><div><h1>Estudios jurídicos</h1><p>Todos los estudios, ordenados del más reciente al más antiguo.</p></div><span className="count-pill">{estudios.length} registrados</span></div>
      <input className="search-input" type="search" placeholder="Buscar por nombre, dirección, solicitante, estado o ID..."
        value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      {error && <p className="error-text" role="alert">{error}</p>}
      {mensaje && <p className="success-text">{mensaje}</p>}
      <div className="table-wrap">
        <table className="data-table"><thead><tr><th>ID</th><th>Estudio</th><th>Creado</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>{filtrados.map(e => <tr key={e.Estudio_ID}>
            <td>#{e.Estudio_ID}</td>
            <td><strong>{e.Nombre}</strong><small>{e.Direccion || "Sin dirección"}</small></td>
            <td>{new Date(e.Fecha_Creacion).toLocaleDateString("es-AR")}</td>
            <td><span className={`estado estado--${e.Estado}`}>{e.Estado}</span></td>
            <td><div className="actions">
              <button className="btn-small" onClick={() => seleccionar(e)}>Ver / Editar</button>
              <button className="btn-small btn-danger-outline" disabled={guardando} onClick={() => borrar(e)}>Borrar</button>
            </div></td>
          </tr>)}</tbody>
        </table>
        {!filtrados.length && <div className="empty-state">No encontramos estudios con ese filtro.</div>}
      </div>

      {seleccionado && <div className="details-panel">
        <div className="section-head"><div><h2>{seleccionado.Nombre}</h2><p>Estudio #{seleccionado.Estudio_ID} · {seleccionado.Estado}</p></div>
          <button className="btn-quiet" onClick={() => setSeleccionado(null)}>Cerrar detalle ×</button></div>
        <div className="details-meta"><span><b>Creado por:</b> {seleccionado.Solicitante}</span>
          <span><b>Dirección:</b> {seleccionado.Direccion || "—"}</span>
          <span><b>Teléfono:</b> {seleccionado.Telefono || "—"}</span></div>
        <div className="actions"><button onClick={() => setEditar(v => !v)}>{editar ? "Cancelar edición" : "Editar estudio"}</button></div>
        {editar && <form className="form-grid" onSubmit={guardar}>
          <label>Nombre<input value={form.Nombre} onChange={e => setForm(v => ({...v, Nombre: e.target.value}))} required /></label>
          <label>Dirección<input value={form.Direccion} onChange={e => setForm(v => ({...v, Direccion: e.target.value}))} /></label>
          <label>Teléfono<input value={form.Telefono} onChange={e => setForm(v => ({...v, Telefono: e.target.value}))} /></label>
          <button disabled={guardando}>Guardar cambios</button>
        </form>}
        <h3>Profesionales del estudio ({profesionales.length})</h3>
        {!profesionales.length && <p>No hay profesionales vinculados todavía.</p>}
        {profesionales.map(p => <div className="list-row" key={p.Usuario_ID}>
          <div><strong>{p.Nombre} {p.Apellido}</strong><small>{p.Email} · {p.Rol_Estudio} · {p.Estado}</small></div>
          <button className="btn-small btn-danger-outline" disabled={guardando} onClick={() => quitar(p.Usuario_ID)}>Desvincular</button>
        </div>)}
        {seleccionado.Estado === "APROBADO" && <form className="inline-form" onSubmit={vincular}>
          <label>Agregar profesional<select value={nuevo.Usuario_ID} onChange={e => setNuevo(v => ({...v, Usuario_ID: e.target.value}))} required>
            <option value="">Seleccionar profesional</option>
            {libres.map(p => <option key={p.Usuario_ID} value={p.Usuario_ID}>{p.Nombre} {p.Apellido} (#{p.Usuario_ID})</option>)}
          </select></label>
          <label>Rol<select value={nuevo.Rol_Estudio} onChange={e => setNuevo(v => ({...v, Rol_Estudio: e.target.value}))}>
            <option value="ABOGADO">ABOGADO</option><option value="ADMIN_ESTUDIO">ADMIN_ESTUDIO</option>
          </select></label>
          <button type="submit" disabled={guardando || !nuevo.Usuario_ID}>Vincular</button>
        </form>}
      </div>}
    </section>
  );
}
export default Estudios_d;
