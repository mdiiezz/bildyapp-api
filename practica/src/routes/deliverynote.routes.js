import { Router } from 'express';
import {
  createDeliveryNote,
  deleteDeliveryNote,
  downloadDeliveryNotePdf,
  getDeliveryNote,
  listDeliveryNotes,
  signDeliveryNote
} from '../controllers/deliverynote.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { uploadSignature } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  createDeliveryNoteSchema,
  deleteDeliveryNoteSchema,
  getDeliveryNoteSchema,
  listDeliveryNoteSchema,
  pdfDeliveryNoteSchema,
  signDeliveryNoteSchema
} from '../validators/deliverynote.validator.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /api/deliverynote:
 *   post:
 *     tags: [Albaranes]
 *     summary: Crear albarán
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/DeliveryNoteInput' }
 *     responses:
 *       201: { description: Albarán creado }
 */
router.post('/', validate(createDeliveryNoteSchema), createDeliveryNote);
router.get('/', validate(listDeliveryNoteSchema), listDeliveryNotes);
router.get('/pdf/:id', validate(pdfDeliveryNoteSchema), downloadDeliveryNotePdf);
router.get('/:id', validate(getDeliveryNoteSchema), getDeliveryNote);
router.patch('/:id/sign', validate(signDeliveryNoteSchema), uploadSignature, signDeliveryNote);
router.delete('/:id', validate(deleteDeliveryNoteSchema), deleteDeliveryNote);

export default router;
