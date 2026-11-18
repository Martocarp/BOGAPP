import { useEffect, useRef, useState } from 'react';
import { Pie, PieChart, Cell, Legend, Tooltip, Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import usarEspacio from './usarEspacio';
import { api } from '../../api';
import ExportarPDF from '../../Components/ExportarPDF';
const colores=['#b89259','#2b8573','#3e6486'];
function ProDashboard() {
  const {espacio,estudioId,estudio,rol,usuario}=usarEspacio();
  const [tab,setTab]=useState('general');
  const [desde,setDesde]=useState(''); const [hasta,setHasta]=useState('');
  const [aplicado,setAplicado]=useState(null);
  const [datos,setDatos]=useState(null); const [error,setError]=useState('');
  const reporteRef=useRef(null);
  useEffect(()=>{
    const params=new URLSearchParams({espacio});
    if(estudioId) params.set('estudioId',estudioId);
    if(tab==='rangos' && aplicado) {params.set('desde',aplicado.desde);params.set('hasta',aplicado.hasta);}
    setDatos(null);setError('');
    api('/profesional/dashboard?'+params).then(setDatos).catch(e=>setError(e.message));
  },[espacio,estudioId,tab,aplicado]);
  const d=datos||{total:0,abiertos:0,enProceso:0,cerrados:0,clientes:0,documentos:0,avances:0,meses:[]};
  const estados=[{name:'Abiertos',value:d.abiertos},{name:'En proceso',value:d.enProceso},{name:'Cerrados',value:d.cerrados}];
  const titulo=espacio==='estudio'?estudio?.Nombre:`Actividad particular de ${usuario.Nombre}`;
  const periodo=tab==='rangos'&&aplicado?`${aplicado.desde} al ${aplicado.hasta}`:'Histórico general';
  return <section className="admin-section">
    <div className="section-head"><div><span className="eyebrow">BOGAPP / PROFESIONAL</span><h1>Dashboard</h1>
      <p>{titulo} · {rol}</p></div><ExportarPDF reporteRef={reporteRef} titulo={titulo} periodo={periodo}/></div>
    <div className="pro-tabs"><button type="button" className={tab==='general'?'selected':''} onClick={()=>{setTab('general');setAplicado(null);}}>CHARTS GENERAL</button>
      <button type="button" className={tab==='rangos'?'selected':''} onClick={()=>setTab('rangos')}>RANGOS</button></div>
    {tab==='rangos'&&<form className="pro-date-form" onSubmit={e=>{e.preventDefault();if(desde&&hasta&&desde<=hasta)setAplicado({desde,hasta});}}>
      <label>Desde<input type="date" value={desde} max={hasta||undefined} onChange={e=>setDesde(e.target.value)} required/></label>
      <label>Hasta<input type="date" value={hasta} min={desde||undefined} onChange={e=>setHasta(e.target.value)} required/></label>
      <button disabled={!desde||!hasta||desde>hasta}>Aplicar rango</button>
    </form>}
    {error&&<p className="error-text">{error}</p>}
    <div ref={reporteRef} className="pro-report">
      <div className="report-heading"><strong>{titulo}</strong><span>{periodo}</span></div>
      <div className="stats-grid">
        {[['Expedientes',d.total],['Abiertos',d.abiertos],['En proceso',d.enProceso],['Cerrados',d.cerrados],['Clientes',d.clientes],['Documentos',d.documentos],['Avances',d.avances]].map(([label,val])=>
          <div className="stat-card" key={label}><span>{label}</span><strong>{val}</strong></div>)}
      </div>
      <div className="charts-grid">
        <section className="panel-card chart-card"><h2>Estado de los expedientes</h2>
          {d.total>0?<ResponsiveContainer width="100%" height={260}><PieChart><Pie data={estados} dataKey="value" nameKey="name" innerRadius={50} outerRadius={88}>
            {estados.map((x,i)=><Cell key={x.name} fill={colores[i]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer>
          :<p>Sin expedientes para el período seleccionado.</p>}
        </section>
        <section className="panel-card chart-card"><h2>Expedientes creados por mes</h2>
          <ResponsiveContainer width="100%" height={260}><BarChart data={d.meses}><CartesianGrid strokeDasharray="3 3" vertical={false}/>
            <XAxis dataKey="mes"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="cantidad" name="Casos" fill="#254968" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer>
        </section>
      </div>
    </div>
  </section>;
}
export default ProDashboard;
