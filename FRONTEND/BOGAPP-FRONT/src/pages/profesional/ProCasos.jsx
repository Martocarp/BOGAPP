import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import usarEspacio from './usarEspacio';
import { api, enviarJSON } from '../../api';
import { mostrarAlerta } from '../../utils/alertas';
const ruta = (espacio, estudioId) => '/casos?' + new URLSearchParams({ ...{ espacio }, ...(estudioId ? { estudioId } : {}) });

function ProCasos() {
  const { espacio, estudioId, rol } = usarEspacio();
  const [casos, setCasos] = useState([]); const [clientes, setClientes] = useState([]); const [integrantes, setIntegrantes] = useState([]);
  const [titulo, setTitulo] = useState(''); const [descripcion, setDescripcion] = useState(''); const [clienteId, setClienteId] = useState(''); const [responsable, setResponsable] = useState('');
  const [error, setError] = useState(''); const [ocupado, setOcupado] = useState(false); const [busqueda, setBusqueda] = useState('');
  const esEstudio = espacio === 'estudio';
  function cargar() { api(ruta(espacio, estudioId)).then(setCasos).catch(e => setError(e.message)); }
  useEffect(() => {
    setError(''); setClienteId(''); setResponsable(''); cargar();
    const p = new URLSearchParams({ espacio }); if (estudioId) p.set('estudioId', estudioId);
    const rutaClientes = esEstudio ? `/profesional/clientes-elegibles?estudioId=${estudioId}` : '/profesional/clientes?' + p;
    api(rutaClientes).then(setClientes).catch(e => setError(e.message));
    if (esEstudio && estudioId) api(`/profesional/estudios/${estudioId}/profesionales`).then(setIntegrantes).catch(e => setError(e.message));
    else setIntegrantes([]);
  }, [espacio, estudioId]);
  async function crear(e) {    
e.preventDefault(); setOcupado(true); setError(''); try {
      const data = { Titulo: titulo, Descripcion: descripcion, Cliente_ID: Number(clienteId), Estudio_ID: esEstudio ? estudioId : null };
      if (esEstudio && rol === 'ADMIN_ESTUDIO' && responsable) data.Responsable_ID = Number(responsable);
      await enviarJSON('POST', '/casos', data); await mostrarAlerta('Expediente creado correctamente');
      setTitulo(''); setDescripcion(''); setClienteId(''); setResponsable(''); cargar();
    } catch (e) { setError(e.message); } finally { setOcupado(false); }  
}
  const activos = clientes.filter(c => !c.Estado || c.Estado === 'ACTIVO');
  const filtrados = casos.filter(c => `${c.Titulo} ${c.Cliente_Nombre} ${c.Estado}`.toLowerCase().includes(busqueda.toLowerCase()));
  return <section className="admin-section"><div className="section-head"><div><h1>Expedientes</h1><p>{esEstudio ? 'Casos del estudio' : 'Tus casos particulares'}</p></div><span className="count-pill">{casos.length} casos</span></div>
    {error && <p className="error-text">{error}</p>}
    <section className="panel-card"><h2>Crear expediente</h2>
      <form className="form-grid" onSubmit={crear}>
        <label>Título<input maxLength={200} required value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Descripción breve del caso" /></label>
        <label>Cliente vinculado<select value={clienteId} onChange={e => setClienteId(e.target.value)} required><option value="">Seleccionar cliente activo</option>
          {activos.map(c => <option key={c.Usuario_ID} value={c.Usuario_ID}>{c.Nombre} {c.Apellido}</option>)}</select></label>
        {esEstudio && rol === 'ADMIN_ESTUDIO' && <label>Responsable (opcional)<select value={responsable} onChange={e => setResponsable(e.target.value)}>
          <option value="">Yo mismo</option>{integrantes.map(a => <option key={a.Usuario_ID} value={a.Usuario_ID}>{a.Nombre} {a.Apellido}</option>)}</select></label>}
        <label className="pro-full">Descripción<textarea rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)} /></label>
        <button disabled={ocupado || !activos.length}>Crear caso</button>
      </form>
      {!activos.length && <p className="help-text">Primero vinculá un cliente activo desde la sección Clientes. El cliente debe aceptar la invitación.</p>}
    </section>
    <section className="panel-card"><div className="section-head"><h2>Mis expedientes</h2><input className="pro-list-search" type="search" placeholder="Buscar expediente..." value={busqueda} onChange={e => setBusqueda(e.target.value)} /></div>
      {!filtrados.length && <p>No hay expedientes para mostrar.</p>}
      {filtrados.map(c => <div className="list-row" key={c.Caso_ID}><div><strong>#{c.Caso_ID} · {c.Titulo}</strong>
        <small>Cliente: {c.Cliente_Nombre} · Responsable: {c.Responsable_Nombre}</small></div><div className="actions">
          <span className={`estado estado--${c.Estado}`}>{c.Estado.replace('_', ' ')}</span><Link className="link-button" to={`/profesional/casos/${c.Caso_ID}`}>Abrir expediente</Link></div></div>)}
    </section>
  </section>;
}
export default ProCasos;
