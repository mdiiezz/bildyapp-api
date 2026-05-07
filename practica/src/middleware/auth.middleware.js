import User from '../models/User.js';
import { verifyAccessToken } from '../utils/handleJwt.js';
import { AppError } from '../utils/AppError.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Token no proporcionado', 'TOKEN_REQUIRED');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (!payload?._id) {
      throw AppError.unauthorized('Token inválido o expirado', 'INVALID_TOKEN');
    }

    const user = await User.findOne({ _id: payload._id, deleted: { $ne: true } });

    if (!user) {
      throw AppError.unauthorized('Usuario no encontrado', 'USER_NOT_FOUND');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
