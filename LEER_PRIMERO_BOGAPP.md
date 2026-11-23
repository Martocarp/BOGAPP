# BOGAPP - Instalación y cambios para la presentación

Fecha: 23 de noviembre de 2026. Este es el proyecto completo **sin `node_modules`, sin `BACKEND/.env` y sin archivos privados de usuarios**.

## 1. Instalación desde el ZIP

1. Extraer en una carpeta nueva, sin sobrescribir la versión anterior que funciona.
2. Copiar tu archivo **`BACKEND/.env` original** a `BACKEND/.env` del proyecto nuevo. Si no tenés uno, copiar `BACKEND/.env.example` y completar los valores reales.
3. Asegurarte de que MySQL esté funcionando y exista tu base `bogapp` con la migración de profesionales previa ya aplicada.
4. Hacer un backup de MySQL desde Workbench. **No borres la base ni las tablas.**
5. Abrir la terminal en `BACKEND` y ejecutar:

   ```bash
   npm install
   npm run migrar:cliente
   npm start
   ```

6. Abrir otra terminal en `FRONTEND/BOGAPP-FRONT` y ejecutar:

   ```bash
   npm install
   npm run dev
   ```

7. Ir a la dirección que indique Vite (normalmente `http://localhost:5173`).

> `npm run migrar:cliente` agrega `Consultas_Casos` y `Solicitudes_Casos` con `CREATE TABLE IF NOT EXISTS`. No borra los datos anteriores. **Es obligatorio** antes de abrir los nuevos módulos. Si nunca corriste la migración profesional anterior, primero ejecutá `npm run migrar:profesionales` y después `npm run migrar:cliente`.

## 2. Qué cambió respecto al ZIP recibido

**Profesional**
- `Mis estudios` ahora tiene tarjetas desplegables con abogados relacionados y sus roles. Para administrar integrantes sigue existiendo la vista `Profesionales`.
- Nueva ruta `/profesional/solicitudes`: permite revisar solicitudes de asuntos nuevos. El abogado particular o el `ADMIN_ESTUDIO` puede aceptarlas o rechazarlas.
- Nueva pestaña `CONSULTAS` en cada expediente: el responsable o administrador responde preguntas del cliente.

**Cliente**
- Conserva el menú lateral y los filtros por botones de especialización.
- Dashboard con novedades publicadas y preguntas sin responder (datos reales de MySQL, no progreso ficticio).
- Dentro de su expediente ve avances, documentos y preguntas. Puede adjuntar **PDF y XLSX (máximo 8 MB)** y eliminar **únicamente** documentos que subió él.
- Sección `Nuevas consultas`: envía una solicitud a un profesional o estudio con vínculo activo. Esa solicitud no abre un expediente automáticamente.

**Backend**
- Nuevos endpoints `/cliente/actividad`, `/cliente/solicitudes` y `/casos/:id/consultas`.
- Nueva migración `BACKEND/migrations/002_portal_cliente.sql` y script ejecutable.
- Los permisos se comprueban en Express/MySQL; el frontend no es una barrera de seguridad.
- El código JS/JSX se ordenó principalmente en espaciado, estructura de funciones y comentarios. No eliminamos validaciones para acortar líneas.

## 3. Pruebas para hacer hoy, en este orden

1. Iniciar sesión como **Super Admin** y comprobar el dashboard, listado de usuarios y estudios.
2. Iniciar sesión como **Profesional**, seleccionar un estudio aprobado, ir a `Mis estudios` y desplegarlo.
3. Seleccionar `Mi actividad particular` y mostrar un expediente de un cliente vinculado.
4. Registrar un avance y publicarlo (así el cliente podrá verlo).
5. Iniciar sesión como **Cliente**, entrar en `Mi dashboard` y luego `Mis expedientes`.
6. Abrir un expediente, descargar un documento, aportar un PDF de prueba y hacer una pregunta.
7. Entrar con el profesional responsable, abrir el mismo caso, elegir `CONSULTAS` y contestar.
8. Entrar como Cliente, elegir `Nuevas consultas` y solicitar un asunto a un vínculo activo.
9. Volver como Profesional a `Solicitudes de casos` y aceptar o rechazar el pedido.
10. Descargar un informe de Recharts a PDF y comprobarlo visualmente.
11. Intentar que el cliente abra una ruta administrativa: debe devolver acceso denegado.

## 4. Qué explica cada archivo nuevo

| Archivo | Función |
|---|---|
| `BACKEND/controllers/clienteController.js` | Novedades, solicitudes nuevas, preguntas y respuestas. |
| `BACKEND/routes/clienteRoutes.js` | URLs HTTP, autenticación y roles de esas funciones. |
| `BACKEND/migrations/002_portal_cliente.sql` | Tablas SQL nuevas. |
| `BACKEND/scripts/migrarPortalCliente.js` | Ejecuta esa migración desde Node.js. |
| `src/pages/cliente/ClienteCasos.jsx` | Expedientes del cliente, documentos, novedades. |
| `src/pages/cliente/ClienteSolicitudes.jsx` | Formulario y listado de solicitudes de nuevos casos. |
| `src/Components/ConsultasCaso.jsx` | Preguntas y respuestas, compartidas entre cliente y profesional. |
| `src/pages/profesional/ProSolicitudes.jsx` | Bandeja de pedidos del profesional. |
| `src/pages/profesional/ProEstudios.jsx` | Desplegable de integrantes por estudio. |

## 5. Qué está comprobado y qué no

- **Comprobado aquí:** análisis sintáctico de archivos JS/JSX, `node --check` en backend, existencia de imports locales y nueve pruebas simuladas de permisos, solicitudes y consultas.
- **No comprobado aquí:** conexión a tu MySQL, migración ejecutada contra tu base, arranque completo de Vite y visualización en navegador. La instalación npm quedó bloqueada por falta de acceso fiable a paquetes en este entorno. Debés verificarlo en tu computadora.

## 6. Para explicar el programa en la defensa

Leé el PDF adjunto **`BOGAPP_guia_defensa_sistema.pdf`**. Explica la arquitectura, la conexión entre frontend y backend, JWT/bcrypt, middlewares, SQL/JOIN, manejo de archivos y generación de PDF.

**Frase clave:** “React envía una petición HTTP a Express, el middleware comprueba la sesión y el controller consulta MySQL mediante mysql2, y devuelve un JSON que React muestra en pantalla”.
