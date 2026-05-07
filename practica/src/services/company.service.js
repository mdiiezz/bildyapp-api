import { AppError } from '../utils/AppError.js';

export const ensureCompany = (user) => {
  if (!user?.company) {
    throw AppError.badRequest('El usuario debe tener una compañía asociada', 'COMPANY_REQUIRED');
  }
  return user.company;
};
