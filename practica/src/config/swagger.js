import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index.js';

const addressSchema = {
  type: 'object',
  properties: {
    street: { type: 'string', example: 'Calle Mayor' },
    number: { type: 'string', example: '10' },
    postal: { type: 'string', example: '28013' },
    city: { type: 'string', example: 'Madrid' },
    province: { type: 'string', example: 'Madrid' }
  }
};

export const swaggerSpecs = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'BildyApp API',
      version: '1.0.0',
      description: 'API REST para digitalización de albaranes'
    },
    servers: [{ url: config.publicUrl, description: 'Servidor configurado' }],
    paths: {
      '/health': { get: { tags: ['Sistema'], summary: 'Health check', responses: { 200: { description: 'Servidor operativo' } } } },
      '/api/user/register': {
        post: { tags: ['Usuario'], summary: 'Registrar usuario', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', example: 'Password123' } } } } } }, responses: { 201: { description: 'Usuario registrado' }, 409: { description: 'Email duplicado' } } },
        put: { tags: ['Usuario'], summary: 'Actualizar datos personales', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Datos actualizados' }, 401: { description: 'No autorizado' } } }
      },
      '/api/user/validation': { put: { tags: ['Usuario'], summary: 'Validar email con código', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Email validado' }, 400: { description: 'Código inválido' } } } },
      '/api/user/login': { post: { tags: ['Usuario'], summary: 'Login', responses: { 200: { description: 'Login correcto' }, 401: { description: 'Credenciales incorrectas' } } } },
      '/api/user/company': { patch: { tags: ['Usuario'], summary: 'Crear o asociar compañía', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Compañía asociada' } } } },
      '/api/user/logo': { patch: { tags: ['Usuario'], summary: 'Subir logo de compañía', security: [{ bearerAuth: [] }], requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { logo: { type: 'string', format: 'binary' } } } } } }, responses: { 200: { description: 'Logo subido' } } } },
      '/api/user': { get: { tags: ['Usuario'], summary: 'Obtener usuario autenticado', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Usuario' } } }, delete: { tags: ['Usuario'], summary: 'Eliminar usuario', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Usuario archivado' }, 204: { description: 'Usuario eliminado' } } } },
      '/api/user/refresh': { post: { tags: ['Usuario'], summary: 'Refrescar access token', responses: { 200: { description: 'Access token renovado' } } } },
      '/api/user/logout': { post: { tags: ['Usuario'], summary: 'Logout', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Sesión cerrada' } } } },
      '/api/user/password': { put: { tags: ['Usuario'], summary: 'Cambiar contraseña', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Contraseña actualizada' } } } },
      '/api/user/invite': { post: { tags: ['Usuario'], summary: 'Invitar usuario guest', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Usuario invitado' } } } },
      '/api/client': { post: { tags: ['Clientes'], summary: 'Crear cliente', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Cliente creado' } } }, get: { tags: ['Clientes'], summary: 'Listar clientes', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Clientes paginados' } } } },
      '/api/client/archived': { get: { tags: ['Clientes'], summary: 'Listar clientes archivados', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Clientes archivados' } } } },
      '/api/client/{id}': { get: { tags: ['Clientes'], summary: 'Obtener cliente', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Cliente' }, 404: { description: 'No encontrado' } } }, put: { tags: ['Clientes'], summary: 'Actualizar cliente', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Cliente actualizado' } } }, delete: { tags: ['Clientes'], summary: 'Archivar o borrar cliente', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }, { name: 'soft', in: 'query', schema: { type: 'boolean' } }], responses: { 200: { description: 'Cliente archivado' }, 204: { description: 'Cliente borrado' } } } },
      '/api/client/{id}/restore': { patch: { tags: ['Clientes'], summary: 'Restaurar cliente', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Cliente restaurado' } } } },
      '/api/project': { post: { tags: ['Proyectos'], summary: 'Crear proyecto', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Proyecto creado' } } }, get: { tags: ['Proyectos'], summary: 'Listar proyectos', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Proyectos paginados' } } } },
      '/api/project/archived': { get: { tags: ['Proyectos'], summary: 'Listar proyectos archivados', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Proyectos archivados' } } } },
      '/api/project/{id}': { get: { tags: ['Proyectos'], summary: 'Obtener proyecto', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Proyecto' } } }, put: { tags: ['Proyectos'], summary: 'Actualizar proyecto', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Proyecto actualizado' } } }, delete: { tags: ['Proyectos'], summary: 'Archivar o borrar proyecto', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }, { name: 'soft', in: 'query', schema: { type: 'boolean' } }], responses: { 200: { description: 'Proyecto archivado' }, 204: { description: 'Proyecto borrado' } } } },
      '/api/project/{id}/restore': { patch: { tags: ['Proyectos'], summary: 'Restaurar proyecto', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Proyecto restaurado' } } } },
      '/api/deliverynote': { post: { tags: ['Albaranes'], summary: 'Crear albarán', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Albarán creado' } } }, get: { tags: ['Albaranes'], summary: 'Listar albaranes', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Albaranes paginados' } } } },
      '/api/deliverynote/{id}': { get: { tags: ['Albaranes'], summary: 'Obtener albarán', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Albarán' } } }, delete: { tags: ['Albaranes'], summary: 'Borrar albarán no firmado', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 204: { description: 'Albarán borrado' }, 409: { description: 'No se puede borrar firmado' } } } },
      '/api/deliverynote/pdf/{id}': { get: { tags: ['Albaranes'], summary: 'Descargar PDF del albarán', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'PDF o URL del PDF' } } } },
      '/api/deliverynote/{id}/sign': { patch: { tags: ['Albaranes'], summary: 'Firmar albarán', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { signature: { type: 'string', format: 'binary' } } } } } }, responses: { 200: { description: 'Albarán firmado' } } } },
      '/api/dashboard': { get: { tags: ['Dashboard'], summary: 'Estadísticas mediante aggregation pipeline', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Dashboard' } } } }
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Error de validación' },
            code: { type: 'string', example: 'VALIDATION_ERROR' }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            lastName: { type: 'string' },
            nif: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'guest'] },
            company: { type: 'string' }
          }
        },
        Company: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            owner: { type: 'string' },
            name: { type: 'string', example: 'Bildy Construcciones' },
            cif: { type: 'string', example: 'B12345678' },
            address: addressSchema,
            logo: { type: 'string' }
          }
        },
        ClientInput: {
          type: 'object', required: ['name', 'cif', 'address'],
          properties: {
            name: { type: 'string', example: 'Cliente García SL' },
            cif: { type: 'string', example: 'B87654321' },
            email: { type: 'string', example: 'cliente@example.com' },
            phone: { type: 'string', example: '+34910000000' },
            address: addressSchema
          }
        },
        Client: { allOf: [{ $ref: '#/components/schemas/ClientInput' }] },
        ProjectInput: {
          type: 'object', required: ['client', 'name', 'projectCode', 'address'],
          properties: {
            client: { type: 'string', example: '65f8b3a2c9d1e20012345678' },
            name: { type: 'string', example: 'Reforma vivienda' },
            projectCode: { type: 'string', example: 'PRJ-001' },
            address: addressSchema,
            email: { type: 'string', example: 'obra@example.com' },
            notes: { type: 'string', example: 'Proyecto urgente' },
            active: { type: 'boolean', example: true }
          }
        },
        Project: { allOf: [{ $ref: '#/components/schemas/ProjectInput' }] },
        DeliveryNoteInput: {
          type: 'object', required: ['project', 'format', 'description', 'workDate'],
          properties: {
            project: { type: 'string' },
            format: { type: 'string', enum: ['material', 'hours'] },
            description: { type: 'string', example: 'Trabajo realizado en obra' },
            workDate: { type: 'string', format: 'date', example: '2026-05-03' },
            material: { type: 'string', example: 'Cemento' },
            quantity: { type: 'number', example: 10 },
            unit: { type: 'string', example: 'sacos' },
            hours: { type: 'number', example: 8 },
            workers: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, hours: { type: 'number' } } } }
          }
        },
        DeliveryNote: { allOf: [{ $ref: '#/components/schemas/DeliveryNoteInput' }] }
      }
    }
  },
  apis: ['./src/routes/*.js']
});
