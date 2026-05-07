import { z } from 'zod';
import { addressSchema, objectId, optionalEmail, paginationQuery, requiredText } from './common.validator.js';

const projectBody = z.object({
  client: objectId,
  name: requiredText,
  projectCode: requiredText.transform((value) => value.toUpperCase()),
  address: addressSchema,
  email: optionalEmail,
  notes: z.string().trim().optional(),
  active: z.boolean().default(true)
});

export const createProjectSchema = z.object({ body: projectBody });
export const updateProjectSchema = z.object({
  params: z.object({ id: objectId }),
  body: projectBody.partial().refine((data) => Object.keys(data).length > 0, 'Debes enviar al menos un campo')
});
export const getProjectSchema = z.object({ params: z.object({ id: objectId }) });
export const deleteProjectSchema = z.object({
  params: z.object({ id: objectId }),
  query: z.object({ soft: z.coerce.boolean().default(true) })
});
export const listProjectSchema = z.object({
  query: paginationQuery.extend({
    client: objectId.optional(),
    name: z.string().trim().optional(),
    active: z.coerce.boolean().optional()
  })
});
