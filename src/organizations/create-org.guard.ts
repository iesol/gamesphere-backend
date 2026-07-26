import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './organization.entity';
import { OrganizationUser } from '../users/organization-user.entity';

@Injectable()
export class CreateOrgGuard implements CanActivate {
  constructor(
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    @InjectRepository(OrganizationUser)
    private orgUserRepo: Repository<OrganizationUser>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    const orgCount = await this.orgRepo.count();
    if (orgCount === 0) return true;
    const memberships = await this.orgUserRepo.find({ where: { userId: user.id } });
    const isSuperAdmin = memberships.some((m) => m.roles?.includes('super_admin'));
    if (!isSuperAdmin) throw new ForbiddenException('Only super admins can create organizations');
    return true;
  }
}
