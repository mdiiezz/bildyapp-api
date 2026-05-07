import { z } from 'zod';
import { objectId, paginationQuery, requiredText } from './common.validator.js';

const workerSchema = z.object({
  name: requiredText,
  hours: z.coerce.number().positive('Las horas del trabajador deben ser mayores que 0')
});

export const createDeliveryNoteSchema = z.object({
  body: z.object({
    project: objectId,
    format: z.enum(['material', 'hours']),
    description: requiredText,
    workDate: z.coerce.date(),
    material: z.string().trim().optional(),
    quantity: z.coerce.number().positive().optional(),
    unit: z.string().trim().optional(),
    hours: z.coerce.number().positive().optional(),
    workers: z.array(workerSchema).optional()
  }).superRefine((data, ctx) => {
    if (data.format === 'material') {
      if (!data.material) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['material'], message: 'El material es obligatorio' });
      if (!data.quantity) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['quantity'], message: 'La cantidad es obligatoria' });
      if (!data.unit) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['unit'], message: 'La unidad es obligatoria' });
    }
    if (data.format === 'hours' && !data.hours && !data.workers?.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['hours'], message: 'Debes enviar hours o workers' });
    }
  })
});

export const getDeliveryNoteSchema = z.object({ params: z.object({ id: objectId }) });
export const signDeliveryNoteSchema = z.object({ params: z.object({ id: objectId }) });
export const deleteDeliveryNoteSchema = z.object({ params: z.object({ id: objectId }) });
export const pdfDeliveryNoteSchema = z.object({ params: z.object({ id: objectId }) });
export const listDeliveryNoteSchema = z.object({
  query: paginationQuery.extend({
    project: objectId.optional(),
    client: objectId.optional(),
    format: z.enum(['material', 'hours']).optional(),
    signed: z.coerce.boolean().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional()
  })
});
