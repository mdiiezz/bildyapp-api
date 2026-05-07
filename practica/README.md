# BildyApp API — Práctica Final

API REST desarrollada con Node.js, Express y MongoDB para la digitalización y gestión de albaranes.

La aplicación permite gestionar usuarios, compañías, clientes, proyectos y albaranes. También incluye generación de PDFs, firma de albaranes, subida de archivos a Cloudinary, envío de emails de verificación, notificación de errores 5XX a Slack, documentación Swagger, WebSockets, tests de integración, Docker y CI con GitHub Actions.

---

## Tecnologías usadas

- Node.js 22
- Express
- MongoDB + Mongoose
- JWT
- Zod
- Swagger / OpenAPI 3.0
- Jest + Supertest + mongodb-memory-server
- Socket.IO
- Multer
- Sharp
- Cloudinary para almacenamiento de firmas y PDFs
- PDFKit
- Nodemailer / Mailtrap para envío de códigos de verificación
- Slack Incoming Webhook para errores 5XX
- Helmet
- CORS
- Rate limit
- Docker
- Docker Compose
- GitHub Actions

---

## Instalación en local

Clonar el proyecto e instalar dependencias:

```bash
npm install
```

Crear el archivo `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

Configurar las variables necesarias en `.env`.

Arrancar en modo desarrollo:

```bash
npm run dev
```

La API arranca por defecto en:

```text
http://localhost:3000
```

---

## Documentación Swagger

La documentación Swagger está disponible en:

```text
http://localhost:3000/api-docs
```

Desde Swagger se pueden consultar los endpoints principales de usuarios, clientes, proyectos, albaranes y dashboard.

---

## Health check

Endpoint:

```http
GET /health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "db": "connected",
  "uptime": 12.34,
  "timestamp": "2026-05-03T00:00:00.000Z"
}
```

Este endpoint permite comprobar que el servidor está activo y que la conexión con MongoDB funciona correctamente.

---

## Variables de entorno

El archivo `.env.example` incluye todas las variables necesarias para ejecutar la aplicación.

Variables principales:

```env
NODE_ENV=development
PORT=3000
PUBLIC_URL=http://localhost:3000
CORS_ORIGIN=*

DB_URI=mongodb://localhost:27017/bildyapp

JWT_SECRET=cambia_esto_por_un_secreto_largo_de_32_caracteres
JWT_ACCESS_EXPIRES_IN=15m
REFRESH_TOKEN_DAYS=7

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SLACK_WEBHOOK=

MAIL_HOST=
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=
MAIL_PASS=
MAIL_FROM=BildyApp <no-reply@bildyapp.local>
```

La aplicación soporta:

- MongoDB local, MongoDB Atlas o MongoDB mediante Docker Compose.
- Cloudinary para almacenar firmas y PDFs firmados.
- Mailtrap u otro SMTP compatible con Nodemailer para enviar códigos de verificación.
- Slack Incoming Webhook para notificar errores 5XX.

En desarrollo, si Cloudinary no está configurado, la aplicación puede usar almacenamiento local en `uploads/` como fallback. Si el email no está configurado, el código de verificación se muestra por consola.

---

## Scripts disponibles

```bash
npm run dev
```

Arranca la API en modo desarrollo con `node --watch`.

```bash
npm start
```

Arranca la API en modo normal.

```bash
npm test
```

Ejecuta los tests de integración.

```bash
npm run test:watch
```

Ejecuta los tests en modo watch.

```bash
npm run test:coverage
```

Ejecuta los tests y genera el informe de cobertura.

---

## Docker

El proyecto incluye `Dockerfile` multi-stage y `docker-compose.yml`.

Construir imagen Docker:

```bash
docker build -t bildyapp-api .
```

Levantar API + MongoDB con Docker Compose:

```bash
docker compose up --build
```

Esto levanta:

- API Node.js en `http://localhost:3000`
- MongoDB en `localhost:27017`

Comprobar que funciona:

