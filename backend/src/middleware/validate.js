import { ZodError } from 'zod';

/**
 * Middleware factory — validates req.body against a Zod schema.
 * On success, attaches parsed+transformed data to req.validatedBody.
 * On failure, returns 400 with field-level errors.
 */
export const validate = (schema) => (req, res, next) => {
  try {
    req.validatedBody = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.errors.map((e) => ({
        field:   e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details,
      });
    }
    next(err);
  }
};

/**
 * Middleware factory — validates req.query against a Zod schema.
 * On success, attaches parsed data to req.validatedQuery.
 */
export const validateQuery = (schema) => (req, res, next) => {
  try {
    req.validatedQuery = schema.parse(req.query);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.errors.map((e) => ({
        field:   e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        details,
      });
    }
    next(err);
  }
};
