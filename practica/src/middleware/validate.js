import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    req.body = parsed.body ?? req.body;
    req.queryData = parsed.query ?? req.query;
    req.paramsData = parsed.params ?? req.params;

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      next(AppError.validation(details));
      return;
    }

    next(error);
  }
};
