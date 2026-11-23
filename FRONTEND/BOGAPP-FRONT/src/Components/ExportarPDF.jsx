import { useState } from 'react';
import { exportarDashboard } from '../utils/pdfDashboard';
import { mostrarAlerta } from '../utils/alertas';

function ExportarPDF({ reporteRef, titulo, periodo }) {
  const [exportando, setExportando] = useState(false);
  async function generar() {
    setExportando(true);
    try { await exportarDashboard(reporteRef, titulo, periodo); }
    catch (e) { await mostrarAlerta('No se pudo generar el PDF: ' + e.message, 'error'); }
    finally { setExportando(false); }
  }
  return <button type="button" onClick={generar} disabled={exportando}>{exportando ? 'Generando PDF...' : '↓ Descargar informe PDF'}</button>;
}
export default ExportarPDF;