```text
http://localhost:3000/health
```

Parar los contenedores:

```bash
docker compose down
```

---

## GitHub Actions

El proyecto incluye un workflow de GitHub Actions en:

```text
.github/workflows/test.yml
```

El pipeline se ejecuta en push y pull request, instala dependencias con `npm ci` y ejecuta los tests automáticamente.

---

## Endpoints principales

### Usuario

```text
POST   /api/user/register
PUT    /api/user/validation
POST   /api/user/login
PUT    /api/user/register
PATCH  /api/user/company
PATCH  /api/user/logo
GET    /api/user
POST   /api/user/refresh
POST   /api/user/logout
PUT    /api/user/password
POST   /api/user/invite
DELETE /api/user
```

Funcionalidades principales:

- Registro de usuario.
- Validación de email mediante código.
- Login con JWT.
- Refresh token.
- Logout.
- Actualización de datos personales.
- Creación o asociación de compañía.
- Subida de logo de compañía.
- Cambio de contraseña.
- Invitación de usuarios guest.
- Borrado de usuario.

---

### Clientes

```text
POST   /api/client
GET    /api/client?page=1&limit=10&name=García&sort=-createdAt
GET    /api/client/archived
GET    /api/client/:id
PUT    /api/client/:id
DELETE /api/client/:id?soft=true
PATCH  /api/client/:id/restore
```

Funcionalidades principales:

- Crear cliente.
- Listar clientes con paginación, filtros y ordenación.
- Obtener cliente por ID.
- Actualizar cliente.
- Archivar cliente mediante soft delete.
- Listar clientes archivados.
- Restaurar cliente archivado.
- Evitar CIF duplicado dentro de la misma compañía.

---

### Proyectos

```text
POST   /api/project
GET    /api/project?page=1&limit=10&client=<clientId>&name=Reforma&active=true&sort=-createdAt
GET    /api/project/archived
GET    /api/project/:id
PUT    /api/project/:id
DELETE /api/project/:id?soft=true
PATCH  /api/project/:id/restore
```

Funcionalidades principales:

- Crear proyecto asociado a un cliente.
- Listar proyectos con paginación, filtros y ordenación.
- Obtener proyecto por ID.
- Actualizar proyecto.
- Archivar proyecto mediante soft delete.
- Listar proyectos archivados.
- Restaurar proyecto archivado.
- Evitar códigos de proyecto duplicados dentro de la misma compañía.

---

### Albaranes

```text
POST   /api/deliverynote
GET    /api/deliverynote?page=1&limit=10&project=<projectId>&format=hours&signed=false&sort=-workDate
GET    /api/deliverynote/:id
GET    /api/deliverynote/pdf/:id
PATCH  /api/deliverynote/:id/sign
DELETE /api/deliverynote/:id
```

Funcionalidades principales:

- Crear albaranes de horas.
- Crear albaranes de material.
- Listar albaranes con paginación y filtros.
- Obtener albarán por ID.
- Generar PDF del albarán.
- Firmar albarán con imagen.
- Optimizar firma con Sharp.
- Subir firma y PDF firmado a Cloudinary.
- Bloquear el borrado de albaranes ya firmados.
- Permitir borrar albaranes no firmados.

El endpoint de firma usa `multipart/form-data` con el campo:

```text
signature
```

Ejemplo:

```http
PATCH /api/deliverynote/:id/sign
Content-Type: multipart/form-data

signature=<archivo imagen>
```

---

### Dashboard

```text
GET /api/dashboard
```

Devuelve estadísticas mediante aggregation pipeline:

- Albaranes por mes.
- Horas por proyecto.
- Materiales por cliente.

---

## WebSockets

El proyecto usa Socket.IO para emitir eventos en tiempo real.

La conexión requiere JWT en el handshake:

```javascript
const socket = io('http://localhost:3000', {
  auth: { token: accessToken }
});
```

Cada usuario autenticado se une automáticamente a la room de su `company._id`.

Eventos emitidos por compañía:

