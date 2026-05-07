import { Router } from 'express';
import {
  createClient,
  deleteClient,
  getClient,
  listArchivedClients,
  listClients,
  restoreClient,
  updateClient
} from '../controllers/client.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  createClientSchema,
  deleteClientSchema,
  getClientSchema,
  listClientSchema,
  updateClientSchema
} from '../validators/client.validator.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /api/client:
 *   post:
 *     tags: [Clientes]
 *     summary: Crear cliente
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ClientInput' }
 *     responses:
 *       201: { description: Cliente creado }
 *       409: { description: CIF duplicado en la compañía }
 */
router.post('/', validate(createClientSchema), createClient);

/**
 * @openapi
 * /api/client:
 *   get:
 *     tags: [Clientes]
 *     summary: Listar clientes con paginación y filtros
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: page, in: query, schema: { type: integer, example: 1 } }
 *       - { name: limit, in: query, schema: { type: integer, example: 10 } }
 *       - { name: name, in: query, schema: { type: string, example: García } }
 *       - { name: sort, in: query, schema: { type: string, example: -createdAt } }
 *     responses:
 *       200: { description: Lista de clientes }
 */
router.get('/', validate(listClientSchema), listClients);
router.get('/archived', listArchivedClients);
router.get('/:id', validate(getClientSchema), getClient);
router.put('/:id', validate(updateClientSchema), updateClient);
router.delete('/:id', validate(deleteClientSchema), deleteClient);
router.patch('/:id/restore', validate(getClientSchema), restoreClient);

export default router;
