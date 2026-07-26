import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from './tenant-context';
import { config } from '../config';

function decodeJwt(token: string): any {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64').toString());
  } catch {
    return null;
  }
}

const JWT_SECRET = config.jwtSecret;

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  async use(req: Request, _res: Response, next: NextFunction) {
    const orgId = req.headers['x-org-id'] as string;
    if (!orgId) {
      TenantContext.set(undefined);
      return next();
    }
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = decodeJwt(token);
      if (payload && payload.orgs && Array.isArray(payload.orgs)) {
        if (!payload.orgs.includes(orgId)) {
          throw new ForbiddenException('User is not a member of this organization');
        }
      }
    }
    TenantContext.set(orgId);
    next();
  }
}
