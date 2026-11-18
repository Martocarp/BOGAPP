import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { api } from "../api";
import { Link } from "react-router-dom";

const colores = ["#c89e63", "#298263", "#bb6471"];
function Dashboard_a() {
  const [resumen, setResumen] = useState(null);
  const [recientes, setRecientes] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api("/admin/resumen").then(setResumen).catch(err => setError(err.message));
    api("/estudios").then(data => setRecientes(data.slice(0, 5))).catch(err => setError(err.message));
  }, []);
  const r = resumen || { usuarios: 0, profesionales: 0, clientes: 0, estudios: 0, pendientes: 0, aprobados: 0, rechazados: 0 };
  const estados = [
    { name: "Pendientes", value: Number(r.pendientes) },
    { name: "Aprobados", value: Number(r.aprobados) },
    { name: "Rechazados", value: Number(r.rechazados) },
  ];
  const cuentas = [{ name: "Profesionales", cantidad: Number(r.profesionales) }, { name: "Clientes", cantidad: Number(r.clientes) }];
  return (
    <div className="admin-dashboard">
      <div className="section-head"><div><span className="eyebrow">BOGAPP / ESTADÍSTICAS</span><h1>Dashboard</h1>
        <p>Vista general de la plataforma jurídica.</p></div><Link className="link-button" to="/admin/solicitudes">Revisar solicitudes</Link></div>
      {error && <p className="error-text">{error}</p>}
      <div className="stats-grid">
        <div className="stat-card"><span>Estudios registrados</span><strong>{r.estudios}</strong><small>En toda la plataforma</small></div>
        <div className="stat-card"><span>Estudios aprobados</span><strong>{r.aprobados}</strong><small>Activos</small></div>
        <div className="stat-card"><span>Solicitudes pendientes</span><strong>{r.pendientes}</strong><small>Por revisar</small></div>
        <div className="stat-card"><span>Usuarios registrados</span><strong>{r.usuarios}</strong><small>Profesionales y clientes</small></div>
      </div>
      <div className="charts-grid">
        <section className="panel-card chart-card"><h2>Estado de los estudios</h2>
          {Number(r.estudios) ? <ResponsiveContainer width="100%" height={270}>
            <PieChart><Pie data={estados} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={55} outerRadius={88} paddingAngle={3}>
              {estados.map((e, i) => <Cell key={e.name} fill={colores[i]} />)}
            </Pie><Tooltip /><Legend verticalAlign="bottom" /></PieChart>
          </ResponsiveContainer> : <div className="empty-state">Aún no hay estudios para graficar.</div>}
        </section>
        <section className="panel-card chart-card"><h2>Comunidad BOGAPP</h2>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={cuentas} margin={{ top: 15, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize: 12}}/>
              <YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="cantidad" name="Usuarios" fill="#284b68" radius={[6,6,0,0]} maxBarSize={70}/>
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>
      <section className="panel-card"><div className="section-head"><h2>Últimos estudios registrados</h2>
        <Link to="/admin/estudios">Ver todos</Link></div>
        {!recientes.length && <p>No hay estudios registrados.</p>}
        {recientes.map(e => <div className="list-row" key={e.Estudio_ID}><div><strong>{e.Nombre}</strong>
          <small>#{e.Estudio_ID} · {e.Solicitante}</small></div>
          <span className={`estado estado--${e.Estado}`}>{e.Estado}</span></div>)}
      </section>
    </div>
  );
}
export default Dashboard_a;
