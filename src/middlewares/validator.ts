import { NextFunction, Request, RequestHandler, Response } from 'express';
import status from 'http-status';
import { z, ZodError, ZodType } from 'zod';
import { formatZodError } from '../utils/errors';
import { logger } from '../utils/logger';

export function validate<T extends ZodType<any, any, any>, K extends 'body' | 'query' | 'params'>(
  schema: T,
  property: K = 'body' as K,
): RequestHandler<K extends 'params' ? z.infer<T> : any, any, K extends 'body' ? z.infer<T> : any, K extends 'query' ? z.infer<T> : any> {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[property]);

      if (property === 'query') {
        const q = req.query as Record<string, unknown>;
        for (const key of Object.keys(q)) delete q[key];
        Object.assign(q, parsed);
      } else if (property === 'params') {
        (req as any).params = parsed;
      } else {
        (req as any).body = parsed;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(status.UNPROCESSABLE_ENTITY).json(formatZodError(error));
      } else {
        logger.error('An error occurred during validation:', error as any);
        res.status(status.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
      }
    }
  };
}
