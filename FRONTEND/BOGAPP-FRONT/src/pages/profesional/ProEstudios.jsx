import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, enviarJSON } from '../../api';
import CrearEstudio from '../../Components/CrearEstudio';
import usarEspacio from './usarEspacio';

// Cada estudio se despliega para mostrar integrantes, sin cambiar el espacio de trabajo.

function ProEstudios() {
  const { estudios: activos, cargarEstudios, estudioId } = usarEspacio();
  const [todos, setTodos] = useState([]);
  const [invitaciones, setInvitaciones] = useState([]);
  const [abierto, setAbierto] = useState(null);
  const [integrantes, setIntegrantes] = useState({});
  const [nuevoId, setNuevoId] = useState('');
  const [error, setError] = useState('');

  function cargar() {
    api('/estudios').then(setTodos).catch(e => setError(e.message));
    api('/profesional/invitaciones').then(setInvitaciones).catch(e => setError(e.message));
    cargarEstudios();
  }

  useEffect(() => { cargar(); }, []);

  async function desplegar(id) {
    if (abierto === id) return setAbierto(null);
    setAbierto(id);
    setError('');

    // Consultamos los integrantes solo al desplegar y guardamos el resultado.
    try {
      const personas = await api(`/profesional/estudios/${id}/profesionales`);
      setIntegrantes(prev => ({ ...prev, [id]: personas }));
    } catch (e) { setError(e.message); }
  }

  async function responder(id, Estado) {
    try {
      await enviarJSON('PATCH', `/profesional/invitaciones/${id}`, { Estado });
      cargar();
    } catch (e) { setError(e.message); }
  }

  async function solicitar(e) {
    e.preventDefault();
    try {
      await enviarJSON('POST', `/profesional/estudios/${nuevoId}/solicitar-ingreso`, {});
      setNuevoId('');
      cargar();
    } catch (e) { setError(e.message); }
  }

  return (
    <section className="admin-section">
      <header className="section-head">
        <div>
          <h1>Mis estudios</h1>
          <p>Desplegá un estudio para consultar sus profesionales y roles.</p>
        </div>
      </header>
      {error && <p className="error-text" role="alert">{error}</p>}

      <section className="panel-card">
        <h2>Estudios y solicitudes de creación</h2>
        {!todos.length && <p>Todavía no tenés estudios asociados.</p>}

        {todos.map(estudio => {
          const vinculo = activos.find(x => x.Estudio_ID === estudio.Estudio_ID);
          const puedeDesplegar = Boolean(vinculo);
          const expandido = abierto === estudio.Estudio_ID;

          return (
            <div className="estudio-acordeon" key={estudio.Estudio_ID}>
              <div className="list-row">
                <div>
                  <strong>{estudio.Nombre}</strong>
                  <small>{estudio.Direccion || 'Sin dirección'} · {vinculo?.Rol_Estudio || 'Solicitud de creación'}</small>
                </div>
                <div className="actions">
                  <span className={`estado estado--${estudio.Estado}`}>{estudio.Estado}</span>
                  {puedeDesplegar && <button type="button" className="btn-small" aria-expanded={expandido}
                    onClick={() => desplegar(estudio.Estudio_ID)}>
                    {expandido ? 'Ocultar integrantes ▲' : 'Ver integrantes ▼'}
                  </button>}
                </div>
              </div>

              {expandido && puedeDesplegar && (
                <div className="estudio-acordeon-detalle">
                  <h3>Profesionales asociados</h3>
                  {!integrantes[estudio.Estudio_ID] && <p>Cargando integrantes...</p>}
                  {integrantes[estudio.Estudio_ID]?.length === 0 && <p>Sin integrantes activos.</p>}

                  {integrantes[estudio.Estudio_ID]?.map(p => (
                    <div className="list-row" key={p.Usuario_ID}>
                      <strong>{p.Nombre} {p.Apellido}</strong>
                      <small>{p.Rol_Estudio === 'ADMIN_ESTUDIO' ? 'Administrador del estudio' : 'Abogado'}</small>
                    </div>
                  ))}
                  <p className="help-text">Para invitar o desvincular integrantes, seleccioná este estudio en el menú lateral y entrá en Profesionales.</p>
                  {vinculo?.Rol_Estudio === 'ADMIN_ESTUDIO' && estudioId === estudio.Estudio_ID && <Link to="/profesional/integrantes" className="link-button">
                    Administrar integrantes del espacio seleccionado
                  </Link>}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className="panel-card">
        <h2>Invitaciones y solicitudes de incorporación</h2>
        {!invitaciones.length && <p>No hay solicitudes ni invitaciones.</p>}

        {invitaciones.map(x => (
          <div className="list-row" key={x.Estudio_ID}>
            <div><strong>{x.Nombre}</strong><small>{x.Origen} · {x.Rol_Estudio} · {x.Estado}</small></div>
            {x.Estado === 'PENDIENTE' && x.Origen === 'INVITACION' && (
              <div className="actions">
                <button className="btn-small" onClick={() => responder(x.Estudio_ID, 'ACTIVO')}>Aceptar</button>
                <button className="btn-small btn-danger-outline" onClick={() => responder(x.Estudio_ID, 'RECHAZADO')}>Rechazar</button>
              </div>
            )}
          </div>
        ))}

        <form className="pro-search-form" onSubmit={solicitar}>
          <label>Solicitar ingreso a otro estudio (ID)
            <input type="number" min="1" value={nuevoId} onChange={e => setNuevoId(e.target.value)} required />
          </label>
          <button>Solicitar ingreso</button>
        </form>
      </section>

      <CrearEstudio onCreado={cargar} />
    </section>
  );
}

export default ProEstudios;
