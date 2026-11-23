import { useEffect, useState } from 'react';
import usarEspacio from './usarEspacio';
import { api, enviarJSON } from '../../api';
import { mostrarAlerta, confirmarAccion } from '../../utils/alertas';

function ProIntegrantes() {
  const { espacio, estudioId, rol, estudio } = usarEspacio();
  const [miembros, setMiembros] = useState([]); const [pendientes, setPendientes] = useState([]);
  const [email, setEmail] = useState(''); const [resultado, setResultado] = useState(null); const [nuevoRol, setNuevoRol] = useState('ABOGADO');
  const [error, setError] = useState(''); const [ocupado, setOcupado] = useState(false);
  const admin = rol === 'ADMIN_ESTUDIO';
  function cargar() {    
if (!estudioId) return;
    api(`/profesional/estudios/${estudioId}/profesionales`).then(setMiembros).catch(e => setError(e.message));
    if (admin) api(`/profesional/estudios/${estudioId}/solicitudes`).then(setPendientes).catch(e => setError(e.message));
    else setPendientes([]);
  }
  useEffect(() => { setError(''); setResultado(null); cargar(); }, [estudioId, rol]);
  async function buscar(e) {    
e.preventDefault(); setResultado(null); setError(''); try {      
const d = await api('/profesional/buscar-profesional?email=' + encodeURIComponent(email));
      if (!d) throw new Error('Profesional no encontrado'); setResultado(d);    
} catch (e) { setError(e.message); }  
}
  async function invitar() {    
setOcupado(true); try {      
await enviarJSON('POST', `/profesional/estudios/${estudioId}/invitar`, { Usuario_ID: resultado.Usuario_ID, Rol_Estudio: nuevoRol });
      await mostrarAlerta('Invitación enviada'); setResultado(null); setEmail(''); cargar();    
} catch (e) { setError(e.message); } finally { setOcupado(false); }  
}
  async function responder(p, Estado) { setOcupado(true); try { await enviarJSON('PATCH', `/profesional/estudios/${estudioId}/solicitudes/${p.Usuario_ID}`, { Estado }); cargar(); } catch (e) { setError(e.message); } finally { setOcupado(false); } }
  async function desvincular(p) {    
const r = await confirmarAccion(`¿Desvincular a ${p.Nombre} ${p.Apellido}?`, { peligro: true }); if (!r.isConfirmed) return;
    setOcupado(true); try { await api(`/estudios/${estudioId}/profesionales/${p.Usuario_ID}`, { method: 'DELETE' }); cargar(); } catch (e) { setError(e.message); } finally { setOcupado(false); }  
}
  if (espacio !== 'estudio') return <p>Seleccioná un estudio en el menú lateral.</p>;
  return <section className="admin-section"><div className="section-head"><div><h1>Profesionales</h1><p>Integrantes de {estudio?.Nombre}</p></div></div>
    {error && <p className="error-text">{error}</p>}
    {admin && <section className="panel-card"><h2>Invitar profesional</h2><p>Se incorporará únicamente cuando acepte la invitación desde su cuenta.</p>
      <form className="pro-search-form" onSubmit={buscar}><label>Email del profesional<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><button>Buscar</button></form>
      {resultado && <div className="pro-invite"><strong>{resultado.Nombre} {resultado.Apellido}</strong>
        <select value={nuevoRol} onChange={e => setNuevoRol(e.target.value)}><option value="ABOGADO">ABOGADO</option><option value="ADMIN_ESTUDIO">ADMIN_ESTUDIO</option></select>
        <button onClick={invitar} disabled={ocupado}>Enviar invitación</button></div>}
    </section>}
    <section className="panel-card"><h2>Integrantes activos ({miembros.length})</h2>
      {miembros.map(p => <div className="list-row" key={p.Usuario_ID}><div><strong>{p.Nombre} {p.Apellido}</strong><small>{p.Email} · {p.Rol_Estudio}</small></div>
        {admin && p.Usuario_ID !== estudio?.Creado_Por_ID && <button className="btn-small btn-danger-outline" disabled={ocupado} onClick={() => desvincular(p)}>Desvincular</button>}</div>)}
    </section>
    {admin && <section className="panel-card"><h2>Solicitudes e invitaciones pendientes</h2>
      {!pendientes.length && <p>No hay solicitudes pendientes.</p>}
      {pendientes.map(p => <div className="list-row" key={p.Usuario_ID}><div><strong>{p.Nombre} {p.Apellido}</strong><small>{p.Origen} · {p.Rol_Estudio}</small></div>
        {p.Origen === 'SOLICITUD' && <div className="actions"><button className="btn-small" disabled={ocupado} onClick={() => responder(p, 'ACTIVO')}>Aceptar</button>
          <button className="btn-small btn-danger-outline" disabled={ocupado} onClick={() => responder(p, 'RECHAZADO')}>Rechazar</button></div>}</div>)}
    </section>}
  </section>;
}
export default ProIntegrantes;
