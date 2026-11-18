import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
// Exporta el contenido visible (incluidos los SVG de Recharts) a un PDF A4.
export async function exportarDashboard(ref, titulo, periodo) {
  if (!ref.current) throw new Error('El dashboard todavía no está listo');
  const png = await toPng(ref.current, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true });
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const ancho = pdf.internal.pageSize.getWidth();
  const alto = pdf.internal.pageSize.getHeight();
  const usable = ancho - 28;
  const img = new Image();
  img.src = png;
  await img.decode();
  const altoImagen = usable * (img.naturalHeight / img.naturalWidth);
  const altoDisponible = alto - 50;
  const paginas = Math.ceil(altoImagen / altoDisponible);
  for (let pagina = 0; pagina < paginas; pagina++) {
    if (pagina) pdf.addPage();
    // El contenido capturado se desplaza entre páginas; el encabezado se dibuja por encima.
    pdf.addImage(png, 'PNG', 14, 32 - pagina * altoDisponible, usable, altoImagen);
    pdf.setFillColor(23, 44, 69); pdf.rect(0, 0, ancho, 20, 'F');
    pdf.setFillColor(255,255,255);pdf.rect(0, 20, ancho, 10, 'F');
    pdf.setFont('helvetica','bold'); pdf.setFontSize(14); pdf.setTextColor(255,255,255);
    pdf.text('BOGAPP · INFORME DE ESTADÍSTICAS', 14, 12);
    pdf.setFontSize(9); pdf.setTextColor(50,70,90);
    pdf.text(`${titulo} · ${periodo}`,14,26);
    // Cubrir la zona inferior de cada hoja y poner numeración.
    pdf.setFillColor(255,255,255);pdf.rect(0, alto-17, ancho, 17, 'F');
    pdf.setDrawColor(222,230,238);pdf.line(14,alto-17,ancho-14,alto-17);
    pdf.setTextColor(80,98,116);pdf.setFontSize(9);
    pdf.text(`Generado: ${new Date().toLocaleString('es-AR')} · Página ${pagina+1}/${paginas}`,14,alto-10);
  }
  const nombre = `BOGAPP_informe_${new Date().toISOString().slice(0,10)}.pdf`;
  pdf.save(nombre);
}