```text
client:new
project:new
deliverynote:new
deliverynote:signed
```

Esto permite notificar en tiempo real la creación de clientes, proyectos, albaranes y la firma de albaranes.

---

## Tests

Los tests están implementados con:

- Jest
- Supertest
- mongodb-memory-server

Ejecutar tests:

```bash
npm test
```

Ejecutar cobertura:

```bash
npm run test:coverage
```

Los tests usan `mongodb-memory-server`, por lo que no necesitan una base de datos MongoDB externa.

La cobertura de la práctica supera el 70 % requerido.

---

## Seguridad y validaciones

La API incluye:

- Autenticación JWT.
- Refresh tokens.
- Hash de contraseñas con bcryptjs.
- Validación de datos con Zod.
- Manejo centralizado de errores.
- Helmet.
- CORS configurable.
- Rate limit.
- Sanitización básica contra operadores NoSQL.
- Control de tamaño de archivos.
- Control de tipo de archivo.
- Soft delete para clientes y proyectos.
- Bloqueo de borrado para albaranes firmados.
- Notificación de errores 5XX mediante Slack.

---

## Integraciones externas probadas

### Cloudinary

La firma del albarán se sube como imagen optimizada `.webp`.

El PDF firmado se sube como recurso `.pdf`.

Ejemplo de resultado esperado:

```json
{
  "signatureUrl": "https://res.cloudinary.com/.../firma.webp",
  "pdfUrl": "https://res.cloudinary.com/.../albaran.pdf"
}
```

### Mailtrap / SMTP

Al registrar un usuario, la API envía un email con el código de verificación.

En desarrollo se puede usar Mailtrap como buzón de pruebas.

### Slack

Los errores 5XX se envían a un canal de Slack mediante Incoming Webhook.

El mensaje incluye:

- timestamp
- método HTTP
- ruta
- status code
- mensaje de error
- stack

---

## Pruebas manuales con REST Client

La carpeta `requests/` incluye un archivo `.http` para probar manualmente la API desde VS Code REST Client.

Antes de usarlo, hay que completar los placeholders:

```http
@token = PEGA_AQUI_EL_ACCESS_TOKEN
@clientId = PEGA_AQUI_CLIENT_ID
@projectId = PEGA_AQUI_PROJECT_ID
@deliveryNoteId = PEGA_AQUI_DELIVERYNOTE_ID
```

No se deben subir tokens reales ni refresh tokens al repositorio.

---

## Estructura del proyecto

```text
bildyapp-api/
├── .github/
│   └── workflows/
├── requests/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── socket/
│   ├── utils/
│   ├── validators/
│   ├── app.js
│   └── index.js
├── tests/
├── uploads/
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── jest.config.js
├── package.json
├── package-lock.json
└── README.md
```

---

## Seguridad de entrega

No subir nunca:

```text
.env
node_modules/
coverage/
uploads/* reales
tokens reales en archivos .http
credenciales de MongoDB Atlas
credenciales de Cloudinary
credenciales SMTP
webhooks de Slack
```

Sí subir:

```text
.env.example
package.json
package-lock.json
Dockerfile
docker-compose.yml
.github/workflows/test.yml
jest.config.js
README.md
src/
tests/
requests/bildyapp-final.http
requests/logo.png
uploads/.gitkeep si existe
```

---

## Comprobaciones finales recomendadas

Antes de entregar:

```bash
npm test
npm run test:coverage
docker build -t bildyapp-api .
docker compose up --build
```

Después de probar Docker Compose:

```bash
docker compose down
```

También comprobar:

```text
http://localhost:3000/health
http://localhost:3000/api-docs
```

---

## Notas

El archivo `.env.example` contiene únicamente variables de ejemplo. Las credenciales reales deben ir en `.env`, que está excluido por `.gitignore`.

La carpeta `uploads/` se usa como fallback local en desarrollo cuando Cloudinary no está configurado. Los archivos reales generados en `uploads/` no deben subirse al repositorio.
