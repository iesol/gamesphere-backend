import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenant } from '../common/current-tenant.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { RolesGuard, Roles } from '../common/roles.guard';
import { OrgRole } from './organization-user.entity';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getOrgUsers(@CurrentTenant() orgId: string) {
    const memberships = await this.usersService.getOrgUsers(orgId);
    return memberships.map((m) => ({
      id: m.user.id,
      email: m.user.email,
      name: m.user.name,
      pictureUrl: m.user.pictureUrl,
      roles: m.roles,
    }));
  }

  @Get('me/org-role')
  @UseGuards(JwtAuthGuard)
  async myOrgRole(@CurrentUser() user: { id: string }, @CurrentTenant() orgId: string) {
    const membership = await this.usersService.findOrgUser(user.id, orgId);
    if (!membership) return { roles: [], userId: user.id };
    return { roles: membership.roles, userId: user.id };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async addUser(
    @Body() body: { email: string; name: string; roles: string[] },
    @CurrentTenant() orgId: string,
  ) {
    return this.usersService.onboardUser(body.email, body.name, body.roles, orgId);
  }

  @Patch(':userId/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.ORG_ADMIN, OrgRole.SUPER_ADMIN)
  async updateRoles(
    @Param('userId') userId: string,
    @Body() body: { roles: string[] },
    @CurrentTenant() orgId: string,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.usersService.findOrgUser(userId, orgId);
    if (!membership) throw new NotFoundException('User not in this org');
    const currentUserMembership = await this.usersService.findOrgUser(user.id, orgId);
    if (membership.roles.includes(OrgRole.SUPER_ADMIN) && !currentUserMembership?.roles?.includes(OrgRole.SUPER_ADMIN)) {
      throw new ForbiddenException('Cannot modify super_admin user');
    }
    membership.roles = body.roles;
    return this.usersService.saveOrgUser(membership);
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(OrgRole.ORG_ADMIN, OrgRole.SUPER_ADMIN)
  async removeUser(@Param('userId') userId: string, @CurrentTenant() orgId: string, @CurrentUser() user: { id: string }) {
    const membership = await this.usersService.findOrgUser(userId, orgId);
    if (!membership) throw new NotFoundException('User not in this org');
    const currentUserMembership = await this.usersService.findOrgUser(user.id, orgId);
    if (membership.roles.includes(OrgRole.SUPER_ADMIN) && !currentUserMembership?.roles?.includes(OrgRole.SUPER_ADMIN)) {
      throw new ForbiddenException('Cannot remove super_admin user');
    }
    await this.usersService.removeFromOrg(userId, orgId);
    return { message: 'User removed from org' };
  }
}
