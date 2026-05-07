import { z } from 'zod';

const email = z.string().email('Email no válido').trim().toLowerCase();
const password = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres');
const requiredText = z.string().trim().min(1, 'Campo obligatorio');

const addressSchema = z.object({
  street: requiredText,
  number: requiredText,
  postal: requiredText,
  city: requiredText,
  province: requiredText
});

export const registerSchema = z.object({
  body: z.object({
    email,
    password
  })
});

export const validationSchema = z.object({
  body: z.object({
    code: z.string().regex(/^\d{6}$/, 'El código debe tener exactamente 6 dígitos')
  })
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password
  })
});

export const personalDataSchema = z.object({
  body: z.object({
    name: requiredText,
    lastName: requiredText,
    nif: requiredText.transform((value) => value.toUpperCase()),
    address: addressSchema.optional()
  })
});

export const companySchema = z.object({
  body: z.object({
    name: z.string().trim().optional(),
    cif: z.string().trim().transform((value) => value.toUpperCase()).optional(),
    isFreelance: z.boolean().default(false),
    address: addressSchema.optional()
  }).refine((data) => {
    if (data.isFreelance) return true;
    return Boolean(data.name && data.cif && data.address);
  }, {
    message: 'Si no eres autónomo, debes enviar name, cif y address'
  })
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: requiredText
  })
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().trim().optional()
  })
});

export const passwordSchema = z.object({
  body: z.object({
    currentPassword: password,
    newPassword: password
  }).refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente de la actual',
    path: ['newPassword']
  })
});

export const inviteSchema = z.object({
  body: z.object({
    email,
    password,
    name: requiredText.optional(),
    lastName: requiredText.optional(),
    nif: requiredText.transform((value) => value.toUpperCase()).optional()
  })
});
