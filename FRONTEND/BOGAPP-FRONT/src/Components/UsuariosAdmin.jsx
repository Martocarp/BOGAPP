import { useEffect, useMemo, useState } from "react";
import { api, enviarJSON } from "../api";
import useAuth from "../context/useAuth";
import { mostrarAlerta, confirmarAccion } from "../utils/alertas";

function UsuariosAdmin() {
  const { usuario } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);
  function cargar() { return api("/users").then(data => setUsuarios(data.usuarios)).catch(err => setError(err.message)); }
  useEffect(() => { cargar(); }, []);
  const filtrados = useMemo(() => usuarios.filter(u =>
    `${u.Nombre} ${u.Apellido} ${u.Email} ${u.Tipo_Cuenta} ${u.Usuario_ID}`.toLowerCase().includes(busqueda.toLowerCase())
  ), [usuarios, busqueda]);
  function seleccionar(u) {
    setSeleccionado(u); setForm({ Nombre: u.Nombre, Apellido: u.Apellido, Email: u.Email,
      Tipo_Cuenta: u.Tipo_Cuenta, Matricula: u.Matricula || "" }); setError(""); setMensaje("");
  }
  async function guardar(e) {
    e.preventDefault(); setGuardando(true); setError("");
    try { await enviarJSON("PUT", `/users/${seleccionado.Usuario_ID}`, form);
      setMensaje("Usuario actualizado"); mostrarAlerta("Usuario actualizado correctamente"); setSeleccionado(null); await cargar(); }
    catch (err) { setError(err.message); }
    finally { setGuardando(false); }
  }
  async function borrar(u) {
    if (u.Usuario_ID === usuario.Usuario_ID) {
      await mostrarAlerta("No podés eliminar tu propia cuenta", "warning");
      return;
    }
    const primera = await confirmarAccion(
      `¿Eliminar a ${u.Nombre} ${u.Apellido}? También se borrarán sus casos, datos relacionados y estudios que haya creado.`,
      { titulo: "Eliminar usuario", confirmar: "Continuar", peligro: true }
    );
    if (!primera.isConfirmed) return;
    const segunda = await confirmarAccion("Confirmación final: ¿eliminar usuario y sus dependencias?", {
      titulo: "Última confirmación", confirmar: "Eliminar definitivamente", peligro: true,
    });
    if (!segunda.isConfirmed) return;
    setGuardando(true); setError("");
    try { await api(`/users/${u.Usuario_ID}`, { method: "DELETE" });
      setSeleccionado(null); setMensaje("Usuario eliminado"); mostrarAlerta("Usuario eliminado correctamente"); await cargar(); }
    catch (err) { setError(err.message); }
    finally { setGuardando(false); }
  }
  return (
    <section className="admin-section">
      <div className="section-head"><div><h1>Usuarios</h1><p>Administración de clientes y profesionales registrados.</p></div><span className="count-pill">{usuarios.length} usuarios</span></div>
      <input className="search-input" type="search" placeholder="Buscar por nombre, correo, rol o ID..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      {error && <p className="error-text">{error}</p>}{mensaje && <p className="success-text">{mensaje}</p>}
      <div className="table-wrap"><table className="data-table">
        <thead><tr><th>ID</th><th>Usuario</th><th>Tipo de cuenta</th><th>Registro</th><th>Acciones</th></tr></thead>
        <tbody>{filtrados.map(u => <tr key={u.Usuario_ID}>
          <td>#{u.Usuario_ID}</td><td><strong>{u.Nombre} {u.Apellido}</strong><small>{u.Email}</small></td>
          <td><span className="role-label">{u.Tipo_Cuenta}</span></td>
          <td>{new Date(u.Fecha_Registro).toLocaleDateString("es-AR")}</td>
          <td><div className="actions">
            <button className="btn-small" disabled={u.Tipo_Cuenta === "ADMIN_BOGAPP"} onClick={() => seleccionar(u)}>Editar</button>
            <button className="btn-small btn-danger-outline" disabled={guardando || u.Tipo_Cuenta === "ADMIN_BOGAPP"} onClick={() => borrar(u)}>Borrar</button>
          </div></td>
        </tr>)}</tbody>
      </table>{!filtrados.length && <div className="empty-state">No hay coincidencias.</div>}</div>
      {seleccionado && form && <form className="details-panel form-grid" onSubmit={guardar}>
        <div className="section-head"><h2>Editar usuario #{seleccionado.Usuario_ID}</h2><button type="button" className="btn-quiet" onClick={() => setSeleccionado(null)}>Cerrar ×</button></div>
        <label>Nombre<input required value={form.Nombre} onChange={e => setForm(v => ({...v, Nombre: e.target.value}))} /></label>
        <label>Apellido<input required value={form.Apellido} onChange={e => setForm(v => ({...v, Apellido: e.target.value}))} /></label>
        <label>Email<input type="email" required value={form.Email} onChange={e => setForm(v => ({...v, Email: e.target.value}))} /></label>
        {form.Tipo_Cuenta === "PROFESIONAL" && <label>Matrícula<input value={form.Matricula} onChange={e => setForm(v => ({...v, Matricula: e.target.value}))} /></label>}
        <p>Tipo de cuenta: <b>{form.Tipo_Cuenta}</b> (fijo)</p>
        <button disabled={guardando}>Guardar</button>
      </form>}
      <p className="helper-text">Los Super Admin se administran mediante el script local, no desde registros públicos. La eliminación borra las relaciones y casos asociados.</p>
    </section>
  );
}
export default UsuariosAdmin;
