import {useEffect,useState} from 'react';
import CambiarClave from '../../Components/CambiarClave';
import {api,enviarJSON,descargarArchivo} from '../../api';
import {mostrarAlerta,confirmarAccion} from '../../utils/alertas';
function ProPerfil() {
  const [perfil,setPerfil]=useState(null);const [especialidades,setEspecialidades]=useState([]);
  const [archivo,setArchivo]=useState(null);const [error,setError]=useState('');const [ocupado,setOcupado]=useState(false);
  function cargar(){api('/profesional/perfil').then(setPerfil).catch(e=>setError(e.message));}
  useEffect(()=>{cargar();api('/especializaciones').then(setEspecialidades).catch(e=>setError(e.message));},[]);
  async function guardar(e){e.preventDefault();setOcupado(true);setError('');try{
    await enviarJSON('PUT','/profesional/perfil',{Biografia:perfil.Biografia||'',Matricula:perfil.Matricula||'',
      Cv_Visible:!!perfil.Cv_Visible,especializaciones:perfil.especializaciones});
    await mostrarAlerta('Perfil actualizado correctamente');cargar();
  }catch(e){setError(e.message);}finally{setOcupado(false);}}
  async function subir(e){e.preventDefault();setOcupado(true);setError('');try{
    const f=new FormData();f.append('archivo',archivo);await api('/profesional/perfil/cv',{method:'POST',body:f});
    setArchivo(null);e.target.reset();await mostrarAlerta('CV PDF cargado correctamente');cargar();
  }catch(e){setError(e.message);}finally{setOcupado(false);}}
  async function quitarCv(){const r=await confirmarAccion('¿Eliminar tu CV actual?',{peligro:true});if(!r.isConfirmed)return;
    try{await api('/profesional/perfil/cv',{method:'DELETE'});cargar();}catch(e){setError(e.message);}}
  async function descargar(){try{await descargarArchivo('/profesional/perfil/cv',perfil.Cv_Nombre||'Curriculum.pdf');}catch(e){setError(e.message);}}
  if(!perfil)return <p>{error||'Cargando perfil...'}</p>;
  return <section className="admin-section"><div className="section-head"><div><h1>Mi perfil profesional</h1><p>Currículum, matrícula y áreas jurídicas en las que trabajás.</p></div></div>
    {error&&<p className="error-text">{error}</p>}
    <section className="panel-card"><h2>{perfil.Nombre} {perfil.Apellido}</h2><p>{perfil.Email}</p>
      <form onSubmit={guardar} className="pro-profile-form">
        <label>Matrícula<input value={perfil.Matricula||''} onChange={e=>setPerfil(p=>({...p,Matricula:e.target.value}))} maxLength={50} placeholder="Número de matrícula (si corresponde)"/></label>
        <label>Presentación profesional<textarea rows={4} maxLength={2000} value={perfil.Biografia||''} onChange={e=>setPerfil(p=>({...p,Biografia:e.target.value}))}/></label>
        <div><h3>Especializaciones</h3><p>Podés seleccionar varias áreas jurídicas.</p>
          <div className="pro-specialties">{especialidades.map(x=><label key={x.Especializacion_ID}><input type="checkbox"
            checked={perfil.especializaciones.includes(x.Especializacion_ID)} onChange={e=>setPerfil(p=>({...p,
              especializaciones:e.target.checked?[...p.especializaciones,x.Especializacion_ID]:p.especializaciones.filter(id=>id!==x.Especializacion_ID)}))}/>
            {x.Nombre}</label>)}</div>
        </div>
        <label className="pro-check"><input type="checkbox" checked={!!perfil.Cv_Visible} onChange={e=>setPerfil(p=>({...p,Cv_Visible:e.target.checked}))}/> CV disponible para compartir en mi perfil</label>
        <button disabled={ocupado}>Guardar perfil</button>
      </form>
    </section>
    <section className="panel-card"><h2>Currículum vitae (PDF)</h2>
      {perfil.Cv_Nombre?<div className="list-row"><div><strong>{perfil.Cv_Nombre}</strong><small>Documento personal guardado de forma privada</small></div>
        <div className="actions"><button onClick={descargar}>Descargar CV</button><button className="btn-danger-outline" onClick={quitarCv}>Eliminar</button></div></div>
      :<p>No subiste ningún CV.</p>}
      <form onSubmit={subir} className="pro-search-form"><label>Subir o reemplazar CV<input type="file" accept=".pdf,application/pdf" onChange={e=>setArchivo(e.target.files?.[0]||null)} required/></label>
        <button disabled={ocupado||!archivo}>Guardar PDF</button></form>
      <p className="help-text">Máximo 8 MB. Tu CV solo será descargable por clientes si activás «CV disponible para compartir» y guardás el perfil.</p>
    </section>
    <CambiarClave />
  </section>;
}
export default ProPerfil;
