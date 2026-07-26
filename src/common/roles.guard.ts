import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContext } from './tenant-context';
import { OrganizationUser } from '../users/organization-user.entity';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(OrganizationUser)
    private orgUserRepo: Repository<OrganizationUser>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!requiredRoles) return true;
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    const orgId = TenantContext.get();
    if (!user || !orgId) throw new ForbiddenException();
    const membership = await this.orgUserRepo.findOne({ where: { userId: user.id, orgId } });
    if (!membership) throw new ForbiddenException('No organization membership');
    return requiredRoles.some((r) => membership.roles.includes(r));
  }
}

export const Roles = (...roles: string[]) => {
  const decorator = (target: any, key?: string, descriptor?: any) => {
    Reflect.defineMetadata(ROLES_KEY, roles, descriptor ? descriptor.value : target);
    return descriptor || target;
  };
  return decorator;
};
