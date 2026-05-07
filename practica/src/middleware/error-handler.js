import mongoose from 'mongoose';
import { sendSlackError } from '../services/logger.service.js';
import { AppError } from '../utils/AppError.js';

export const notFoundHandler = (req, res, next) => {
  next(AppError.notFound(`Ruta ${req.method} ${req.originalUrl}`));
};

export const errorHandler = async (err, req, res, next) => {
  console.error('Error:', err.message);

  let statusCode = err.statusCode || 500;
  let response = {
    error: true,
    message: err.message || 'Error interno del servidor',
    code: err.code || 'INTERNAL_ERROR'
  };

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    response = {
      error: true,
      message: 'Error de validación',
      code: 'VALIDATION_ERROR',
      details: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }))
    };
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    response = { error: true, message: `Valor inválido para '${err.path}'`, code: 'CAST_ERROR' };
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'campo único';
    response = { error: true, message: `Ya existe un registro con ese ${field}`, code: 'DUPLICATE_KEY' };
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    response = { error: true, message: 'Archivo demasiado grande. Máximo 5 MB.', code: 'FILE_TOO_LARGE' };
  } else if (err.message?.includes('Tipo de archivo no permitido')) {
    statusCode = 400;
    response = { error: true, message: err.message, code: 'INVALID_FILE_TYPE' };
  } else if (err.isOperational) {
    response = {
      error: true,
      message: err.message,
      code: err.code,
      ...(err.details && { details: err.details })
    };
  } else {
    const isProduction = process.env.NODE_ENV === 'production';
    response = {
      error: true,
      message: isProduction ? 'Error interno del servidor' : err.message,
      code: 'INTERNAL_ERROR',
      ...(!isProduction && { stack: err.stack })
    };
  }

  await sendSlackError({ err, req, statusCode });
  return res.status(statusCode).json(response);
};
