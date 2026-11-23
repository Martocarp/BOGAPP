import { useEffect, useState } from 'react';
import usarEspacio from './usarEspacio';
import { api, enviarJSON } from '../../api';
import { mostrarAlerta } from '../../utils/alertas';

function ProConfiguracion() {
  const { espacio, estudioId, rol, estudio, cargarEstudios } = usarEspacio();
  const [form, setForm] = useState({ Nombre: '', Direccion: '', Telefono: '' }); const [catalogo, setCatalogo] = useState([]); const [ids, setIds] = useState([]);
  const [error, setError] = useState(''); const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    if (!estudioId) return;
    setForm({ Nombre: estudio?.Nombre || '', Direccion: estudio?.Direccion || '', Telefono: estudio?.Telefono || '' });
    api(`/estudios/${estudioId}/especializaciones`).then(rows => setIds(rows.map(x => x.Especializacion_ID))).catch(e => setError(e.message));
    api('/especializaciones').then(setCatalogo).catch(e => setError(e.message));
  }, [estudioId, estudio?.Nombre, estudio?.Direccion, estudio?.Telefono]);
  async function guardar(e) {    
e.preventDefault(); setOcupado(true); setError(''); try {
      await enviarJSON('PUT', `/estudios/${estudioId}`, form);
      await enviarJSON('PUT', `/estudios/${estudioId}/especializaciones`, { especializaciones: ids });
      cargarEstudios(); await mostrarAlerta('Estudio actualizado correctamente');
    } catch (e) { setError(e.message); } finally { setOcupado(false); }  
}
  if (espacio !== 'estudio') return <p>Seleccioná un estudio para configurarlo.</p>;
  if (rol !== 'ADMIN_ESTUDIO') return <p>Solo el administrador del estudio puede cambiar sus datos.</p>;
  return <section className="admin-section"><h1>Configuración del estudio</h1><p>Datos públicos y especializaciones.</p>
    {error && <p className="error-text">{error}</p>}
    <section className="panel-card"><form onSubmit={guardar} className="pro-profile-form">
      <label>Nombre<input value={form.Nombre} onChange={e => setForm(p => ({ ...p, Nombre: e.target.value }))} required /></label>
      <label>Dirección<input value={form.Direccion} onChange={e => setForm(p => ({ ...p, Direccion: e.target.value }))} /></label>
      <label>Teléfono<input value={form.Telefono} onChange={e => setForm(p => ({ ...p, Telefono: e.target.value }))} /></label>
      <div><h2>Especializaciones del estudio</h2><div className="pro-specialties">{catalogo.map(t => <label key={t.Especializacion_ID}>
        <input type="checkbox" checked={ids.includes(t.Especializacion_ID)} onChange={e => setIds(v => e.target.checked ? [...v, t.Especializacion_ID] : v.filter(x => x !== t.Especializacion_ID))} />{t.Nombre}</label>)}</div></div>
      <button disabled={ocupado}>Guardar estudio</button>
    </form></section>
  </section>;
}
export default ProConfiguracion;
