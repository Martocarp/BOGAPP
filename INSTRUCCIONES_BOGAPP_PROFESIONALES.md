# BOGAPP · Etapa profesional (React + Express + MySQL)

Versión construida a partir del ZIP entregado el 17/11/2026. Se conserva el panel Admin, las rutas previas, la autenticación bcrypt/JWT y los nombres de las páginas actuales. **No incluye `node_modules/` ni archivos `.env` con secretos.**

## IMPORTANTE: antes de instalar

1. Hacé un respaldo del proyecto anterior y **exportá `bogapp` desde MySQL Workbench** (Administration → Data Export → `bogapp` → Export to Self-Contained File). No corras el SQL viejo que borra la base.
2. Mantené tu `BACKEND/.env` anterior (no viene en este ZIP). Si no lo tenés, copiá `BACKEND/.env.example` a `.env`, completá `DB_*`, `JWT_SECRET` y `FRONTEND_ORIGIN`. No publiques `.env`.
3. Abrí una terminal en `BACKEND` y ejecutá:

   ```bash
   npm install
   npm run migrar:profesionales
   npm start
   ```

   **La migración es obligatoria** y se corre una sola vez (es reejecutable). El script crea catálogos/relaciones nuevas, agrega el origen de las invitaciones y permite `Casos.Estudio_ID = NULL` para expedientes particulares. Por estar relacionado con claves foráneas existentes, conviene tener copia de la base antes. No borra los registros de usuarios ni estudios.

4. En otra terminal, desde `FRONTEND/BOGAPP-FRONT`:

   ```bash
   npm install
   npm run dev
   ```

   **Usá `npm install` y no `npm ci` la primera vez:** se añadieron dependencias y el `package-lock.json` original se actualizará al instalarlas. Después podés commitear ambos lockfiles actualizados.
5. Conservá el mismo correo y contraseña del Super Admin. No es necesario crear otro.

## Librerías nuevas

- Backend: **multer** para carga de PDF y XLSX (límite 8 MB, almacenamiento privado). Se mantiene `bcryptjs`, `mysql2`, JWT, Express y CORS.
- Frontend: **jspdf** y **html-to-image** para exportar gráficos Recharts a PDF. Recharts ya estaba instalado.

## Pantallas profesionales (con menú 30/70)

- `/profesional`: Dashboard (CHARTS GENERAL / RANGOS) y exportar informe PDF.
- `/profesional/estudios`: estudios activos, crear estudio, invitaciones y solicitudes de incorporación.
- `/profesional/clientes`: clientes particulares y clientes del estudio, buscar por correo, invitar, aprobar solicitudes.
- `/profesional/casos`: CRUD de expedientes del espacio seleccionado.
- `/profesional/casos/:id`: detalle del caso con información, avances, documentos y colaboradores del estudio.
- `/profesional/integrantes`: integrantes, invitaciones, solicitudes y desvinculación (admin estudio).
- `/profesional/configuracion`: datos y especializaciones del estudio (solo ADMIN_ESTUDIO).
- `/profesional/perfil`: matrícula, biografía, especializaciones del abogado y CV en PDF.

**Selector de espacio:** `Mi actividad particular` o uno de los estudios aprobados donde el profesional tiene vínculo ACTIVO. El backend comprueba los permisos y no se guía por el selector de React.

**Accesos:** ADMIN_ESTUDIO ve y administra todos los casos/clientes de su estudio; ABOGADO ve casos propios o donde colabora; independiente ve casos particulares propios. En casos particulares no se necesita un estudio jurídico.

## Pruebas recomendadas (en este orden)

### 1. Casos particulares

1. Ingresá como Profesional A y seleccioná `Mi actividad particular`.
2. Registrá un CLIENTE B desde `/register`, iniciá sesión como el profesional e invitalo desde `Clientes` usando su email.
3. Entrá como CLIENTE B y aceptá la invitación en `/cliente`.
4. Volvé a Profesional A, abrí `/profesional/casos`, creá un expediente para el cliente vinculado.
5. Cambiá estado de ABIERTO a EN_PROCESO, cargá un avance interno y subí un PDF de prueba.
6. Publicá el avance y, si corresponde, subí otro PDF con visibilidad CLIENTE.
7. Abrí `/cliente` como B: solo debe ver avances publicados y archivos CLIENTE.

### 2. Casos del estudio

1. Abrí un estudio aprobado del que sos `ADMIN_ESTUDIO` desde el selector del menú.
2. Pedile al CLIENTE B que solicite vinculación a ese estudio desde `/cliente`.
3. Como ADMIN_ESTUDIO, aceptá la solicitud en `Clientes` (estado ACTIVO).
4. Creá un expediente para ese cliente. Podés asignar responsable a un profesional activo del estudio.
5. Agregá colaboradores en la pestaña del expediente. Un ABOGADO solo ve sus casos asignados o aquellos donde colabora.
6. Subí un PDF o XLSX y descargalo. El archivo **no** se sirve desde una carpeta pública.

### 3. Especializaciones y CV

1. En `Mi perfil / CV`, seleccioná varias especializaciones, editá la biografía y guardá.
2. Subí un PDF menor a 8 MB; verificá descargarlo y reemplazarlo.
3. Como ADMIN_ESTUDIO abrí `Configuración estudio` y marcá las especializaciones del estudio.

