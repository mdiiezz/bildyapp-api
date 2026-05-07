import { Router } from 'express';
import {
  changePassword,
  deleteUser,
  getAuthenticatedUser,
  inviteUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateCompanyData,
  updatePersonalData,
  uploadCompanyLogo,
  validateEmail
} from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/role.middleware.js';
import { uploadLogo } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  companySchema,
  inviteSchema,
  loginSchema,
  logoutSchema,
  passwordSchema,
  personalDataSchema,
  refreshSchema,
  registerSchema,
  validationSchema
} from '../validators/user.validator.js';

const router = Router();

router.post('/register', validate(registerSchema), registerUser);
router.put('/validation', authMiddleware, validate(validationSchema), validateEmail);
router.post('/login', validate(loginSchema), loginUser);
router.put('/register', authMiddleware, validate(personalDataSchema), updatePersonalData);
router.patch('/company', authMiddleware, validate(companySchema), updateCompanyData);
router.patch('/logo', authMiddleware, uploadLogo, uploadCompanyLogo);
router.get('/', authMiddleware, getAuthenticatedUser);
router.post('/refresh', validate(refreshSchema), refreshAccessToken);
router.post('/logout', authMiddleware, validate(logoutSchema), logoutUser);
router.delete('/', authMiddleware, deleteUser);
router.put('/password', authMiddleware, validate(passwordSchema), changePassword);
router.post('/invite', authMiddleware, checkRole(['admin']), validate(inviteSchema), inviteUser);

export default router;
