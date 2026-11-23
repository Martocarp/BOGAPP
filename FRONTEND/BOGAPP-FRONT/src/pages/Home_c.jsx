import { useEffect, useState } from 'react';
import Salir from '../Components/Salir';
import CambiarClave from '../Components/CambiarClave';
import ClienteCasos from './cliente/ClienteCasos';
import ClienteSolicitudes from './cliente/ClienteSolicitudes';
import useAuth from '../context/useAuth';
import { api, enviarJSON, descargarArchivo } from '../api';
import { mostrarAlerta } from '../utils/alertas';

// Mismo menú lateral que los otros roles, con las secciones propias del cliente.
const secciones = [
  ['inicio', 'Dashboard', '▦'],
  ['abogados', 'Buscar profesionales', '♙'],
  ['estudios', 'Buscar estudios', '▤'],
  ['vinculos', 'Mis vinculaciones', '◷'],
  ['casos', 'Mis expedientes', '▣'],
  ['solicitudes', 'Nuevas consultas', '✉'],
  ['cuenta', 'Mi cuenta', '⚙']
];


function Home_c() {
  const { usuario } = useAuth();
  const [seccion, setSeccion] = useState('inicio');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [area, setArea] = useState('');
  const [texto, setTexto] = useState('');
  const [catalogo, setCatalogo] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [estudios, setEstudios] = useState([]);
  const [vinculos, setVinculos] = useState({ estudios: [], profesionales: [] });
  const [casos, setCasos] = useState([]);
  const [actividad, setActividad] = useState({ novedades: [], preguntasPendientes: 0 });
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);

  // React pide datos a Express. La API protege cada respuesta según la sesión.
  function cargar() {
    Promise.all([
      api('/especializaciones'), api('/vinculos/profesionales'), api('/estudios'),
      api('/vinculos/mis'), api('/casos'), api('/cliente/actividad')
    ]).then(([areas, abogados, estudios, vinculos, casos, actividad]) => {
      setCatalogo(areas);
      setProfesionales(abogados);
      setEstudios(estudios);
      setVinculos(vinculos);
      setCasos(casos);
      setActividad(actividad);
    }).catch(e => setError(e.message));
  }

  useEffect(() => { cargar(); }, []);

  // Los botones de especialización filtran datos que llegan desde MySQL.
  const registros = seccion === 'abogados' ? profesionales : estudios;
  const resultados = registros.filter(x => {
    const nombre = seccion === 'abogados' ? `${x.Nombre} ${x.Apellido}` : x.Nombre;
    const coincideNombre = nombre.toLowerCase().includes(texto.trim().toLowerCase());
    const coincideArea = !area || String(x.Areas_ID || '').split(',').includes(area);
    return coincideNombre && coincideArea;
  });

  async function vincular(tipo, id) {
    setOcupado(true);
    setError('');

    try {
      const ruta = tipo === 'estudio' ? '/vinculos/solicitar-estudio' : '/vinculos/solicitar-profesional';
      const datos = tipo === 'estudio' ? { Estudio_ID: id } : { Profesional_ID: id };
      const respuesta = await enviarJSON('POST', ruta, datos);
      await mostrarAlerta(respuesta.message);
      cargar();
    } catch (e) { setError(e.message); }
    finally { setOcupado(false); }
  }

  async function responder(tipo, id, Estado) {
    setOcupado(true);
    setError('');

    try {
      const ruta = tipo === 'estudio' ? `/vinculos/cliente/estudios/${id}` : `/vinculos/cliente/profesionales/${id}`;
      await enviarJSON('PATCH', ruta, { Estado });
      cargar();
    } catch (e) { setError(e.message); }
    finally { setOcupado(false); }
  }

  async function descargar(ruta, nombre) {
    try { await descargarArchivo(ruta, nombre); }
    catch (e) { setError(e.message); }
  }

  function abrirSeccion(id) {
    setSeccion(id);
    setTexto('');
    setArea('');
    setPerfil(null);
    setError('');
    setMenuAbierto(false);
    if (id === 'inicio') cargar(); // Renovar novedades al volver al Dashboard.
  }

  const todasLasVinculaciones = [...vinculos.estudios, ...vinculos.profesionales];
  const activos = todasLasVinculaciones.filter(v => v.Estado === 'ACTIVO').length;
  const invitaciones = todasLasVinculaciones.filter(v => v.Estado === 'PENDIENTE' && v.Origen === 'INVITACION').length;
  const tituloSeccion = secciones.find(([id]) => id === seccion)?.[1] || 'Mi portal';

  return (
    <div className="admin-layout cliente-layout">
      <aside className="admin-sidebar cliente-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-symbol">⚖</div>
          <div><h2>BOGAPP</h2><p>PORTAL CLIENTE</p></div>
        </div>

        <button type="button" className="cliente-menu-toggle" aria-expanded={menuAbierto}
          aria-controls="cliente-navegacion" onClick={() => setMenuAbierto(!menuAbierto)}>
          ☰ {menuAbierto ? 'Ocultar menú' : 'Mostrar menú'}
        </button>
        <span className="sidebar-label">NAVEGACIÓN</span>

        <nav id="cliente-navegacion" aria-label="Secciones del portal cliente"
          className={`admin-nav cliente-nav ${menuAbierto ? 'cliente-nav--abierto' : ''}`}>
          {secciones.map(([id, nombre, icono]) => (
            <button key={id} type="button" className={seccion === id ? 'seleccionado' : ''}
              aria-current={seccion === id ? 'page' : undefined} onClick={() => abrirSeccion(id)}>
              {icono} &nbsp; {nombre}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <div className="avatar">{usuario?.Nombre?.[0]?.toUpperCase() || 'C'}</div>
            <div><b>{usuario?.Nombre} {usuario?.Apellido}</b><small>CLIENTE</small></div>
          </div>
          <Salir />
        </div>
      </aside>

      <main className="admin-content cliente-content">
        <header className="section-head">
          <div>
            <span className="eyebrow">BOGAPP / PORTAL CLIENTE</span>
            <h1>{seccion === 'inicio' ? `Hola, ${usuario?.Nombre || 'cliente'}` : tituloSeccion}</h1>
            <p>{seccion === 'inicio' ? 'Consultá tu actividad jurídica y tus acciones pendientes.' : 'Gestioná tu actividad en BOGAPP.'}</p>
          </div>
        </header>
        {error && <p className="error-text" role="alert">{error}</p>}

        {seccion === 'inicio' && (
          <div className="cliente-inicio">
            <div className="stats-grid">
              <div className="stat-card"><span>Mis expedientes</span><strong>{casos.length}</strong></div>
              <div className="stat-card"><span>Vínculos activos</span><strong>{activos}</strong></div>
              <div className="stat-card"><span>Invitaciones pendientes</span><strong>{invitaciones}</strong></div>
            </div>

            <section className="panel-card cliente-novedades">
              <h2>Actividad y pendientes</h2>
              <p>Preguntas sin responder: <strong>{actividad.preguntasPendientes}</strong></p>
              {invitaciones > 0 && <button onClick={() => abrirSeccion('vinculos')}>
                Responder {invitaciones} invitación(es)
              </button>}
              <h3 className="pro-section-space">Últimas novedades publicadas</h3>
              {!actividad.novedades.length && <p>No hay novedades recientes.</p>}
              {actividad.novedades.map(n => (
                <div className="list-row" key={n.Avance_ID}>
                  <div><strong>{n.Titulo}</strong><small>{n.Caso_Titulo} · {new Date(n.Fecha_Publicacion).toLocaleDateString('es-AR')}</small></div>
                  <button className="btn-small" onClick={() => abrirSeccion('casos')}>Ver mis expedientes</button>
                </div>
              ))}
            </section>

            <section className="panel-card">
              <h2>Accesos rápidos</h2>
              <div className="actions">
                <button onClick={() => abrirSeccion('abogados')}>Buscar profesionales</button>
                <button onClick={() => abrirSeccion('estudios')}>Buscar estudios</button>
                <button onClick={() => abrirSeccion('casos')}>Mis expedientes</button>
                <button onClick={() => abrirSeccion('solicitudes')}>Solicitar nuevo caso</button>
              </div>
            </section>
          </div>
        )}

        {(seccion === 'abogados' || seccion === 'estudios') && (
          <section className="panel-card">
            <h2>{seccion === 'abogados' ? 'Profesionales' : 'Estudios jurídicos'}</h2>
            <p>Elegí un área jurídica o buscá por nombre.</p>
            <input className="cliente-busqueda" value={texto} onChange={e => setTexto(e.target.value)}
              placeholder="Buscar por nombre..." aria-label="Buscar por nombre" />

            <div className="cliente-filtros" aria-label="Especializaciones">
              <button type="button" className={!area ? 'seleccionado' : ''} onClick={() => setArea('')}>Todas</button>
              {catalogo.map(x => (
                <button type="button" key={x.Especializacion_ID}
                  className={area === String(x.Especializacion_ID) ? 'seleccionado' : ''}
                  onClick={() => setArea(String(x.Especializacion_ID))}>{x.Nombre}</button>
              ))}
            </div>

            <p className="help-text">{resultados.length} resultados encontrados</p>
            {resultados.map(x => {
              const esAbogado = seccion === 'abogados';
              const id = esAbogado ? x.Usuario_ID : x.Estudio_ID;
              const nombre = esAbogado ? `${x.Nombre} ${x.Apellido}` : x.Nombre;
              const vinculo = (esAbogado ? vinculos.profesionales : vinculos.estudios)
                .find(v => (esAbogado ? v.Profesional_ID : v.Estudio_ID) === id);

              return (
                <div key={id} className="cliente-resultado">
                  <div>
                    <strong>{nombre}</strong>
                    <small>{x.Areas || 'Sin especializaciones informadas'}</small>
                    {esAbogado && x.Matricula && <small>Matrícula: {x.Matricula}</small>}
                    {!esAbogado && x.Direccion && <small>{x.Direccion}</small>}
                  </div>
                  <div className="actions">
                    {esAbogado && <button className="btn-small" onClick={() => setPerfil(perfil === id ? null : id)}>
                      {perfil === id ? 'Ocultar perfil' : 'Ver perfil'}
                    </button>}
                    <button disabled={ocupado || ['ACTIVO', 'PENDIENTE'].includes(vinculo?.Estado)}
                      onClick={() => vincular(esAbogado ? 'profesional' : 'estudio', id)}>
                      {vinculo?.Estado === 'ACTIVO' ? 'Vinculado' : vinculo?.Estado === 'PENDIENTE'
                        ? 'Pendiente' : esAbogado ? 'Solicitar vinculación' : 'Unirse'}
                    </button>
                  </div>
                  {esAbogado && perfil === id && (
                    <div className="cliente-perfil">
                      <p>{x.Biografia || 'Este profesional todavía no cargó una biografía.'}</p>
                      {!!x.Cv_Disponible && <button onClick={() => descargar(`/vinculos/profesionales/${id}/cv`, `CV_${nombre.replaceAll(' ', '_')}.pdf`)}>
                        Descargar CV público
                      </button>}
                    </div>
                  )}
                </div>
              );
            })}
            {!resultados.length && <p>No se encontraron resultados. Probá otro filtro.</p>}
          </section>
        )}

        {seccion === 'vinculos' && (
          <section className="panel-card">
            <h2>Mis vinculaciones</h2>
            {[
              { titulo: 'Estudios', tipo: 'estudio', lista: vinculos.estudios, campo: 'Estudio_ID' },
              { titulo: 'Profesionales particulares', tipo: 'profesional', lista: vinculos.profesionales, campo: 'Profesional_ID' }
            ].map(grupo => (
              <div key={grupo.tipo} className="pro-section-space">
                <h3>{grupo.titulo}</h3>
                {!grupo.lista.length && <p>No hay vinculaciones todavía.</p>}
                {grupo.lista.map(v => (
                  <div className="list-row" key={v[grupo.campo]}>
                    <div><strong>{v.Nombre}</strong><small>{v.Estado} · {v.Origen}</small></div>
                    {v.Estado === 'PENDIENTE' && v.Origen === 'INVITACION' && (
                      <div className="actions">
                        <button disabled={ocupado} onClick={() => responder(grupo.tipo, v[grupo.campo], 'ACTIVO')}>Aceptar</button>
                        <button disabled={ocupado} className="btn-danger-outline" onClick={() => responder(grupo.tipo, v[grupo.campo], 'RECHAZADO')}>Rechazar</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </section>
        )}

        {seccion === 'casos' && <ClienteCasos casos={casos} usuarioId={usuario?.Usuario_ID} alActualizar={cargar} />}
        {seccion === 'solicitudes' && <ClienteSolicitudes vinculos={vinculos} />}
        {seccion === 'cuenta' && <CambiarClave />}
      </main>
    </div>
  );
}

export default Home_c;
