# EXAMEN — mdiiezz

## Reto

F12 — Los tests que faltan: contratos de error en BildyApp

## Tarea técnica

### Qué problema detecté

El problema era que parte del contrato de errores de la API no estaba cubierto explícitamente por tests. En `practica/jest.config.js` se estaba excluyendo parte del código importante del coverage, especialmente el middleware de errores, la subida de archivos y las rutas de albaranes. Eso hacía que contratos relevantes como `VALIDATION_ERROR`, `DUPLICATE_KEY`, `NOT_FOUND` o `DELIVERYNOTE_ALREADY_SIGNED` no estuvieran documentados mediante pruebas automáticas.

### Cómo lo arreglé

Modifiqué `practica/jest.config.js` para que `src/middleware/error-handler.js`, `src/middleware/upload.js` y `src/routes/deliverynote.routes.js` entraran en la medición de cobertura. Además, añadí el fichero `practica/tests/error-contracts.test.js`, donde pruebo cuatro contratos de error principales: validación de Mongoose, clave duplicada de MongoDB, ruta inexistente y doble firma de un albarán. También añadí dos pruebas extra relacionadas con subida de archivos para cubrir mejor `middleware/upload.js`.

### Por qué mi solución es correcta

La solución no modifica la lógica de producción, solo añade cobertura y tests sobre el comportamiento ya existente. Los tests comprueban el cuerpo de respuesta esperado con aserciones como `toMatchObject`, verificando códigos como `VALIDATION_ERROR`, `DUPLICATE_KEY`, `NOT_FOUND` y `DELIVERYNOTE_ALREADY_SIGNED`. Tras los cambios, `npm test` pasa con 6 suites y 12 tests correctos, y `npm run test:coverage` deja `error-handler.js` en 79.31 %, `upload.js` en 100 % y `deliverynote.routes.js` en 100 %, cumpliendo el mínimo del 70 % pedido.

## Respuestas socráticas

1. En `practica/src/controllers/client.controller.js:11-12` hago una comprobación previa para evitar crear un cliente activo con el mismo CIF dentro de la misma compañía, y en ese caso lanzo un `AppError.conflict` con código `CLIENT_CIF_EXISTS`. Aun así, `err.code === 11000` puede llegar a `practica/src/middleware/error-handler.js:30-33` si la duplicidad la detecta directamente MongoDB, por ejemplo en una condición de carrera: dos peticiones simultáneas intentan crear el mismo CIF, ambas pasan el `findOne`, una inserta primero y la otra falla en el índice único. También podría ocurrir si existe un índice único que no está cubierto por una comprobación manual previa del controlador. En ese caso el handler traduce el error técnico de MongoDB a un contrato HTTP genérico `409 DUPLICATE_KEY`.

2. En `practica/src/middleware/error-handler.js:57` se hace `await sendSlackError(...)` antes de ejecutar `res.status(statusCode).json(response)` en la línea 58. Eso significa que si Slack tarda 5 segundos, el cliente también espera esos 5 segundos aunque la respuesta de error ya esté preparada. Si `sendSlackError` fallase lanzando una excepción no controlada, podría impedir que se envíe la respuesta JSON prevista al cliente. Una alternativa sería lanzar la notificación sin `await` o con `setImmediate`, capturando su error internamente, para que el cliente reciba el 4XX/5XX inmediatamente y el aviso a Slack quede desacoplado del contrato HTTP.

3. En `practica/src/routes/deliverynote.routes.js:23` se aplica `router.use(authMiddleware)`, por lo que todas las rutas de albaranes dependen de que el middleware rellene `req.user`. Si alguien comenta esa línea, el primer test que fallaría en `practica/tests/deliverynote-dashboard-extra.test.js` sería `gestiona albaranes de material, dashboard y borrado de no firmados`. Concretamente fallaría en la creación del primer albarán, donde se hace `POST /api/deliverynote` con token y se espera `201` en `practica/tests/deliverynote-dashboard-extra.test.js:41-54`. Sin `authMiddleware`, el controlador no tendría `req.user`, y `ensureCompany(req.user)` en `practica/src/controllers/deliverynote.controller.js:25` no podría obtener la compañía del usuario.

4. En `practica/src/controllers/deliverynote.controller.js:124` primero se optimiza la firma con `imageService.optimizeSignature`, y en `practica/src/controllers/deliverynote.controller.js:125-130` se intenta subir esa firma con `storageService.uploadBuffer`. Si esa subida falla y lanza excepción, no se ejecutan las asignaciones de `signed`, `signedAt`, `signatureUrl` y `signaturePublicId` de `practica/src/controllers/deliverynote.controller.js:132-135`. Tampoco se genera/sube el PDF ni se ejecuta `await deliveryNote.save()` de `practica/src/controllers/deliverynote.controller.js:137-147`. Por tanto, en MongoDB el albarán no queda firmado; como mucho, si el proveedor externo hubiera llegado a crear algún recurso antes de fallar, quedaría un posible archivo huérfano en Cloudinary, pero la base de datos no lo referencia.

5. En `practica/src/controllers/deliverynote.controller.js:161-162` se impide borrar un albarán firmado, lo que protege directamente el documento firmado. Sin embargo, en `practica/src/controllers/client.controller.js:68-85` sí se permite actualizar un cliente sin comprobar si tiene albaranes firmados asociados. Esto es parcialmente incoherente con la idea de que “lo firmado es inmutable”, porque los albaranes se populan con datos del cliente y un cambio posterior podría alterar la información mostrada en consultas o PDFs generados de nuevo. Yo cambiaría el diseño para guardar una copia histórica de los datos del cliente/proyecto dentro del albarán al firmar, o bloquear la edición de campos críticos como nombre, CIF y dirección cuando existan albaranes firmados asociados.

## Proceso

Tiempo total invertido: 1 semana aproximadamente.

Herramientas usadas: Visual Studio Code, Cursor, PowerShell, GitHub Desktop, GitHub Actions, Jest, Supertest, mongodb-memory-server y ChatGPT.