### 4. Dashboard e informe PDF

1. Entrá en `CHARTS GENERAL`: deberían mostrarse casos, clientes, avances, documentos y dos gráficos con Recharts.
2. Abrí `RANGOS`, elegí Desde/Hasta y aplicá el filtro: los casos se filtran por `Fecha_Apertura`.
3. Presioná `Descargar informe PDF`, abrí el archivo desde Descargas y comprobá que tenga gráficos y fecha/rango.
4. También podés descargar un informe en el Dashboard del Super Admin.

### 5. Regresión del Admin

- Comprobar login, aprobar estudio, lista/búsqueda/edición/borrado, profesionales vinculados, usuarios y descarga del PDF del dashboard.
- Probar eliminaciones **solo con registros ficticios**. En la nueva versión se eliminan también registros y archivos asociados.

## Endpoints nuevos destacados

| Método | URL | Uso |
|---|---|---|
| GET/PUT | `/profesional/perfil` | Perfil profesional |
| POST/GET/DELETE | `/profesional/perfil/cv` | CV PDF |
| GET | `/especializaciones` | Catálogo |
| GET/PUT | `/estudios/:id/especializaciones` | Áreas del estudio |
| GET | `/profesional/dashboard?espacio=particular` | Estadísticas particulares |
| GET | `/profesional/dashboard?espacio=estudio&estudioId=1&desde=2026-11-01&hasta=2026-11-17` | Estadísticas por estudio/rango |
| GET/POST | `/casos` | Listar o crear expedientes |
| GET/PUT/DELETE | `/casos/:id` | Detalle, editar o borrar |
| GET/POST | `/casos/:id/avances` | Ver y registrar avances |
| PATCH | `/casos/:id/avances/:avanceId/publicar` | Compartir avance |
| GET/POST | `/casos/:id/documentos` | Listar y subir PDF/XLSX |
| GET | `/casos/:id/documentos/:docId/descargar` | Descarga autorizada |
| DELETE | `/casos/:id/documentos/:docId` | Eliminar documento |
| GET/POST/DELETE | `/casos/:id/abogados` | Colaboradores (DELETE usa `/:abogadoId`) |
| GET | `/profesional/clientes` | Clientes según espacio |
| POST | `/profesional/clientes/invitar` | Invitar cliente particular |
| POST | `/profesional/estudios/:id/clientes/invitar` | Invitar cliente al estudio |
| GET | `/vinculos/mis` | Vinculaciones del cliente |
| POST | `/vinculos/solicitar-estudio` | Solicitud del cliente al estudio |
| PATCH | `/vinculos/cliente/estudios/:estudioId` | Aceptar invitación del estudio |
| GET | `/profesional/invitaciones` | Solicitudes/invitaciones del profesional |
| POST | `/profesional/estudios/:id/invitar` | Invitar colega |
| PATCH | `/profesional/invitaciones/:id` | Aceptar invitación de estudio |

## Reglas y límites de V1

- PDF y XLSX se guardan bajo `BACKEND/private_uploads/`, fuera de `public/`, con nombre aleatorio y acceso autenticado por endpoint. La DB guarda el nombre original y ruta interna. No subas esa carpeta a Git.
- Se verifica extensión y firma/cabecera básica del archivo y se limita el tamaño, pero **no se realiza análisis antivirus**. Para un producto público real habría que fortalecer el análisis de archivos y la protección CSRF/rate-limit.
- Los currículums permanecen privados; la opción de compartirlos prepara la futura búsqueda de profesionales, **no publica un enlace público aún**.
- La verificación de matrícula y aprobación previa de profesionales queda para V2, tal como decidimos.
- Chat, notificaciones, calendario avanzado, auditoría y búsqueda avanzada también quedan para V2.
- El portal Cliente fue ampliado mínimamente para **aceptar invitaciones, solicitar vínculos y ver casos/autorizaciones**, no es aún un frontend cliente definitivo.
- **No se ha podido ejecutar un test end-to-end con tu MySQL local** desde este entorno. Se verificó la sintaxis de todos los `.js`, las rutas/importaciones locales y el balance de elementos JSX. Es imprescindible ejecutar estas pruebas en tu equipo.
- Recordatorio: aun con bcrypt/JWT, antes de exponer una app jurídica real a Internet corresponde una auditoría de seguridad y protección de datos.

## Recuperación de problemas frecuentes

- Error «No encuentro `Casos.Estudio_ID`»: tu base no coincide con el modelo relacional actual de BOGAPP. Pasame el resultado de `SHOW CREATE TABLE Casos;` y lo adaptamos; **no ejecutes un `DROP DATABASE`**.
- Error «Falta JWT_SECRET»: conservá el `.env` que ya funciona y agregá la clave.
- Error «CORS»: comprobá `FRONTEND_ORIGIN` con la URL mostrada por Vite.
- Error «No se pudo cargar .../profesional/perfil»: ejecutá `npm run migrar:profesionales` antes de arrancar.
- Si el ZIP no tiene `node_modules`: es intencional; ejecutar `npm install` en ambas carpetas.
