import { useState } from 'react';
import { enviarJSON } from '../api';
import { mostrarAlerta } from '../utils/alertas';

// Se reutiliza en Cliente, Profesional y Admin: el backend identifica al usuario por su sesión.
function CambiarClave() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    setError(''); setEnviando(true);
    try {
      await enviarJSON('PUT', '/auth/password', { actual, nueva });
      setActual(''); setNueva('');
      await mostrarAlerta('Contraseña actualizada');
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  return <section className="panel-card">
    <h2>Cambiar contraseña</h2>
    <p>Ingresá tu contraseña actual antes de elegir una nueva.</p>
    <form className="pro-profile-form" onSubmit={guardar}>
      <label>Contraseña actual
        <input type={mostrar ? 'text' : 'password'} value={actual} onChange={e => setActual(e.target.value)}
          autoComplete="current-password" required />
      </label>
      <label>Nueva contraseña (mínimo 8 caracteres)
        <input type={mostrar ? 'text' : 'password'} value={nueva} onChange={e => setNueva(e.target.value)}
          minLength={8} autoComplete="new-password" required />
      </label>
      <label className="pro-check"><input type="checkbox" checked={mostrar} onChange={e => setMostrar(e.target.checked)} /> Mostrar contraseñas</label>
      <button disabled={enviando}>{enviando ? 'Guardando...' : 'Actualizar contraseña'}</button>
    </form>
    {error && <p className="error-text" role="alert">{error}</p>}
  </section>;
}
export default CambiarClave;
