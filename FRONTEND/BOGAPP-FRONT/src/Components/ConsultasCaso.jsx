import { useEffect, useState } from 'react';
import { api, enviarJSON } from '../api';

// Preguntas y respuestas simples asociadas a UN expediente.
// No es un chat: el cliente pregunta y el responsable responde cuando pueda.

function ConsultasCaso({ casoId, esCliente, puedeResponder = false }) {
  const [consultas, setConsultas] = useState([]);
  const [pregunta, setPregunta] = useState('');
  const [respuestas, setRespuestas] = useState({});
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);

  function cargar() {
    api(`/casos/${casoId}/consultas`).then(setConsultas).catch(e => setError(e.message));
  }

  useEffect(() => { cargar(); }, [casoId]);

  async function ejecutar(accion) {
    setOcupado(true);
    setError('');

    try { await accion(); cargar(); }
    catch (e) { setError(e.message); }
    finally { setOcupado(false); }
  }

  function enviarPregunta(e) {
    e.preventDefault();
    ejecutar(async () => {
      await enviarJSON('POST', `/casos/${casoId}/consultas`, { Pregunta: pregunta });
      setPregunta('');
    });
  }

  function responder(id) {
    ejecutar(async () => {
      await enviarJSON('PATCH', `/casos/${casoId}/consultas/${id}`, { Respuesta: respuestas[id] });
      setRespuestas(prev => ({ ...prev, [id]: '' }));
    });
  }

  return (
    <section className="panel-card">
      <h2>Consultas sobre este expediente</h2>
      <p className="help-text">Las preguntas quedan asociadas al caso y solo las ven sus participantes autorizados.</p>
      {error && <p className="error-text">{error}</p>}

      {esCliente && (
        <form className="pro-section-space" onSubmit={enviarPregunta}>
          <label>Tu pregunta
            <textarea rows={3} maxLength={2000} value={pregunta} required onChange={e => setPregunta(e.target.value)} />
          </label>
          <button disabled={ocupado || !pregunta.trim()}>Enviar consulta</button>
        </form>
      )}

      {!consultas.length && <p>No hay preguntas registradas.</p>}
      {consultas.map(c => (
        <div className="cliente-consulta" key={c.Consulta_ID}>
          <small>{new Date(c.Fecha_Pregunta).toLocaleDateString('es-AR')}</small>
          <p><strong>Pregunta:</strong> {c.Pregunta}</p>

          {c.Respuesta ? <p><strong>Respuesta:</strong> {c.Respuesta}</p> : (
            <>
              <p className="help-text">Pendiente de respuesta</p>
              {puedeResponder && (
                <div className="pro-section-space">
                  <textarea rows={2} maxLength={2000} placeholder="Responder al cliente..."
                    value={respuestas[c.Consulta_ID] || ''}
                    onChange={e => setRespuestas(prev => ({ ...prev, [c.Consulta_ID]: e.target.value }))} />
                  <button disabled={ocupado || !respuestas[c.Consulta_ID]?.trim()}
                    onClick={() => responder(c.Consulta_ID)}>Enviar respuesta</button>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </section>
  );
}

export default ConsultasCaso;
