import { z } from 'zod';

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ObjectId no válido');
export const requiredText = z.string().trim().min(1, 'Campo obligatorio');
export const optionalText = z.string().trim().optional();
export const email = z.string().email('Email no válido').trim().toLowerCase();
export const optionalEmail = z.string().email('Email no válido').trim().toLowerCase().optional().or(z.literal('').transform(() => undefined));

export const addressSchema = z.object({
  street: requiredText,
  number: requiredText,
  postal: requiredText,
  city: requiredText,
  province: requiredText
});

export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sort: z.string().trim().optional()
});
