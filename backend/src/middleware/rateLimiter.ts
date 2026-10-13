import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryRateLimit = new Map<string, RateLimitRecord>();

export function rateLimiter(options: { maxRequests: number; windowSeconds: number }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const key = `${req.baseUrl}:${ip}`;
    const now = Date.now();

    const record = memoryRateLimit.get(key);

    if (!record || now > record.resetAt) {
      memoryRateLimit.set(key, {
        count: 1,
        resetAt: now + options.windowSeconds * 1000,
      });
      next();
      return;
    }

    if (record.count >= options.maxRequests) {
      const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', waitSeconds);
      throw new AppError(
        `Too many requests. Please try again in ${waitSeconds} seconds.`,
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    record.count += 1;
    next();
  };
}
