import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.query);
      // Update req.query with parsed/validated values
      Object.assign(req.query, result);
      next();
    } catch (error) {
      console.error('Query validation error:', error);
      console.error('Query params:', req.query);
      next(error);
    }
  };
};

