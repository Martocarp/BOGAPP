import { useEffect, useState } from 'react';
import usarEspacio from './usarEspacio';
import { api, enviarJSON } from '../../api';
import { mostrarAlerta } from '../../utils/alertas';

function ProClientes() {
  const { espacio, estudioId, rol } = usarEspacio();
  const [clientes, setClientes] = useState([]); const [email, setEmail] = useState('');
  const [encontrado, setEncontrado] = useState(null);
  const [error, setError] = useState(''); const [ocupado, setOcupado] = useState(false);
  const admin = espacio === 'particular' || rol === 'ADMIN_ESTUDIO';
  function cargar() {    
const p = new URLSearchParams({ espacio }); if (estudioId) p.set('estudioId', estudioId);
    api('/profesional/clientes?' + p).then(setClientes).catch(e => setError(e.message));  
}
  useEffect(() => { setError(''); setEncontrado(null); cargar(); }, [espacio, estudioId]);
  async function buscar(e) {    
e.preventDefault(); setError(''); setEncontrado(null);
    try {      
const usuario = await api('/profesional/buscar-cliente?email=' + encodeURIComponent(email));
      if (!usuario) throw new Error('No hay cliente registrado con ese correo'); setEncontrado(usuario);
    } catch (e) { setError(e.message); }  
}
  async function invitar() {    
setOcupado(true); setError(''); try {
      const url = espacio === 'estudio' ? `/profesional/estudios/${estudioId}/clientes/invitar` : '/profesional/clientes/invitar';
      const r = await enviarJSON('POST', url, { Cliente_ID: encontrado.Usuario_ID });
      await mostrarAlerta(r.message); setEncontrado(null); setEmail(''); cargar();
    } catch (e) { setError(e.message); } finally { setOcupado(false); }  
}
  async function responder(c, estado) {    
setOcupado(true); setError(''); try {
      const url = espacio === 'estudio' ? `/vinculos/profesional/estudios/${estudioId}/clientes/${c.Usuario_ID}` : `/vinculos/profesional/particulares/${c.Usuario_ID}`;
      await enviarJSON('PATCH', url, { Estado: estado }); cargar();
    } catch (e) { setError(e.message); } finally { setOcupado(false); }  
}
  return <section className="admin-section">
    <div className="section-head"><div><h1>Clientes</h1><p>{espacio === 'estudio' ? 'Clientes vinculados al estudio seleccionado' : 'Tus clientes particulares y solicitudes'}</p></div><span className="count-pill">{clientes.length} registrados</span></div>
    {error && <p className="error-text">{error}</p>}
    {admin && <section className="panel-card"><h2>Invitar cliente</h2><p>El cliente necesita una cuenta BOGAPP y deberá aceptar tu invitación.</p>
      <form className="pro-search-form" onSubmit={buscar}><label>Correo del cliente<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@ejemplo.test" required /></label><button>Buscar</button></form>
      {encontrado && <div className="list-row"><div><strong>{encontrado.Nombre} {encontrado.Apellido}</strong><small>{encontrado.Email}</small></div>
        <button onClick={invitar} disabled={ocupado}>Enviar invitación</button></div>}
    </section>}
    <section className="panel-card"><h2>Listado de clientes</h2>
      {!clientes.length && <p>Aún no hay clientes vinculados.</p>}
      {clientes.map(c => <div className="list-row" key={c.Usuario_ID}><div><strong>{c.Nombre} {c.Apellido}</strong><small>{c.Email} · #{c.Usuario_ID}</small></div>
        <div className="actions"><span className={`estado estado--${c.Estado}`}>{c.Estado}</span>
          {admin && espacio === 'particular' && c.Estado === 'PENDIENTE' && c.Origen === 'SOLICITUD' && <><button disabled={ocupado} className="btn-small" onClick={() => responder(c, 'ACTIVO')}>Aceptar</button>
            <button disabled={ocupado} className="btn-small btn-danger-outline" onClick={() => responder(c, 'RECHAZADO')}>Rechazar</button></>}</div></div>)}
    </section>
  </section>;
}
export default ProClientes;
