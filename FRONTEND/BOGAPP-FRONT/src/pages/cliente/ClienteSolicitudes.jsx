import { useEffect, useState } from 'react';
import { api, enviarJSON } from '../../api';

// Esta solicitud solo pide que un abogado evalúe un asunto; no abre un expediente.

function ClienteSolicitudes({ vinculos }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [destino, setDestino] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const destinatarios = [
    ...vinculos.profesionales.filter(x => x.Estado === 'ACTIVO').map(x => ({
      valor: `profesional:${x.Profesional_ID}`, nombre: `Profesional: ${x.Nombre}`
    })),
    ...vinculos.estudios.filter(x => x.Estado === 'ACTIVO').map(x => ({
      valor: `estudio:${x.Estudio_ID}`, nombre: `Estudio: ${x.Nombre}`
    }))
  ];

  function cargar() {
    api('/cliente/solicitudes').then(setSolicitudes).catch(e => setError(e.message));
  }

  useEffect(() => { cargar(); }, []);

  async function enviar(e) {
    e.preventDefault();
    const [tipo, id] = destino.split(':');
    if (!id) return;

    setError('');
    setMensaje('');
    setOcupado(true);
    try {
      const datos = { Titulo: titulo, Descripcion: descripcion };
      datos[tipo === 'estudio' ? 'Estudio_ID' : 'Profesional_ID'] = Number(id);

      const respuesta = await enviarJSON('POST', '/cliente/solicitudes', datos);
      setMensaje(respuesta.message);
      setTitulo('');
      setDescripcion('');
      cargar();
    } catch (e) { setError(e.message); }
    finally { setOcupado(false); }
  }

  return (
    <section className="panel-card">
      <h2>Solicitar un nuevo caso</h2>
      <p>Describí tu situación para que un profesional o estudio vinculado la evalúe.</p>
      {error && <p className="error-text">{error}</p>}
      {mensaje && <p className="help-text">{mensaje}</p>}

      <form className="form-grid" onSubmit={enviar}>
        <label>Destinatario
          <select value={destino} onChange={e => setDestino(e.target.value)} required>
            <option value="">Seleccionar vínculo activo</option>
            {destinatarios.map(x => <option key={x.valor} value={x.valor}>{x.nombre}</option>)}
          </select>
        </label>
        <label>Asunto
          <input maxLength={200} required value={titulo} onChange={e => setTitulo(e.target.value)} />
        </label>
        <label className="pro-full">Descripción
          <textarea rows={4} maxLength={4000} required value={descripcion} onChange={e => setDescripcion(e.target.value)} />
        </label>
        <button disabled={ocupado || !destinatarios.length}>Enviar solicitud</button>
      </form>

      {!destinatarios.length && <p className="help-text">Primero vinculáte con un profesional o estudio.</p>}
      <h3 className="pro-section-space">Mis solicitudes</h3>
      {!solicitudes.length && <p>Todavía no enviaste solicitudes de casos.</p>}
      {solicitudes.map(s => (
        <div className="list-row" key={s.Solicitud_ID}>
          <div>
            <strong>{s.Titulo}</strong>
            <small>{s.Profesional_Nombre || s.Estudio_Nombre} · {new Date(s.Fecha_Solicitud).toLocaleDateString('es-AR')}</small>
            <p>{s.Descripcion}</p>
          </div>
          <span className={`estado estado--${s.Estado}`}>{s.Estado}</span>
        </div>
      ))}
      <p className="help-text">Una solicitud aceptada no es un expediente. El profesional deberá crear el caso.</p>
    </section>
  );
}

export default ClienteSolicitudes;
