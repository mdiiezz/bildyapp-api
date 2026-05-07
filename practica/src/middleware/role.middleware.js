import { AppError } from '../utils/AppError.js';

export const checkRole = (roles = []) => (req, res, next) => {
  if (!req.user) {
    next(AppError.unauthorized('Usuario no autenticado'));
    return;
  }

  if (!roles.includes(req.user.role)) {
    next(AppError.forbidden('No tienes permisos para realizar esta acción', 'ROLE_NOT_ALLOWED'));
    return;
  }

  next();
};
