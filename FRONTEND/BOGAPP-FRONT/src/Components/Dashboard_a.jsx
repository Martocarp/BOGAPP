import {useEffect,useRef,useState} from 'react';
import {PieChart,Pie,Cell,ResponsiveContainer,Tooltip,Legend,BarChart,Bar,XAxis,YAxis,CartesianGrid} from 'recharts';
import {api} from '../api';
import {Link} from 'react-router-dom';
import ExportarPDF from './ExportarPDF';
const colores=['#c89e63','#298263','#bb6471'];
function Dashboard_a(){
  const [tab,setTab]=useState('general');
  const [desde,setDesde]=useState('');const [hasta,setHasta]=useState('');const [aplicado,setAplicado]=useState(null);
  const [resumen,setResumen]=useState(null);const [estudios,setEstudios]=useState([]);const [error,setError]=useState('');
  const ref=useRef(null);
  useEffect(()=>{
    const p=tab==='rangos'&&aplicado?`?desde=${aplicado.desde}&hasta=${aplicado.hasta}`:'';
    setError('');api('/admin/resumen'+p).then(setResumen).catch(e=>setError(e.message));
    api('/estudios').then(setEstudios).catch(e=>setError(e.message));
  },[tab,aplicado]);
  const r=resumen||{usuarios:0,profesionales:0,clientes:0,estudios:0,pendientes:0,aprobados:0,rechazados:0};
  const estados=[{name:'Pendientes',value:Number(r.pendientes)},{name:'Aprobados',value:Number(r.aprobados)},{name:'Rechazados',value:Number(r.rechazados)}];
  const cuentas=[{name:'Profesionales',cantidad:Number(r.profesionales)},{name:'Clientes',cantidad:Number(r.clientes)}];
  const periodo=tab==='rangos'&&aplicado?`${aplicado.desde} al ${aplicado.hasta}`:'Histórico general';
  const recientes=estudios.filter(e=>!(tab==='rangos'&&aplicado)||(
    new Date(e.Fecha_Creacion).toISOString().slice(0,10)>=aplicado.desde&&new Date(e.Fecha_Creacion).toISOString().slice(0,10)<=aplicado.hasta)).slice(0,5);
  return <div className="admin-dashboard">
    <div className="section-head"><div><span className="eyebrow">BOGAPP / ESTADÍSTICAS</span><h1>Dashboard</h1>
      <p>Indicadores globales de la plataforma jurídica.</p></div>
      <div className="actions"><Link className="link-button" to="/admin/solicitudes">Revisar solicitudes</Link>
        <ExportarPDF reporteRef={ref} titulo="Super Admin · BOGAPP" periodo={periodo}/></div></div>
    <div className="pro-tabs"><button type="button" className={tab==='general'?'selected':''} onClick={()=>{setTab('general');setAplicado(null);}}>CHARTS GENERAL</button>
      <button type="button" className={tab==='rangos'?'selected':''} onClick={()=>setTab('rangos')}>RANGOS</button></div>
    {tab==='rangos'&&<form className="pro-date-form" onSubmit={e=>{e.preventDefault();if(desde&&hasta&&desde<=hasta)setAplicado({desde,hasta});}}>
      <label>Desde<input type="date" value={desde} max={hasta||undefined} onChange={e=>setDesde(e.target.value)} required/></label>
      <label>Hasta<input type="date" value={hasta} min={desde||undefined} onChange={e=>setHasta(e.target.value)} required/></label>
      <button disabled={!desde||!hasta||desde>hasta}>Aplicar rango</button></form>}
    {error&&<p className="error-text">{error}</p>}
    <div ref={ref} className="pro-report"><div className="report-heading"><strong>BOGAPP / Estadísticas de administración</strong><span>{periodo}</span></div>
      <div className="stats-grid">
        <div className="stat-card"><span>Estudios registrados</span><strong>{r.estudios}</strong><small>{tab==='rangos'&&aplicado?'Creados en el rango':'En toda la plataforma'}</small></div>
        <div className="stat-card"><span>Estudios aprobados</span><strong>{r.aprobados}</strong><small>{tab==='rangos'&&aplicado?'Revisados en el rango':'Activos'}</small></div>
        <div className="stat-card"><span>Solicitudes pendientes</span><strong>{r.pendientes}</strong><small>{tab==='rangos'&&aplicado?'Creadas en el rango':'Por revisar'}</small></div>
        <div className="stat-card"><span>Usuarios registrados</span><strong>{r.usuarios}</strong><small>{tab==='rangos'&&aplicado?'Registrados en el rango':'Profesionales y clientes'}</small></div>
      </div>
      <div className="charts-grid">
        <section className="panel-card chart-card"><h2>{tab==='rangos'&&aplicado?'Movimientos en el período':'Estado de los estudios'}</h2>
          {estados.some(x=>x.value>0)?<ResponsiveContainer width="100%" height={270}><PieChart>
            <Pie data={estados} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={55} outerRadius={88} paddingAngle={3}>
              {estados.map((e,i)=><Cell key={e.name} fill={colores[i]}/>)}</Pie><Tooltip/><Legend verticalAlign="bottom"/></PieChart></ResponsiveContainer>
          :<div className="empty-state">Aún no hay datos para graficar.</div>}</section>
        <section className="panel-card chart-card"><h2>Comunidad BOGAPP</h2>
          <ResponsiveContainer width="100%" height={270}><BarChart data={cuentas} margin={{top:15,right:10,left:-15,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:12}}/><YAxis allowDecimals={false}/>
            <Tooltip/><Bar dataKey="cantidad" name="Usuarios" fill="#284b68" radius={[6,6,0,0]} maxBarSize={70}/></BarChart></ResponsiveContainer></section>
      </div>
      <section className="panel-card"><div className="section-head"><h2>Últimos estudios registrados</h2><Link to="/admin/estudios">Ver todos</Link></div>
        {!recientes.length&&<p>No hay estudios registrados en este período.</p>}
        {recientes.map(e=><div className="list-row" key={e.Estudio_ID}><div><strong>{e.Nombre}</strong>
          <small>#{e.Estudio_ID} · {e.Solicitante}</small></div><span className={`estado estado--${e.Estado}`}>{e.Estado}</span></div>)}
      </section>
    </div>
  </div>;
}
export default Dashboard_a;
