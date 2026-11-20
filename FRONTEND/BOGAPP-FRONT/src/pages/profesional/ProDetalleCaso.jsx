import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import usarEspacio from './usarEspacio';
import {api,enviarJSON,descargarArchivo} from '../../api';
import {mostrarAlerta,confirmarAccion} from '../../utils/alertas';
function ProDetalleCaso(){
  const {id}=useParams();const {usuario,rol,estudioId}=usarEspacio();
  const [caso,setCaso]=useState(null);const [avances,setAvances]=useState([]);const [documentos,setDocumentos]=useState([]);
  const [colaboradores,setColaboradores]=useState([]);const [integrantes,setIntegrantes]=useState([]);
  const [tab,setTab]=useState('informacion');const [error,setError]=useState('');const [ocupado,setOcupado]=useState(false);
  const [titulo,setTitulo]=useState('');const [descripcion,setDescripcion]=useState('');const [estado,setEstado]=useState('ABIERTO');const [responsable,setResponsable]=useState('');
  const [avanceTitulo,setAvanceTitulo]=useState('');const [avanceDescripcion,setAvanceDescripcion]=useState('');
  const [archivo,setArchivo]=useState(null);const [visibilidad,setVisibilidad]=useState('INTERNO');const [nuevoAbogado,setNuevoAbogado]=useState('');
  const soyAdmin=rol==='ADMIN_ESTUDIO'&&caso?.Estudio_ID===estudioId;
  const soyResponsable=caso?.Responsable_ID===usuario.Usuario_ID;
  const editable=soyAdmin||soyResponsable;
  // Carga el expediente y sus tres listados: avances, documentos y colaboradores.
  function cargar(){api(`/casos/${id}`).then(c=>{setCaso(c);setTitulo(c.Titulo);setDescripcion(c.Descripcion||'');setEstado(c.Estado);setResponsable(String(c.Responsable_ID));}).catch(e=>setError(e.message));
    api(`/casos/${id}/avances`).then(setAvances).catch(e=>setError(e.message));
    api(`/casos/${id}/documentos`).then(setDocumentos).catch(e=>setError(e.message));
    api(`/casos/${id}/abogados`).then(setColaboradores).catch(e=>setError(e.message));}
  useEffect(()=>{setError('');cargar();},[id]);
  useEffect(()=>{if(caso?.Estudio_ID)api(`/profesional/estudios/${caso.Estudio_ID}/profesionales`).then(setIntegrantes).catch(e=>setError(e.message));else setIntegrantes([]);},[caso?.Estudio_ID]);
  // Centraliza el manejo de errores y la recarga después de cada cambio.
  async function ejecutar(accion){setOcupado(true);setError('');try{await accion();cargar();}catch(e){setError(e.message);}finally{setOcupado(false);}}
  async function guardarCaso(e){e.preventDefault();await ejecutar(async()=>{await enviarJSON('PUT',`/casos/${id}`,{Titulo:titulo,Descripcion:descripcion,Estado:estado,Responsable_ID:Number(responsable)});await mostrarAlerta('Expediente actualizado');});}
  async function borrarCaso(){const r=await confirmarAccion('Se eliminarán también todos los avances y documentos de este caso.',{peligro:true,confirmar:'Eliminar definitivamente'});if(!r.isConfirmed)return;
    await ejecutar(async()=>{await api(`/casos/${id}`,{method:'DELETE'});await mostrarAlerta('Expediente eliminado');window.location.assign('/profesional/casos');});}
  // El avance empieza siendo interno; publicar es otra acción con permiso.
  async function registrarAvance(e){e.preventDefault();await ejecutar(async()=>{await enviarJSON('POST',`/casos/${id}/avances`,{Titulo:avanceTitulo,Descripcion:avanceDescripcion});setAvanceTitulo('');setAvanceDescripcion('');await mostrarAlerta('Avance interno registrado');});}
  async function publicar(a){const r=await confirmarAccion('El cliente podrá ver este avance.');if(!r.isConfirmed)return;
    await ejecutar(async()=>{await api(`/casos/${id}/avances/${a.Avance_ID}/publicar`,{method:'PATCH'});await mostrarAlerta('Avance publicado');});}
  async function borrarAvance(a){const r=await confirmarAccion('Eliminar este avance?',{peligro:true});if(!r.isConfirmed)return;
    await ejecutar(async()=>{await api(`/casos/${id}/avances/${a.Avance_ID}`,{method:'DELETE'});});}
  async function subir(e){e.preventDefault();if(!archivo)return;await ejecutar(async()=>{
    const form=new FormData();form.append('archivo',archivo);form.append('Visibilidad',visibilidad);
    await api(`/casos/${id}/documentos`,{method:'POST',body:form});setArchivo(null);e.target.reset();await mostrarAlerta('Documento cargado');
  });}
  async function eliminarDoc(d){const r=await confirmarAccion('¿Eliminar este documento del expediente?',{peligro:true});if(!r.isConfirmed)return;
    await ejecutar(async()=>{await api(`/casos/${id}/documentos/${d.Documento_ID}`,{method:'DELETE'});});}
  async function bajarDoc(d){try{await descargarArchivo(`/casos/${id}/documentos/${d.Documento_ID}/descargar`,d.Nombre_Archivo);}catch(e){setError(e.message);}}
  async function agregarColaborador(e){e.preventDefault();await ejecutar(async()=>{await enviarJSON('POST',`/casos/${id}/abogados`,{Abogado_ID:Number(nuevoAbogado)});setNuevoAbogado('');});}
  async function quitarColaborador(u){await ejecutar(async()=>{await api(`/casos/${id}/abogados/${u}`,{method:'DELETE'});});}
  if(!caso)return <section className="admin-section"><Link to="/profesional/casos">← Volver a expedientes</Link><p>{error||'Cargando expediente...'}</p></section>;
  return <section className="admin-section">
    <div className="section-head"><div><Link to="/profesional/casos">← Volver a expedientes</Link><h1>#{caso.Caso_ID} · {caso.Titulo}</h1>
      <p>Cliente: {caso.Cliente_Nombre} · Responsable: {caso.Responsable_Nombre}</p></div>
      <span className={`estado estado--${caso.Estado}`}>{caso.Estado.replace('_',' ')}</span></div>
    {error&&<p className="error-text">{error}</p>}
    <div className="pro-tabs pro-case-tabs">
      {['informacion','avances','documentos',...(caso.Estudio_ID?['colaboradores']:[])].map(t=><button key={t} type="button" className={tab===t?'selected':''} onClick={()=>setTab(t)}>{t.toUpperCase()}</button>)}
    </div>
    {tab==='informacion'&&<section className="panel-card"><h2>Información del expediente</h2>
      <form className="form-grid" onSubmit={guardarCaso}>
        <label>Título<input value={titulo} maxLength={200} onChange={e=>setTitulo(e.target.value)} disabled={!editable} required/></label>
        <label>Estado<select value={estado} onChange={e=>setEstado(e.target.value)} disabled={!editable}>
          <option value="ABIERTO">ABIERTO</option><option value="EN_PROCESO">EN_PROCESO</option><option value="CERRADO">CERRADO</option></select></label>
        {caso.Estudio_ID&&soyAdmin&&<label>Responsable<select value={responsable} onChange={e=>setResponsable(e.target.value)}>
          {integrantes.map(p=><option key={p.Usuario_ID} value={p.Usuario_ID}>{p.Nombre} {p.Apellido}</option>)}</select></label>}
        <label className="pro-full">Descripción<textarea value={descripcion} rows={5} disabled={!editable} onChange={e=>setDescripcion(e.target.value)}/></label>
        {editable&&<button disabled={ocupado}>Guardar cambios</button>}
      </form>
      {editable&&<div className="pro-danger"><button className="btn-danger-outline" onClick={borrarCaso} disabled={ocupado}>Eliminar expediente</button></div>}
    </section>}
    {tab==='avances'&&<section className="panel-card"><h2>Historial de avances</h2>
      <form className="form-grid" onSubmit={registrarAvance}>
        <label>Título<input value={avanceTitulo} onChange={e=>setAvanceTitulo(e.target.value)} maxLength={200} required/></label>
        <label className="pro-full">Descripción<textarea value={avanceDescripcion} onChange={e=>setAvanceDescripcion(e.target.value)} required rows={3}/></label>
        <button disabled={ocupado}>Registrar avance interno</button>
      </form>
      <div className="pro-section-space">{!avances.length&&<p>No hay avances todavía.</p>}{avances.map(a=><div className="list-row" key={a.Avance_ID}>
        <div><strong>{a.Titulo}</strong><p>{a.Descripcion}</p><small>{a.Autor} · {new Date(a.Fecha_Creacion).toLocaleDateString('es-AR')}</small></div>
        <div className="actions"><span className={`estado ${a.Publicado?'estado--ACTIVO':'estado--PENDIENTE'}`}>{a.Publicado?'PUBLICADO':'INTERNO'}</span>
          {!a.Publicado&&editable&&<button className="btn-small" disabled={ocupado} onClick={()=>publicar(a)}>Publicar al cliente</button>}
          {(editable||(!a.Publicado&&a.Creado_Por_ID===usuario.Usuario_ID))&&<button className="btn-small btn-danger-outline" disabled={ocupado} onClick={()=>borrarAvance(a)}>Eliminar</button>}
        </div></div>)}</div>
    </section>}
    {tab==='documentos'&&<section className="panel-card"><h2>Documentos del expediente</h2>
      <p>PDF y Excel (.xlsx), máximo 8 MB. Los documentos internos no se muestran al cliente.</p>
      <form className="form-grid" onSubmit={subir}><label>Archivo<input type="file" accept=".pdf,.xlsx" onChange={e=>setArchivo(e.target.files?.[0]||null)} required/></label>
        <label>Visibilidad<select value={visibilidad} onChange={e=>setVisibilidad(e.target.value)}>
          <option value="INTERNO">Solo profesionales</option>{editable&&<option value="CLIENTE">Compartir con el cliente</option>}</select></label>
        <button disabled={ocupado||!archivo}>Subir documento</button></form>
      <div className="pro-section-space">{!documentos.length&&<p>No hay documentos subidos.</p>}{documentos.map(d=><div className="list-row" key={d.Documento_ID}>
        <div><strong>{d.Nombre_Archivo}</strong><small>{d.Visibilidad} · {new Date(d.Fecha_Subida).toLocaleDateString('es-AR')}</small></div>
        <div className="actions"><button className="btn-small" onClick={()=>bajarDoc(d)}>Descargar</button>
          {(editable||d.Subido_Por_ID===usuario.Usuario_ID)&&<button className="btn-small btn-danger-outline" onClick={()=>eliminarDoc(d)} disabled={ocupado}>Eliminar</button>}</div></div>)}</div>
    </section>}
    {tab==='colaboradores'&&<section className="panel-card"><h2>Profesionales colaboradores</h2>
      {editable&&<form className="pro-search-form" onSubmit={agregarColaborador}><label>Agregar profesional<select value={nuevoAbogado} onChange={e=>setNuevoAbogado(e.target.value)} required>
        <option value="">Seleccionar</option>{integrantes.filter(x=>x.Usuario_ID!==caso.Responsable_ID && !colaboradores.some(c=>c.Usuario_ID===x.Usuario_ID)).map(p=><option key={p.Usuario_ID} value={p.Usuario_ID}>{p.Nombre} {p.Apellido}</option>)}</select></label>
        <button disabled={ocupado||!nuevoAbogado}>Agregar</button></form>}
      {colaboradores.map(c=><div className="list-row" key={c.Usuario_ID}><div><strong>{c.Nombre} {c.Apellido}</strong><small>{c.Email}</small></div>
        {editable&&<button className="btn-small btn-danger-outline" onClick={()=>quitarColaborador(c.Usuario_ID)}>Quitar</button>}</div>)}
    </section>}
  </section>;
}
export default ProDetalleCaso;
