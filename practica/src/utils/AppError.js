export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Solicitud inválida', code = 'BAD_REQUEST', details = null) {
    return new AppError(message, 400, code, details);
  }

  static unauthorized(message = 'No autorizado', code = 'UNAUTHORIZED') {
    return new AppError(message, 401, code);
  }

  static forbidden(message = 'Acceso prohibido', code = 'FORBIDDEN') {
    return new AppError(message, 403, code);
  }

  static notFound(resource = 'Recurso', code = 'NOT_FOUND') {
    return new AppError(`${resource} no encontrado`, 404, code);
  }

  static conflict(message = 'Conflicto con recurso existente', code = 'CONFLICT') {
    return new AppError(message, 409, code);
  }

  static validation(details = [], message = 'Error de validación') {
    return new AppError(message, 400, 'VALIDATION_ERROR', details);
  }

  static tooManyRequests(message = 'Demasiadas peticiones', code = 'TOO_MANY_REQUESTS') {
    return new AppError(message, 429, code);
  }
}
