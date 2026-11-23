import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, enviarJSON } from '../../api';
import usarEspacio from './usarEspacio';

// Los pedidos de nuevos asuntos se revisan aquí; no generan un caso automáticamente.

function ProSolicitudes() {
  const { espacio, estudioId, rol } = usarEspacio();
  const [solicitudes, setSolicitudes] = useState([]);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const puedeResponder = espacio === 'particular' || rol === 'ADMIN_ESTUDIO';

  function cargar() {
    if (!puedeResponder) {
      setSolicitudes([]);
      return;
    }

    const filtros = new URLSearchParams({ espacio });
    if (estudioId) filtros.set('estudioId', estudioId);

    api(`/cliente/solicitudes?${filtros}`)
      .then(setSolicitudes)
      .catch(e => setError(e.message));
  }

  useEffect(() => { cargar(); }, [espacio, estudioId]);

  async function responder(id, Estado) {
    setOcupado(true);
    setError('');

    try {
      await enviarJSON('PATCH', `/cliente/solicitudes/${id}`, { Estado });
      cargar();
    } catch (e) { setError(e.message); }
    finally { setOcupado(false); }
  }

  return (
    <section className="admin-section">
      <header className="section-head">
        <div><h1>Solicitudes de nuevos casos</h1><p>Pedidos enviados por tus clientes vinculados.</p></div>
      </header>
      {error && <p className="error-text">{error}</p>}
      {!puedeResponder && <p className="help-text">En un estudio, los pedidos nuevos los revisa el ADMIN_ESTUDIO.</p>}

      <section className="panel-card">
        {!solicitudes.length && <p>No hay solicitudes en este espacio.</p>}
        {solicitudes.map(s => (
          <div className="estudio-acordeon" key={s.Solicitud_ID}>
            <div className="list-row">
              <div>
                <strong>{s.Titulo}</strong>
                <small>Cliente: {s.Cliente_Nombre} · {new Date(s.Fecha_Solicitud).toLocaleDateString('es-AR')}</small>
              </div>
              <span className={`estado estado--${s.Estado}`}>{s.Estado}</span>
            </div>
            <p>{s.Descripcion}</p>
            {puedeResponder && s.Estado === 'PENDIENTE' && (
              <div className="actions">
                <button disabled={ocupado} onClick={() => responder(s.Solicitud_ID, 'ACEPTADA')}>Aceptar solicitud</button>
                <button disabled={ocupado} className="btn-danger-outline" onClick={() => responder(s.Solicitud_ID, 'RECHAZADA')}>Rechazar</button>
              </div>
            )}
          </div>
        ))}
      </section>

      <p className="help-text">Aceptar una solicitud no crea un expediente: luego podés hacerlo desde <Link to="/profesional/casos">Expedientes</Link>.</p>
    </section>
  );
}

export default ProSolicitudes;
