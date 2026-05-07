import { Router } from 'express';
import {
  createProject,
  deleteProject,
  getProject,
  listArchivedProjects,
  listProjects,
  restoreProject,
  updateProject
} from '../controllers/project.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  createProjectSchema,
  deleteProjectSchema,
  getProjectSchema,
  listProjectSchema,
  updateProjectSchema
} from '../validators/project.validator.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /api/project:
 *   post:
 *     tags: [Proyectos]
 *     summary: Crear proyecto
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProjectInput' }
 *     responses:
 *       201: { description: Proyecto creado }
 */
router.post('/', validate(createProjectSchema), createProject);
router.get('/', validate(listProjectSchema), listProjects);
router.get('/archived', listArchivedProjects);
router.get('/:id', validate(getProjectSchema), getProject);
router.put('/:id', validate(updateProjectSchema), updateProject);
router.delete('/:id', validate(deleteProjectSchema), deleteProject);
router.patch('/:id/restore', validate(getProjectSchema), restoreProject);

export default router;
