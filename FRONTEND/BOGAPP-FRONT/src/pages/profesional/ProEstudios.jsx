import { useEffect,useState } from 'react';
import { api, enviarJSON } from '../../api';
import CrearEstudio from '../../Components/CrearEstudio';
import usarEspacio from './usarEspacio';
function ProEstudios() {
  const {cargarEstudios}=usarEspacio();
  const [todos,setTodos]=useState([]); const [error,setError]=useState('');
  const [invitaciones,setInvitaciones]=useState([]);
  const [nuevoId,setNuevoId]=useState('');
  function cargarInvitaciones(){api('/profesional/invitaciones').then(setInvitaciones).catch(e=>setError(e.message));}
  async function responder(id,Estado){try{await enviarJSON('PATCH',`/profesional/invitaciones/${id}`,{Estado});cargarInvitaciones();cargar();}catch(e){setError(e.message);}}
  async function solicitar(e){e.preventDefault();try{await enviarJSON('POST',`/profesional/estudios/${nuevoId}/solicitar-ingreso`,{});setNuevoId('');cargarInvitaciones();}catch(e){setError(e.message);}}
  function cargar(){api('/estudios').then(setTodos).catch(e=>setError(e.message));cargarEstudios();cargarInvitaciones();}
  useEffect(()=>{cargar();},[]);
  return <section className="admin-section"><div className="section-head"><div><h1>Mis estudios</h1><p>Estudios vinculados y solicitudes de creación.</p></div></div>
    {error&&<p className="error-text">{error}</p>}
    <section className="panel-card"><h2>Estudios y solicitudes</h2>
      {!todos.length&&<p>Aún no tenés estudios asociados.</p>}
      {todos.map(e=><div className="list-row" key={e.Estudio_ID}><div><strong>{e.Nombre}</strong><small>#{e.Estudio_ID} · {e.Direccion||'Sin dirección'}</small></div>
        <span className={`estado estado--${e.Estado}`}>{e.Estado}</span></div>)}
    </section>
    <section className="panel-card"><h2>Invitaciones y solicitudes de incorporación</h2>
      {!invitaciones.length&&<p>No hay solicitudes ni invitaciones.</p>}
      {invitaciones.map(x=><div className="list-row" key={x.Estudio_ID}><div><strong>{x.Nombre}</strong><small>{x.Origen} · {x.Rol_Estudio} · {x.Estado}</small></div>
        {x.Estado==='PENDIENTE'&&x.Origen==='INVITACION'&&<div className="actions"><button className="btn-small" onClick={()=>responder(x.Estudio_ID,'ACTIVO')}>Aceptar</button>
          <button className="btn-small btn-danger-outline" onClick={()=>responder(x.Estudio_ID,'RECHAZADO')}>Rechazar</button></div>}</div>)}
      <form className="pro-search-form" onSubmit={solicitar}><label>Solicitar ingreso a otro estudio (ID)
        <input type="number" min="1" value={nuevoId} onChange={e=>setNuevoId(e.target.value)} placeholder="ID del estudio aprobado" required/></label><button>Solicitar ingreso</button></form>
    </section>
    <CrearEstudio onCreado={cargar}/>
  </section>;
}
export default ProEstudios;
