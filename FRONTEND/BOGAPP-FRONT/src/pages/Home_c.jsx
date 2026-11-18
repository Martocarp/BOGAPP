import {useEffect,useState} from 'react';
import Salir from '../Components/Salir';
import useAuth from '../context/useAuth';
import {api,enviarJSON,descargarArchivo} from '../api';
import {mostrarAlerta} from '../utils/alertas';
function Home_c(){
  const {usuario}=useAuth();
  const [vinculos,setVinculos]=useState({estudios:[],profesionales:[]});
  const [estudios,setEstudios]=useState([]);const [casos,setCasos]=useState([]);
  const [estudioId,setEstudioId]=useState('');const [profId,setProfId]=useState('');
  const [actual,setActual]=useState(null);const [avances,setAvances]=useState([]);const [docs,setDocs]=useState([]);
  const [error,setError]=useState('');
  function cargar(){api('/vinculos/mis').then(setVinculos).catch(e=>setError(e.message));
    api('/estudios').then(setEstudios).catch(e=>setError(e.message));
    api('/casos').then(setCasos).catch(e=>setError(e.message));}
  useEffect(()=>{cargar();},[]);
  async function responder(tipo,id,Estado){try{
    const r=tipo==='estudio'?`/vinculos/cliente/estudios/${id}`:`/vinculos/cliente/profesionales/${id}`;
    await enviarJSON('PATCH',r,{Estado});cargar();
  }catch(e){setError(e.message);}}
  async function solicitar(e,tipo){e.preventDefault();try{
    const r=tipo==='estudio'?'/vinculos/solicitar-estudio':'/vinculos/solicitar-profesional';
    await enviarJSON('POST',r,tipo==='estudio'?{Estudio_ID:Number(estudioId)}:{Profesional_ID:Number(profId)});
    await mostrarAlerta('Solicitud enviada');setEstudioId('');setProfId('');cargar();
  }catch(e){setError(e.message);}}
  async function abrir(c){setError('');setActual(c);
    try{const [a,d]=await Promise.all([api(`/casos/${c.Caso_ID}/avances`),api(`/casos/${c.Caso_ID}/documentos`)]);setAvances(a);setDocs(d);}
    catch(e){setError(e.message);}}
  async function bajar(d){try{await descargarArchivo(`/casos/${actual.Caso_ID}/documentos/${d.Documento_ID}/descargar`,d.Nombre_Archivo);}catch(e){setError(e.message);}}
  return <div className="page-wrap cliente-page"><header className="page-topbar"><span className="brand-small">BOGAPP <small>Portal cliente</small></span><Salir/></header>
    <section className="page-heading"><h1>Hola, {usuario?.Nombre}</h1><p>Gestioná tus vinculaciones y seguí tus expedientes publicados.</p></section>
    {error&&<p className="error-text">{error}</p>}
    <section className="panel-card"><h2>Mis vinculaciones con estudios</h2>
      {!vinculos.estudios.length&&<p>No tenés estudios vinculados.</p>}
      {vinculos.estudios.map(v=><div className="list-row" key={v.Estudio_ID}><div><strong>{v.Nombre}</strong><small>{v.Estado} · {v.Origen}</small></div>
        {v.Estado==='PENDIENTE'&&v.Origen==='INVITACION'&&<div className="actions"><button onClick={()=>responder('estudio',v.Estudio_ID,'ACTIVO')}>Aceptar</button>
          <button className="btn-danger-outline" onClick={()=>responder('estudio',v.Estudio_ID,'RECHAZADO')}>Rechazar</button></div>}</div>)}
      <form className="pro-search-form" onSubmit={e=>solicitar(e,'estudio')}><label>Solicitar vinculación a un estudio aprobado
        <select value={estudioId} onChange={e=>setEstudioId(e.target.value)} required><option value="">Elegí un estudio</option>
          {estudios.map(e=><option key={e.Estudio_ID} value={e.Estudio_ID}>{e.Nombre}</option>)}</select></label><button>Solicitar</button></form>
    </section>
    <section className="panel-card"><h2>Abogados particulares</h2>
      {!vinculos.profesionales.length&&<p>No tenés abogados particulares vinculados.</p>}
      {vinculos.profesionales.map(v=><div className="list-row" key={v.Profesional_ID}><div><strong>{v.Nombre}</strong><small>{v.Estado} · {v.Origen}</small></div>
        {v.Estado==='PENDIENTE'&&v.Origen==='INVITACION'&&<div className="actions"><button onClick={()=>responder('profesional',v.Profesional_ID,'ACTIVO')}>Aceptar</button>
          <button className="btn-danger-outline" onClick={()=>responder('profesional',v.Profesional_ID,'RECHAZADO')}>Rechazar</button></div>}</div>)}
      <form className="pro-search-form" onSubmit={e=>solicitar(e,'profesional')}><label>Solicitar abogado particular (ID)
        <input type="number" min="1" value={profId} onChange={e=>setProfId(e.target.value)} required/></label><button>Solicitar</button></form>
    </section>
    <section className="panel-card"><h2>Mis casos jurídicos</h2>
      {!casos.length&&<p>Aún no hay expedientes asignados.</p>}
      {casos.map(c=><div className="list-row" key={c.Caso_ID}><div><strong>#{c.Caso_ID} · {c.Titulo}</strong><small>{c.Estado} · {c.Responsable_Nombre}</small></div>
        <button onClick={()=>abrir(c)}>Ver seguimiento</button></div>)}
      {actual&&<div className="details-panel"><h3>{actual.Titulo}</h3><p>{actual.Descripcion}</p><h3>Avances publicados</h3>
        {!avances.length&&<p>No hay avances publicados.</p>}
        {avances.map(a=><div className="list-row" key={a.Avance_ID}><div><strong>{a.Titulo}</strong><p>{a.Descripcion}</p></div></div>)}
        <h3>Documentos compartidos</h3>{!docs.length&&<p>No hay documentos públicos del caso.</p>}
        {docs.map(d=><div className="list-row" key={d.Documento_ID}><strong>{d.Nombre_Archivo}</strong><button onClick={()=>bajar(d)}>Descargar</button></div>)}
      </div>}
    </section>
  </div>;
}
export default Home_c;
