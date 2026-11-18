const multer = require('multer');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const BASE = path.resolve(__dirname, '../private_uploads');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 5 },
});
function validar(file, tipos) {
  if (!file?.buffer || !file.size) throw new Error('Seleccioná un archivo');
  const ext = path.extname(file.originalname).toLowerCase();
  if (!tipos.includes(ext)) throw new Error('Formato de archivo no permitido');
  const b = file.buffer;
  if (ext === '.pdf' && b.subarray(0, 5).toString() !== '%PDF-') throw new Error('El archivo no tiene formato PDF válido');
  if (ext === '.xlsx' && (!(b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) || !b.includes(Buffer.from('xl/workbook.xml')) || !b.includes(Buffer.from('[Content_Types].xml')))) {
    throw new Error('El archivo no tiene formato XLSX válido');
  }
  return ext;
}
async function guardar(file, tipos) {
  const ext = validar(file, tipos);
  await fs.mkdir(BASE, { recursive: true });
  const nombre = randomUUID() + ext;
  await fs.writeFile(path.join(BASE, nombre), file.buffer, { flag: 'wx' });
  return nombre;
}
function ruta(nombre) {
  if (!/^[a-f0-9-]{36}\.(pdf|xlsx)$/.test(nombre || '')) throw new Error('Archivo inválido');
  return path.join(BASE, nombre);
}
async function borrar(nombre) { if (nombre) await fs.unlink(ruta(nombre)).catch(e => { if (e.code !== 'ENOENT') console.error('No se pudo borrar archivo:', e.message); }); }
function descargar(res, nombre, original) {
  const archivo = ruta(nombre);
  res.download(archivo, path.basename(original || 'documento.pdf'), err => {
    if (err && !res.headersSent) res.status(404).json({ message: 'Archivo no disponible' });
  });
}
module.exports = { upload, validar, guardar, borrar, descargar };
