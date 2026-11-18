import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Salir from '../Components/Salir';
import useAuth from '../context/useAuth';
import { api } from '../api';

function Home_p() {
  const { usuario } = useAuth();
  const [estudios,setEstudios]=useState([]);
  const [espacio,setEspacio]=useState('particular');
  const [error,setError]=useState('');
  function cargarEstudios(){ api('/estudios/mis').then(setEstudios).catch(e=>setError(e.message)); }
  useEffect(()=>{ cargarEstudios(); },[]);
  const esEstudio=espacio!=='particular';
  const estudio=estudios.find(e=>String(e.Estudio_ID)===espacio);
  const rol=estudio?.Rol_Estudio||'INDEPENDIENTE';
  return <div className="admin-layout pro-layout">
    <aside className="admin-sidebar pro-sidebar">
      <div className="sidebar-brand"><div className="sidebar-symbol">⚖</div><div><h2>BOGAPP</h2><p>PORTAL PROFESIONAL</p></div></div>
      <label className="workspace-label">ESPACIO DE TRABAJO
        <select className="workspace-select" value={espacio} onChange={e=>setEspacio(e.target.value)}>
          <option value="particular">Mi actividad particular</option>
          {estudios.map(e=><option key={e.Estudio_ID} value={e.Estudio_ID}>{e.Nombre}</option>)}
        </select>
      </label>
      <p className="pro-role-text">{esEstudio?`Tu rol: ${rol}`:'Abogado independiente'}</p>
      <span className="sidebar-label">NAVEGACIÓN</span>
      <nav className="admin-nav">
        <NavLink to="/profesional" end>▦ &nbsp; Dashboard</NavLink>
        <NavLink to="/profesional/estudios">▤ &nbsp; Mis estudios</NavLink>
        <NavLink to="/profesional/clientes">♙ &nbsp; Clientes</NavLink>
        <NavLink to="/profesional/casos">▣ &nbsp; Expedientes</NavLink>
        {esEstudio&&<NavLink to="/profesional/integrantes">♧ &nbsp; Profesionales</NavLink>}
        {esEstudio&&rol==='ADMIN_ESTUDIO'&&<NavLink to="/profesional/configuracion">⚙ &nbsp; Configuración estudio</NavLink>}
        <NavLink to="/profesional/perfil">◉ &nbsp; Mi perfil / CV</NavLink>
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-profile"><div className="avatar">{usuario?.Nombre?.[0]?.toUpperCase()||'P'}</div><div><b>{usuario?.Nombre} {usuario?.Apellido}</b><small>PROFESIONAL</small></div></div>
        <Salir />
      </div>
    </aside>
    <main className="admin-content pro-content">
      {error&&<p className="error-text">{error}</p>}
      <Outlet context={{espacio:esEstudio?'estudio':'particular',estudioId:estudio?.Estudio_ID||null,
        estudio,rol,estudios,cargarEstudios,usuario}}/>
    </main>
  </div>;
}
export default Home_p;
