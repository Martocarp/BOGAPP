import { useEffect, useState } from 'react';
import { api, descargarArchivo } from '../../api';
import ConsultasCaso from '../../Components/ConsultasCaso';

// Cliente: consulta las novedades públicas y aporta documentos a SU expediente.

function ClienteCasos({ casos, usuarioId, alActualizar }) {
  const [actual, setActual] = useState(null);
  const [avances, setAvances] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [version, setVersion] = useState(0);

  function cargarDetalle(id) {
    return Promise.all([api(`/casos/${id}/avances`), api(`/casos/${id}/documentos`)])
      .then(([a, d]) => { setAvances(a); setDocumentos(d); })
      .catch(e => setError(e.message));
  }

  useEffect(() => {
    if (actual) cargarDetalle(actual.Caso_ID);
  }, [actual?.Caso_ID, version]);

  async function subir(e) {
    e.preventDefault();
    if (!archivo || !actual) return;

    setOcupado(true);
    setError('');
    try {
      const datos = new FormData();
      datos.append('archivo', archivo);
      await api(`/casos/${actual.Caso_ID}/documentos`, { method: 'POST', body: datos });
      setArchivo(null);
      e.target.reset();
      setVersion(x => x + 1);
      alActualizar();
    } catch (e) { setError(e.message); }
    finally { setOcupado(false); }
  }

  async function quitar(doc) {
    if (!window.confirm('¿Eliminar tu documento de este expediente?')) return;
    setError('');
    try {
      await api(`/casos/${actual.Caso_ID}/documentos/${doc.Documento_ID}`, { method: 'DELETE' });
      setVersion(x => x + 1);
    } catch (e) { setError(e.message); }
  }

  async function descargar(doc) {
    try {
      await descargarArchivo(`/casos/${actual.Caso_ID}/documentos/${doc.Documento_ID}/descargar`, doc.Nombre_Archivo);
    } catch (e) { setError(e.message); }
  }

  return (
    <section className="panel-card">
      <h2>Mis expedientes</h2>
      <p className="help-text">Consultá las novedades publicadas, descargá archivos y aportá tu documentación.</p>
      {error && <p className="error-text" role="alert">{error}</p>}
      {!casos.length && <p>Aún no tenés expedientes.</p>}

      {casos.map(c => (
        <div className="list-row" key={c.Caso_ID}>
          <div>
            <strong>#{c.Caso_ID} · {c.Titulo}</strong>
            <small>{c.Estado.replace('_', ' ')} · Responsable: {c.Responsable_Nombre}</small>
          </div>
          <button onClick={() => setActual(c)}>Ver expediente</button>
        </div>
      ))}

      {actual && (
        <div className="details-panel">
          <div className="section-head">
            <div><h3>{actual.Titulo}</h3><p>{actual.Descripcion}</p></div>
            <button type="button" className="btn-small" onClick={() => setActual(null)}>Cerrar detalle</button>
          </div>

          <h3>Novedades publicadas</h3>
          {!avances.length && <p>El profesional todavía no publicó novedades.</p>}
          {avances.map(a => (
            <div className="list-row" key={a.Avance_ID}>
              <div>
                <strong>{a.Titulo}</strong>
                <p>{a.Descripcion}</p>
                <small>{new Date(a.Fecha_Publicacion || a.Fecha_Creacion).toLocaleDateString('es-AR')}</small>
              </div>
            </div>
          ))}

          <h3>Documentos compartidos</h3>
          {!documentos.length && <p>Sin documentos compartidos.</p>}
          {documentos.map(d => (
            <div className="list-row" key={d.Documento_ID}>
              <div>
                <strong>{d.Nombre_Archivo}</strong>
                <small>{d.Subido_Por_ID === usuarioId ? 'Aportado por vos' : 'Compartido por el profesional'}</small>
              </div>
              <div className="actions">
                <button className="btn-small" onClick={() => descargar(d)}>Descargar</button>
                {d.Subido_Por_ID === usuarioId && (
                  <button className="btn-small btn-danger-outline" onClick={() => quitar(d)}>Eliminar mi archivo</button>
                )}
              </div>
            </div>
          ))}

          {actual.Estado !== 'CERRADO' && (
            <form className="pro-search-form" onSubmit={subir}>
              <label>Aportar documento al expediente (PDF o XLSX, máximo 8 MB)
                <input type="file" className="cliente-archivo" accept=".pdf,.xlsx"
                  onChange={e => setArchivo(e.target.files?.[0] || null)} required />
              </label>
              <button disabled={ocupado || !archivo}>Subir documento</button>
            </form>
          )}
          <ConsultasCaso key={actual.Caso_ID} casoId={actual.Caso_ID} esCliente />
        </div>
      )}
    </section>
  );
}

export default ClienteCasos;
