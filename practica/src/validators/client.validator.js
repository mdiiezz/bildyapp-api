import { z } from 'zod';
import { addressSchema, objectId, optionalEmail, paginationQuery, requiredText } from './common.validator.js';

const clientBody = z.object({
  name: requiredText,
  cif: requiredText.transform((value) => value.toUpperCase()),
  email: optionalEmail,
  phone: z.string().trim().optional(),
  address: addressSchema
});

export const createClientSchema = z.object({ body: clientBody });
export const updateClientSchema = z.object({
  params: z.object({ id: objectId }),
  body: clientBody.partial().refine((data) => Object.keys(data).length > 0, 'Debes enviar al menos un campo')
});
export const getClientSchema = z.object({ params: z.object({ id: objectId }) });
export const deleteClientSchema = z.object({
  params: z.object({ id: objectId }),
  query: z.object({ soft: z.coerce.boolean().default(true) })
});
export const listClientSchema = z.object({
  query: paginationQuery.extend({ name: z.string().trim().optional() })
});
