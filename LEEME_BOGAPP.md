# BOGAPP — actualización de backend, autenticación y Admin

## 1. Preparar el proyecto (sin modificar tu base de datos)

1. Crear `BACKEND/.env` usando `BACKEND/.env.example` y completar DB_HOST, DB_USER, DB_PASSWORD, DB_NAME.
2. Generar un secreto seguro para JWT: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` y pegarlo como `JWT_SECRET`.
3. Desde `BACKEND` ejecutar `npm install` y `node index.js` (o `npx nodemon index.js`).
4. Desde `FRONTEND/BOGAPP-FRONT` ejecutar `npm install`. El frontend agregó Recharts y react-is a `package.json`; **el lockfile se actualizará en tu equipo**. Luego `npm run dev`.
5. No incluyo el `.env` real que venía en el ZIP por seguridad. Tampoco incluyo `node_modules`.

## 2. Crear o actualizar el primer Super Admin

Desde la terminal PowerShell, en `BACKEND`, establecer variables temporales:

```powershell
$env:ADMIN_EMAIL="admin@bogapp.test"
$env:ADMIN_PASSWORD="UNA_CONTRASENA_NUEVA_DE_12_CARACTERES_O_MAS"
node scripts/crearAdmin.js
Remove-Item Env:ADMIN_PASSWORD
Remove-Item Env:ADMIN_EMAIL
```

- El script crea `ADMIN_BOGAPP` si ese correo no existe. Si ya es `ADMIN_BOGAPP`, actualiza su contraseña y conserva el ID.
- No crea un nuevo administrador desde el frontend ni se permite registrarse como ADMIN_BOGAPP.
- IMPORTANTE: el administrador viejo que tenga `Password_Hash = NULL` no podrá entrar hasta ejecutar este script con SU MISMO EMAIL.

## 3. Autenticación y roles

- POST `/users` **público**: registra `CLIENTE` o `PROFESIONAL` con bcrypt, `Matricula` opcional para profesional.
- POST `/auth/login`: recibe `{ "Email": "...", "Password": "..." }` y coloca cookie HttpOnly.
- GET `/auth/me`: devuelve el usuario autenticado. POST `/auth/logout`: borra cookie.
- El JWT guarda solo el ID; Express consulta `Usuarios` en cada solicitud protegida para confirmar que la cuenta siga activa y con el rol correcto.
- El frontend usa `credentials: "include"`; **ya no usa `usuarioDemo` ni IDs hardcodeados**.
- Los usuarios que tenían contraseñas NULL necesitarán registrarse de nuevo o establecer una contraseña desde administración local.

## 4. Rutas de BOGAPP (mantuvimos nombres existentes)

| Método | URL | Acceso |
|---|---|---|
| GET | `/test` | Público, desarrollo |
| POST | `/users` | Público, CLIENTE o PROFESIONAL |
| GET | `/users` y `/users/:id` | Super Admin |
| PUT, DELETE | `/users/:id` | Super Admin |
| GET | `/clientes`, `/profesionales` | Super Admin |
| GET | `/estudios` | Con sesión (Admin todos; Profesional propios; Cliente aprobados) |
| GET | `/estudios/mis` | Profesional (vínculos activos) |
| GET | `/estudios/:id` | Con sesión, según rol/vínculo |
| POST | `/estudios` | Profesional (Creado_Por_ID del token) |
| PUT | `/estudios/:id` | Super Admin o ADMIN_ESTUDIO activo |
| PATCH | `/estudios/:id/estado` | Super Admin (Revisado_Por_ID del token) |
| DELETE | `/estudios/:id` | Super Admin, incluso aprobados |
| GET | `/estudios/:id/profesionales` | Super Admin o ADMIN_ESTUDIO activo |
| POST | `/estudios/:id/profesionales` | Super Admin o ADMIN_ESTUDIO activo, agregar profesional existente |
| DELETE | `/estudios/:id/profesionales/:usuarioId` | Super Admin o ADMIN_ESTUDIO activo, desvincular si no tiene referencias de casos |
| GET | `/admin/resumen` | Super Admin, métricas dashboard |

## 5. Vistas

- `/login`, `/register` (cliente), `/register/profesional` (profesional).
- `/` dashboard Admin; `/admin/estudios` lista ordenada por creación, buscador, detalle, profesionales, editar y borrar;
  `/admin/solicitudes` aprobar/rechazar; `/admin/usuarios` editar/borrar; `/admin/limpieza` limpiar rechazados.
- `/profesional`: ver estudios propios, solicitar estudio; `/cliente`: pantalla actual pendiente de la siguiente fase.
- Dashboard con Recharts: gráfico por estado de estudios y gráfico de usuarios clientes/profesionales.

## 6. IMPORTANTE — borrados y transacciones

- El Super Admin puede borrar estudios **incluso APROBADOS**. Esto elimina sus relaciones, casos, avances y documentos METADATOS (si posteriormente se cargan archivos físicos será necesario limpiar también el disco).
- Eliminar usuarios elimina también los estudios que hayan creado, los casos donde son cliente/creador/responsable y datos dependientes. **No se puede deshacer**. Hay doble confirmación en React.
- Para evitar bloqueos por claves foráneas la eliminación se realiza dentro de una transacción, en el orden adecuado.
- Las cuentas `ADMIN_BOGAPP` no se borran ni modifican desde el panel, para evitar perder el acceso. Es intencional.
- La edición de usuarios NO cambia su tipo de cuenta: en BOGAPP una misma persona que quiera ser profesional y cliente debe tener cuentas separadas.
- La acción de desvincular un profesional puede ser rechazada si tiene casos relacionados; primero se deben reasignar (módulo pendiente).

## 7. Pruebas recomendadas antes de presentar

1. Preparar Super Admin desde script; ingresar con él y verificar `/auth/me` (cookies en navegador).
2. Registrar un profesional desde `/register/profesional`; comprobar en MySQL que `Password_Hash` no sea la contraseña literal.
3. Ingresar como profesional; solicitar estudio; cerrar sesión; ingresar como Admin y aprobarlo.
4. Abrir `/admin/estudios`, buscar por nombre, seleccionar el estudio, editar datos y ver el profesional creador.
5. Vincular otro profesional; luego desvincularlo si no hay casos relacionados.
6. Abrir `/admin/usuarios`, editar un cliente de prueba y comprobar en MySQL. Probar borrado **solo con registros de prueba**.
7. Entrar como profesional y como cliente a `/` o `/admin/usuarios` y confirmar que React redirige. Además, probar la API sin cookie: debe responder 401; con cookie de CLIENTE a `/users`: 403.
8. Probar logout y recargar; las vistas protegidas ya no deben permitir la sesión.

## 8. Lo que falta (no simular como terminado)

- CRUD Casos, avances, documentos/archivos, permisos de caso, clientes-vínculos y especializaciones.
- Verificar totalmente la integridad de transacciones y relaciones con la definición exacta de tu MySQL local; el ZIP **no incluía el `.sql`**.
- Para despliegue real: HTTPS, CORS HTTPS del sitio, protección CSRF, rate limit de login, recuperación de contraseña, tests de integración y estrategia de gestión/borrado de documentos físicos.
- Si el `.env` original se compartió o subió a un repositorio, rotar su contraseña y cualquier otra credencial expuesta.

## 9. Comandos de prueba

```bash
# BACKEND
npm install
node index.js

# FRONTEND/BOGAPP-FRONT
npm install
npm run dev
```

La ejecución completa contra MySQL se debe probar en tu equipo: este entorno no dispone de tu servidor SQL ni permite instalar nuevas dependencias npm desde internet.
